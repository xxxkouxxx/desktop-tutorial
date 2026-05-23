"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BoxStatus = "unopened" | "eliminated" | "winner";

interface Box {
  id: number;
  label: string;
  status: BoxStatus;
}

interface HistoryEntry {
  round: number;
  winnerLabel: string;
  tries: number;
  time: string;
}

interface SessionState {
  boxes: Box[];
  winnerIdx: number;
  tries: number;
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
    // quota exceeded — in-memory state is source of truth
  }
}

// ─── Game Logic ──────────────────────────────────────────────────────────────

const AREA_LABELS = ["エリアA", "エリアB", "エリアC", "エリアD"];

function buildBoxes(): Box[] {
  return AREA_LABELS.map((label, id) => ({ id, label, status: "unopened" as BoxStatus }));
}

function randomWinner(): number {
  return Math.floor(Math.random() * 4);
}

function initSession(storageKey: string): SessionState {
  return {
    boxes: buildBoxes(),
    winnerIdx: randomWinner(),
    tries: 0,
    roundNum: 1,
    done: false,
    history: loadHistory(storageKey),
  };
}

function calcRemaining(boxes: Box[]): number {
  return boxes.filter((b) => b.status === "unopened").length;
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
              <th className="py-1 px-2 text-left">R</th>
              <th className="py-1 px-2 text-left">当たり</th>
              <th className="py-1 px-2 text-center">回数</th>
              <th className="py-1 px-2 text-right">時刻</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((entry, i) => (
              <tr
                key={`${entry.round}-${i}`}
                className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"}
              >
                <td className="py-1 px-2">{entry.round}</td>
                <td className="py-1 px-2 text-yellow-400">{entry.winnerLabel}</td>
                <td className="py-1 px-2 text-center">{entry.tries}</td>
                <td className="py-1 px-2 text-right text-slate-500">{entry.time}</td>
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
}: {
  title: string;
  storageKey: string;
  titleColor: string;
}) {
  const [session, setSession] = useState<SessionState>(() =>
    initSession(storageKey)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    (idx: number) => {
      if (session.done) return;

      setSession((prev) => {
        if (prev.done) return prev;

        const won = idx === prev.winnerIdx;
        const newTries = prev.tries + 1;
        const newBoxes: Box[] = prev.boxes.map((b) =>
          b.id === idx
            ? { ...b, status: (won ? "winner" : "eliminated") as BoxStatus }
            : b
        );

        if (won) {
          const entry: HistoryEntry = {
            round: prev.roundNum,
            winnerLabel: AREA_LABELS[prev.winnerIdx],
            tries: newTries,
            time: new Date().toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          const newHistory = [...prev.history, entry];
          saveHistory(storageKey, newHistory);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setSession((s) => ({
              boxes: buildBoxes(),
              winnerIdx: randomWinner(),
              tries: 0,
              roundNum: s.roundNum + 1,
              done: false,
              history: s.history,
            }));
          }, 1200);

          return { ...prev, boxes: newBoxes, tries: newTries, done: true, history: newHistory };
        }

        return { ...prev, boxes: newBoxes, tries: newTries };
      });
    },
    [session.done, storageKey]
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
            disabled={session.done}
            onClick={() => handleClick(box.id)}
          />
        ))}
      </div>

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
        />
        <SessionPanel
          title="アポリオン"
          storageKey="limbus-history-apollyon"
          titleColor="text-purple-400"
        />
      </div>
    </main>
  );
}
