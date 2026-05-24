"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BoxStatus = "unopened" | "selected" | "eliminated" | "winner";

interface Box {
  id: number;
  label: string;
  status: BoxStatus;
}

interface HistoryEntry {
  area: string;
  result: "当たり" | "ハズレ";
  date: string; // mm/dd
}

interface SessionState {
  boxes: Box[];
  selectedIdx: number | null;
  roundNum: number;
  done: boolean;
  history: HistoryEntry[];
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadHistory(key: string): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(key: string, history: HistoryEntry[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(history.slice(-100)));
  } catch {
    // quota exceeded
  }
}

// ─── Game Logic ──────────────────────────────────────────────────────────────

function buildBoxes(areaLabels: string[]): Box[] {
  return areaLabels.map((label, id) => ({ id, label, status: "unopened" as BoxStatus }));
}

function getDate(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function initSession(storageKey: string, areaLabels: string[]): SessionState {
  return {
    boxes: buildBoxes(areaLabels),
    selectedIdx: null,
    roundNum: 1,
    done: false,
    history: loadHistory(storageKey),
  };
}

function calcRemaining(boxes: Box[]): number {
  return boxes.filter((b) => b.status === "unopened" || b.status === "selected").length;
}

// ─── AreaBox Button ───────────────────────────────────────────────────────────

function AreaBoxButton({
  box,
  disabled,
  onClick,
}: {
  box: Box;
  disabled: boolean;
  onClick: () => void;
}) {
  const base =
    "relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl text-base font-bold transition-all duration-200 select-none";

  const styles: Record<BoxStatus, string> = {
    unopened:
      "bg-slate-700 hover:bg-slate-500 hover:scale-105 cursor-pointer text-white shadow-lg",
    selected:
      "bg-blue-600 ring-4 ring-blue-400 text-white shadow-xl cursor-default scale-105",
    eliminated:
      "bg-slate-900 opacity-40 cursor-not-allowed text-slate-500",
    winner:
      "bg-yellow-400 text-slate-900 ring-4 ring-yellow-300 animate-pulse cursor-default shadow-xl",
  };

  return (
    <button
      className={`${base} ${styles[box.status]}`}
      onClick={onClick}
      disabled={disabled || box.status !== "unopened"}
      aria-label={box.label}
    >
      <span>{box.label}</span>
      {box.status === "eliminated" && (
        <span className="absolute text-3xl opacity-60">❌</span>
      )}
      {box.status === "winner" && (
        <span className="absolute text-3xl">⭐</span>
      )}
    </button>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────

function HistoryTable({
  history,
  onClear,
}: {
  history: HistoryEntry[];
  onClear: () => void;
}) {
  if (history.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center mt-2">履歴なし</p>
    );
  }
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400">{history.length}件</span>
        <button
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300 underline"
        >
          クリア
        </button>
      </div>
      <div className="overflow-y-auto max-h-48 rounded-lg border border-slate-700">
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              <th className="py-1 px-2 text-left">エリア</th>
              <th className="py-1 px-2 text-center">判定</th>
              <th className="py-1 px-2 text-right">日付</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((entry, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"}>
                <td className="py-1 px-2">{entry.area}</td>
                <td className={`py-1 px-2 text-center font-bold ${entry.result === "当たり" ? "text-yellow-400" : "text-slate-500"}`}>
                  {entry.result}
                </td>
                <td className="py-1 px-2 text-right text-slate-500">{entry.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Session Panel ─────────────────────────────────────────────────────────────

function SessionPanel({
  title,
  storageKey,
  titleColor,
  areaLabels,
}: {
  title: string;
  storageKey: string;
  titleColor: string;
  areaLabels: string[];
}) {
  const [session, setSession] = useState<SessionState>(() =>
    initSession(storageKey, areaLabels)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBoxClick = useCallback((idx: number) => {
    setSession((prev) => {
      if (prev.done || prev.selectedIdx !== null) return prev;
      const newBoxes = prev.boxes.map((b) =>
        b.id === idx ? { ...b, status: "selected" as BoxStatus } : b
      );
      return { ...prev, boxes: newBoxes, selectedIdx: idx };
    });
  }, []);

  const handleResult = useCallback(
    (result: "当たり" | "ハズレ") => {
      setSession((prev) => {
        if (prev.selectedIdx === null) return prev;
        const idx = prev.selectedIdx;

        const areaName = prev.boxes.find((b) => b.id === idx)?.label ?? "";
        const entry: HistoryEntry = { area: areaName, result, date: getDate() };
        const newHistory = [...prev.history, entry];
        saveHistory(storageKey, newHistory);

        if (result === "当たり") {
          const newBoxes = prev.boxes.map((b) =>
            b.id === idx ? { ...b, status: "winner" as BoxStatus } : b
          );

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setSession((s) => ({
              boxes: buildBoxes(areaLabels),
              selectedIdx: null,
              roundNum: s.roundNum + 1,
              done: false,
              history: s.history,
            }));
          }, 1200);

          return { ...prev, boxes: newBoxes, selectedIdx: null, done: true, history: newHistory };
        } else {
          const newBoxes = prev.boxes.map((b) =>
            b.id === idx ? { ...b, status: "eliminated" as BoxStatus } : b
          );
          return { ...prev, boxes: newBoxes, selectedIdx: null, history: newHistory };
        }
      });
    },
    [storageKey, areaLabels]
  );

  const clearHistory = useCallback(() => {
    saveHistory(storageKey, []);
    setSession((prev) => ({ ...prev, history: [] }));
  }, [storageKey]);

  const remaining = calcRemaining(session.boxes);
  const prob = `1/${remaining}`;
  const pct = `${Math.round((1 / remaining) * 100)}%`;

  const probColor =
    remaining === 4
      ? "text-slate-300"
      : remaining === 3
      ? "text-yellow-300"
      : remaining === 2
      ? "text-orange-400"
      : "text-red-400";

  const selectedBox =
    session.selectedIdx !== null
      ? session.boxes.find((b) => b.id === session.selectedIdx)
      : null;

  return (
    <div className="flex flex-col bg-slate-800 rounded-2xl p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${titleColor}`}>{title}</h2>
        <span className="text-xs text-slate-400">ラウンド {session.roundNum}</span>
      </div>

      {/* Probability */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">現在の確率</span>
        <span className={`text-2xl font-mono font-bold ${probColor}`}>{prob}</span>
        <span className={`text-sm ${probColor}`}>({pct})</span>
      </div>

      {/* 4 boxes in 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {session.boxes.map((box) => (
          <AreaBoxButton
            key={box.id}
            box={box}
            disabled={session.done || session.selectedIdx !== null}
            onClick={() => handleBoxClick(box.id)}
          />
        ))}
      </div>

      {/* 当たり / ハズレ panel */}
      {selectedBox && !session.done && (
        <div className="flex flex-col items-center gap-2 bg-slate-700 rounded-xl p-3">
          <span className="text-sm text-slate-300 font-semibold">
            {selectedBox.label} の結果は？
          </span>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleResult("当たり")}
              className="flex-1 py-2 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors"
            >
              当たり ⭐
            </button>
            <button
              onClick={() => handleResult("ハズレ")}
              className="flex-1 py-2 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-500 transition-colors"
            >
              ハズレ ❌
            </button>
          </div>
        </div>
      )}

      {/* Win message */}
      {session.done && (
        <p className="text-center text-yellow-400 font-bold animate-bounce text-sm">
          当たり！ 次のラウンドを準備中…
        </p>
      )}

      {/* History */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          履歴
        </p>
        <HistoryTable history={session.history} onClear={clearHistory} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-8 px-4">
      <h1 className="text-3xl font-bold mb-1 tracking-tight">
        リンバス 箱開けメモ
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        4エリアのうち1つが当たり。外れるたびに確率が上がります。
      </p>

      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SessionPanel
          title="テメナス"
          storageKey="limbus-history-temenus"
          titleColor="text-blue-400"
          areaLabels={["テメナス北塔", "テメナス西塔", "テメナス東塔", "テメナス中央塔"]}
        />
        <SessionPanel
          title="アポリオン"
          storageKey="limbus-history-apollyon"
          titleColor="text-purple-400"
          areaLabels={["アポリオンNW", "アポリオンSW", "アポリオンNE", "アポリオンSE"]}
        />
      </div>
    </main>
  );
}
