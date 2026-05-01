# PTChatLog — Ashita v4 Addon

Party / Alliance / Battle chat logger for Final Fantasy XI.  
Captures in-game messages and exports AI-ready Markdown reports for strategy analysis.

## Features

- **Chat tab** — logs party (blue) and alliance (green) chat with timestamps
- **Battle tab** — captures configurable battle-message modes from packet 0x017
- **Keyword highlighting** — own name and custom keywords highlighted in yellow/custom color
- **Player / keyword filters** — silently drop messages by sender or content
- **Settings UI** — adjust transparency, font scale, max lines, colors, and battle modes in-game
- **AI export** — one-click Markdown file containing:
  - System prompt for LLM strategy generation
  - Player / party metadata (job, level)
  - Party/Alliance chat log section
  - Battle log section

## Installation

1. Copy `PTChatLog.lua` into `<Ashita>/addons/PTChatLog/PTChatLog.lua`
2. In-game: `/addon load PTChatLog`

## Usage

| Button | Action |
|--------|--------|
| Export | Save `logs/PTChatLog_YYYYMMDD_HHMMSS.md` |
| Clear  | Clear both chat and battle buffers |
| Settings | Open settings panel |
| Filters | Open filter panel |
| Lock | Prevent window from being moved or resized |

## Calibrating Battle Modes

FFXI battle-message mode values vary by server / client version.  
To identify the correct values:

1. Open **Settings** and enable **Battle Debug (capture all modes)**
2. Play through a fight; all packet modes appear in the **Battle** tab as `[HH:MM:SS][MXX]`
3. Note the hex values (`MXX`) for the messages you want to keep
4. Go to **Settings → Battle Message Modes** — add those values and remove unwanted ones
5. Disable **Battle Debug**

Default pre-loaded modes: `0x65 0x66 0x67 0x79 0x7A 0x7E`

## Export Format

```
## System Prompt
...

## Metadata
- Date: YYYY-MM-DD HH:MM
- Player: Name (JOB Lv.N)
- Party:
  - [0] Name (JOB Lv.N)
  ...

## Party / Alliance Chat
```log
[HH:MM:SS][P] <Name> message
[HH:MM:SS][A] <Name> message
```

## Battle Log
```log
[HH:MM:SS][M65] Warrior uses Raging Rush.
```
```

## Version History

| Version | Notes |
|---------|-------|
| 1.5.0 | Battle log tab, AI metadata, settings UI, keyword highlights, filters |
| 1.3.0 | Initial release (party/alliance capture, basic export) |
