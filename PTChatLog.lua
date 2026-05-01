--[[
    PTChatLog.lua
    Ashita v4 Addon — Party / Alliance / Battle Chat Logger
    Version : 1.5.0
    Author  : FF11 Addon Developer Expert

    Captures party (0x05), alliance (0x0D), and configurable battle-message
    modes from packet 0x017, displays them in an ImGui floating window with
    Chat / Battle tabs, and exports AI-ready Markdown reports.
--]]

addon.name        = 'PTChatLog'
addon.version     = '1.5.0'
addon.author      = 'FF11 Addon Developer Expert'
addon.description = 'Party/Alliance/Battle chat logger with AI strategy report generation'

require('common')
local settings = require('settings')
local imgui    = require('imgui')

-------------------------------------------------------------------------------
-- Constants
-------------------------------------------------------------------------------
local PACKET_CHAT   = 0x17
local MODE_PARTY    = 0x05
local MODE_ALLIANCE = 0x0D

-- Default battle-message mode candidates (0x017 packet mode field).
-- Enable battle_debug in Settings to capture ALL modes and identify exact
-- values for your server / client version, then register them here.
local DEFAULT_BATTLE_MODES = {0x65, 0x66, 0x67, 0x79, 0x7A, 0x7E}

local JOB_NAMES = {
    [0]='None',  [1]='WAR',  [2]='MNK',  [3]='WHM',  [4]='BLM',
    [5]='RDM',   [6]='THF',  [7]='PLD',  [8]='DRK',  [9]='BST',
    [10]='BRD',  [11]='RNG', [12]='SAM', [13]='NIN', [14]='DRG',
    [15]='SMN',  [16]='BLU', [17]='COR', [18]='PUP', [19]='DNC',
    [20]='SCH',  [21]='GEO', [22]='RUN',
}

-------------------------------------------------------------------------------
-- Default settings
-------------------------------------------------------------------------------
local default_settings = {
    window  = { x=100,  y=100, w=540, h=440, visible=true, locked=false },
    display = { bg_alpha=0.85, font_scale=1.0, max_lines=300, auto_scroll=true },
    colors  = {
        party    = {0.45, 0.85, 1.0,  1.0},
        alliance = {0.55, 1.0,  0.55, 1.0},
        battle   = {1.0,  0.75, 0.3,  1.0},
        highlight= {1.0,  1.0,  0.2,  1.0},
        keyword  = {1.0,  0.6,  0.2,  1.0},
    },
    highlight_keywords = {},
    filter_players     = {},
    filter_keywords    = {},
    battle_modes       = {},
    battle_debug       = false,
}

local cfg = settings.load(default_settings)

-- Upgrade guards: fill nil keys from older saved settings
cfg.highlight_keywords = cfg.highlight_keywords or {}
cfg.filter_players     = cfg.filter_players     or {}
cfg.filter_keywords    = cfg.filter_keywords    or {}
cfg.battle_debug       = (cfg.battle_debug ~= nil) and cfg.battle_debug or false
if not cfg.battle_modes or #cfg.battle_modes == 0 then
    cfg.battle_modes = {}
    for _, v in ipairs(DEFAULT_BATTLE_MODES) do
        cfg.battle_modes[#cfg.battle_modes+1] = v
    end
end

-------------------------------------------------------------------------------
-- Runtime state
-------------------------------------------------------------------------------
local chat_buffer        = {}
local battle_buffer      = {}
local is_open            = {true}
local show_settings      = {false}
local show_filters       = {false}
local chat_scroll_down   = false
local battle_scroll_down = false

-- InputText scratch buffers (64-byte NUL-padded)
local ui_new_kw_word  = {string.rep('\0', 64)}
local ui_new_kw_color = {1.0, 0.6, 0.2, 1.0}
local ui_new_fp_name  = {string.rep('\0', 64)}
local ui_new_fk_word  = {string.rep('\0', 64)}
local ui_new_bm_val   = {0}

-- Settings window scratch values (written from cfg on open, read back on Save)
local sw = {}

-------------------------------------------------------------------------------
-- Helpers
-------------------------------------------------------------------------------
local function read_byte(data, offset)
    return string.byte(data, offset + 1)
end

local function read_string(data, offset)
    local result, i = {}, offset + 1
    while i <= #data do
        local b = string.byte(data, i)
        if b == 0 then break end
        result[#result+1] = string.char(b)
        i = i + 1
    end
    return table.concat(result)
end

local function ensure_dir(path)
    os.execute('mkdir "' .. path:gsub('/', '\\') .. '" 2>NUL')
end

local function is_battle_mode(mode)
    for _, m in ipairs(cfg.battle_modes) do
        if m == mode then return true end
    end
    return false
end

local function buf_text(buf)
    return buf[1]:match('^[^\0]*') or ''
end

-------------------------------------------------------------------------------
-- Filter / highlight
-------------------------------------------------------------------------------
local function is_filtered(entry)
    local sl = entry.sender:lower()
    for _, name in ipairs(cfg.filter_players) do
        if sl == name then return true end
    end
    local ml = entry.message:lower()
    for _, kw in ipairs(cfg.filter_keywords) do
        if ml:find(kw, 1, true) then return true end
    end
    return false
end

local function find_highlight(message, own_name)
    if own_name and own_name ~= '' and
       message:lower():find(own_name:lower(), 1, true) then
        return cfg.colors.highlight
    end
    for _, ke in ipairs(cfg.highlight_keywords) do
        if ke.word and ke.word ~= '' and
           message:lower():find(ke.word:lower(), 1, true) then
            return ke.color
        end
    end
    return nil
end

-------------------------------------------------------------------------------
-- Buffer management
-------------------------------------------------------------------------------
local function add_to_buffer(entry)
    if is_filtered(entry) then return end
    chat_buffer[#chat_buffer+1] = entry
    while #chat_buffer > cfg.display.max_lines do
        table.remove(chat_buffer, 1)
    end
    chat_scroll_down = true
end

local function add_to_battle_buffer(entry)
    battle_buffer[#battle_buffer+1] = entry
    while #battle_buffer > cfg.display.max_lines do
        table.remove(battle_buffer, 1)
    end
    battle_scroll_down = true
end

-------------------------------------------------------------------------------
-- AI metadata
-------------------------------------------------------------------------------
local function get_metadata()
    local lines = {'## Metadata', '- Date: ' .. os.date('%Y-%m-%d %H:%M')}

    local ok_p, player = pcall(function()
        return AshitaCore:GetMemoryManager():GetPlayer()
    end)
    if ok_p and player then
        local jname = JOB_NAMES[player:GetMainJob()] or ('Job' .. tostring(player:GetMainJob()))
        lines[#lines+1] = string.format('- Player: %s (%s Lv.%d)',
            player:GetName(), jname, player:GetMainJobLevel())
    end

    lines[#lines+1] = '- Party:'
    local ok_pt, party = pcall(function()
        return AshitaCore:GetMemoryManager():GetParty()
    end)
    if ok_pt and party then
        for i = 0, 17 do
            local ok_m, member = pcall(function() return party:GetMemberByIndex(i) end)
            if ok_m and member and member:GetIsActive() then
                local jname = JOB_NAMES[member:GetMainJob()] or ('Job' .. tostring(member:GetMainJob()))
                lines[#lines+1] = string.format('  - [%d] %s (%s Lv.%d)',
                    i, member:GetName(), jname, member:GetMainJobLevel())
            end
        end
    end

    return table.concat(lines, '\n')
end

-------------------------------------------------------------------------------
-- Export
-------------------------------------------------------------------------------
local function export_logs()
    local log_dir = ashita.addon.path .. 'logs/'
    ensure_dir(log_dir)

    local fname = log_dir .. 'PTChatLog_' .. os.date('%Y%m%d_%H%M%S') .. '.md'
    local f, err = io.open(fname, 'w')
    if not f then
        print('[PTChatLog] Export failed: ' .. tostring(err))
        return
    end

    f:write('## System Prompt\n')
    f:write('以下はFF11コンテンツ中のパーティ会話と戦闘ログです。\n')
    f:write('ジョブ別の役割と時系列フローを分析し、作戦議事録を生成してください。\n\n')

    f:write(get_metadata())
    f:write('\n\n')

    f:write('## Party / Alliance Chat\n')
    f:write('```log\n')
    for _, e in ipairs(chat_buffer) do
        local ch = (e.mode == MODE_PARTY) and 'P' or 'A'
        f:write(string.format('[%s][%s] <%s> %s\n',
            e.timestamp, ch, e.sender, e.message))
    end
    f:write('```\n\n')

    f:write('## Battle Log\n')
    f:write('```log\n')
    for _, e in ipairs(battle_buffer) do
        f:write(string.format('[%s][M%02X] %s\n',
            e.timestamp, e.mode, e.message))
    end
    f:write('```\n')

    f:close()
    print('[PTChatLog] Exported: ' .. fname)
end

-------------------------------------------------------------------------------
-- Packet handler
-------------------------------------------------------------------------------
ashita.events.register('packet_in', 'ptchatlog_packet_in', function(e)
    if e.id ~= PACKET_CHAT then return end

    local mode    = read_byte(e.data_raw, 0x04)
    local sender  = read_string(e.data_raw, 0x08)
    -- NOTE: if sender is always 16-byte padded on your server, replace with:
    --   local msg_off = 0x18
    local msg_off = 0x08 + #sender + 1
    local message = read_string(e.data_raw, msg_off)

    if mode == MODE_PARTY or mode == MODE_ALLIANCE then
        local color = (mode == MODE_PARTY) and cfg.colors.party or cfg.colors.alliance
        add_to_buffer({
            timestamp = os.date('%H:%M:%S'),
            sender    = sender,
            message   = message,
            mode      = mode,
            color     = color,
        })

    elseif is_battle_mode(mode) or cfg.battle_debug then
        add_to_battle_buffer({
            timestamp = os.date('%H:%M:%S'),
            message   = message,
            mode      = mode,
        })
    end
end)

-------------------------------------------------------------------------------
-- Render: Settings window
-------------------------------------------------------------------------------
local function render_settings()
    if not show_settings[1] then return end

    imgui.SetNextWindowSize({420, 560}, ImGuiCond_Once)
    if imgui.Begin('PTChatLog Settings', show_settings, ImGuiWindowFlags_None) then

        -- Display
        imgui.Text('Display')
        imgui.Separator()

        local ml_ref = {cfg.display.max_lines}
        if imgui.InputInt('Max Lines', ml_ref, 10, 100) then
            cfg.display.max_lines = math.max(50, math.min(2000, ml_ref[1]))
        end

        local ba_ref = {cfg.display.bg_alpha}
        if imgui.SliderFloat('BG Alpha', ba_ref, 0.0, 1.0) then
            cfg.display.bg_alpha = ba_ref[1]
        end

        local fs_ref = {cfg.display.font_scale}
        if imgui.SliderFloat('Font Scale', fs_ref, 0.5, 2.0) then
            cfg.display.font_scale = fs_ref[1]
        end

        local as_ref = {cfg.display.auto_scroll}
        if imgui.Checkbox('Auto Scroll', as_ref) then
            cfg.display.auto_scroll = as_ref[1]
        end

        local bd_ref = {cfg.battle_debug}
        imgui.SameLine()
        if imgui.Checkbox('Battle Debug (capture all modes)', bd_ref) then
            cfg.battle_debug = bd_ref[1]
        end

        imgui.Spacing()

        -- Colors
        imgui.Text('Colors')
        imgui.Separator()
        imgui.ColorEdit4('Party',    cfg.colors.party)
        imgui.ColorEdit4('Alliance', cfg.colors.alliance)
        imgui.ColorEdit4('Battle',   cfg.colors.battle)
        imgui.ColorEdit4('Own Name / Highlight', cfg.colors.highlight)
        imgui.ColorEdit4('Keyword',  cfg.colors.keyword)

        imgui.Spacing()

        -- Keyword highlights
        imgui.Text('Keyword Highlights')
        imgui.Separator()
        imgui.InputText('Word##kw_in', ui_new_kw_word, 64)
        imgui.SameLine()
        imgui.ColorEdit4('Color##kw_col', ui_new_kw_color)
        imgui.SameLine()
        if imgui.Button('Add##kw_add') then
            local word = buf_text(ui_new_kw_word)
            if word ~= '' then
                cfg.highlight_keywords[#cfg.highlight_keywords+1] = {
                    word  = word,
                    color = {ui_new_kw_color[1], ui_new_kw_color[2],
                             ui_new_kw_color[3], ui_new_kw_color[4]},
                }
                ui_new_kw_word[1] = string.rep('\0', 64)
            end
        end
        for i, ke in ipairs(cfg.highlight_keywords) do
            imgui.TextColored(ke.color, ke.word)
            imgui.SameLine()
            if imgui.Button('Remove##kw' .. i) then
                table.remove(cfg.highlight_keywords, i)
                break
            end
        end

        imgui.Spacing()

        -- Battle modes
        imgui.Text('Battle Message Modes (hex)')
        imgui.Separator()
        local bm_ref = {ui_new_bm_val[1]}
        if imgui.InputInt('Mode (dec)##bm_in', bm_ref, 1, 16) then
            ui_new_bm_val[1] = math.max(0, math.min(255, bm_ref[1]))
        end
        imgui.SameLine()
        if imgui.Button('Add##bm_add') then
            local val = ui_new_bm_val[1]
            local dup = false
            for _, m in ipairs(cfg.battle_modes) do
                if m == val then dup = true; break end
            end
            if not dup and val > 0 then
                cfg.battle_modes[#cfg.battle_modes+1] = val
            end
        end
        for i, m in ipairs(cfg.battle_modes) do
            imgui.Text(string.format('0x%02X (%d)', m, m))
            imgui.SameLine()
            if imgui.Button('Remove##bm' .. i) then
                table.remove(cfg.battle_modes, i)
                break
            end
        end

        imgui.Spacing()
        imgui.Separator()
        if imgui.Button('Save Settings') then
            settings.save()
        end
    end
    imgui.End()
end

-------------------------------------------------------------------------------
-- Render: Filters window
-------------------------------------------------------------------------------
local function render_filters()
    if not show_filters[1] then return end

    imgui.SetNextWindowSize({340, 360}, ImGuiCond_Once)
    if imgui.Begin('PTChatLog Filters', show_filters, ImGuiWindowFlags_None) then

        -- Player filter
        imgui.Text('Exclude Players')
        imgui.Separator()
        imgui.InputText('Name##fp_in', ui_new_fp_name, 64)
        imgui.SameLine()
        if imgui.Button('Add##fp_add') then
            local name = buf_text(ui_new_fp_name):lower()
            if name ~= '' then
                cfg.filter_players[#cfg.filter_players+1] = name
                ui_new_fp_name[1] = string.rep('\0', 64)
            end
        end
        for i, name in ipairs(cfg.filter_players) do
            imgui.Text(name)
            imgui.SameLine()
            if imgui.Button('Remove##fp' .. i) then
                table.remove(cfg.filter_players, i)
                break
            end
        end

        imgui.Spacing()

        -- Keyword filter
        imgui.Text('Exclude Keywords')
        imgui.Separator()
        imgui.InputText('Keyword##fk_in', ui_new_fk_word, 64)
        imgui.SameLine()
        if imgui.Button('Add##fk_add') then
            local kw = buf_text(ui_new_fk_word):lower()
            if kw ~= '' then
                cfg.filter_keywords[#cfg.filter_keywords+1] = kw
                ui_new_fk_word[1] = string.rep('\0', 64)
            end
        end
        for i, kw in ipairs(cfg.filter_keywords) do
            imgui.Text(kw)
            imgui.SameLine()
            if imgui.Button('Remove##fk' .. i) then
                table.remove(cfg.filter_keywords, i)
                break
            end
        end
    end
    imgui.End()
end

-------------------------------------------------------------------------------
-- Render: Main window
-------------------------------------------------------------------------------
local function render_main()
    imgui.SetNextWindowBgAlpha(cfg.display.bg_alpha)
    imgui.SetNextWindowPos({cfg.window.x, cfg.window.y}, ImGuiCond_Once)
    imgui.SetNextWindowSize({cfg.window.w, cfg.window.h}, ImGuiCond_Once)

    local win_flags = ImGuiWindowFlags_NoCollapse
    if cfg.window.locked then
        win_flags = bit.bor(win_flags,
            ImGuiWindowFlags_NoMove, ImGuiWindowFlags_NoResize)
    end

    if imgui.Begin('PTChatLog v1.5.0', is_open, win_flags) then
        imgui.SetWindowFontScale(cfg.display.font_scale)

        -- Toolbar
        if imgui.Button('Export') then export_logs() end
        imgui.SameLine()
        if imgui.Button('Clear') then
            chat_buffer   = {}
            battle_buffer = {}
        end
        imgui.SameLine()
        if imgui.Button('Settings') then
            show_settings[1] = not show_settings[1]
        end
        imgui.SameLine()
        if imgui.Button('Filters') then
            show_filters[1] = not show_filters[1]
        end
        imgui.SameLine()
        local locked_ref = {cfg.window.locked}
        if imgui.Checkbox('Lock', locked_ref) then
            cfg.window.locked = locked_ref[1]
        end

        imgui.Separator()

        -- Tab bar
        if imgui.BeginTabBar('##ptcl_tabs') then

            -- ── Chat tab ──────────────────────────────────────────────────
            if imgui.BeginTabItem('Chat') then
                local child_flags = ImGuiWindowFlags_HorizontalScrollbar
                imgui.BeginChild('chat_region', {0, -1}, false, child_flags)

                local own_name = ''
                local ok, player = pcall(function()
                    return AshitaCore:GetMemoryManager():GetPlayer()
                end)
                if ok and player then
                    own_name = player:GetName() or ''
                end

                for _, entry in ipairs(chat_buffer) do
                    local hl    = find_highlight(entry.message, own_name)
                    local color = hl or entry.color
                    local line  = string.format('[%s] <%s> %s',
                        entry.timestamp, entry.sender, entry.message)
                    imgui.TextColored(color, line)
                    -- Sound notification on highlight match
                    if hl and ashita and ashita.sound then
                        pcall(function() ashita.sound.play(0) end)
                    end
                end

                if chat_scroll_down and cfg.display.auto_scroll then
                    imgui.SetScrollHereY(1.0)
                end
                chat_scroll_down = false

                imgui.EndChild()
                imgui.EndTabItem()
            end

            -- ── Battle tab ────────────────────────────────────────────────
            if imgui.BeginTabItem('Battle') then
                local child_flags = ImGuiWindowFlags_HorizontalScrollbar
                imgui.BeginChild('battle_region', {0, -1}, false, child_flags)

                for _, entry in ipairs(battle_buffer) do
                    local line
                    if cfg.battle_debug then
                        line = string.format('[%s][M%02X] %s',
                            entry.timestamp, entry.mode, entry.message)
                    else
                        line = string.format('[%s] %s',
                            entry.timestamp, entry.message)
                    end
                    imgui.TextColored(cfg.colors.battle, line)
                end

                if battle_scroll_down and cfg.display.auto_scroll then
                    imgui.SetScrollHereY(1.0)
                end
                battle_scroll_down = false

                imgui.EndChild()
                imgui.EndTabItem()
            end

            imgui.EndTabBar()
        end
    end
    imgui.End()
end

-------------------------------------------------------------------------------
-- Present handler
-------------------------------------------------------------------------------
ashita.events.register('d3d_present', 'ptchatlog_present', function()
    if not is_open[1] then return end
    render_main()
    render_settings()
    render_filters()
end)
