"""
BrewLog パイプライン: テイスティングメモ（テキスト）→ Groq 解析 → Notion 保存

使い方:
  # 新規作成（テキストファイルから）
  python pipeline.py sample_note.txt

  # 標準入力から
  echo "エチオピア ゲシャ、酸味強め..." | python pipeline.py

  # 既存ページを追加データで更新
  python pipeline.py sample_note.txt --update <page_id>
"""

import argparse
import json
import sys

from groq_parser import groq_parse
import brewlog_notion as nc


def run(text: str, page_id: str | None = None) -> None:
    print("▶ Groq でテイスティングノートを解析中...")
    data = groq_parse(text)

    print("\n解析結果:")
    print(json.dumps(data, ensure_ascii=False, indent=2))

    if page_id:
        print(f"\n▶ Notion ページ {page_id} を更新中...")
        nc.update_note(page_id, data)
        print("✓ 更新完了")
    else:
        print("\n▶ Notion に新規ノートを作成中...")
        new_id = nc.create_note(data)
        print(f"✓ 作成完了: https://notion.so/{new_id.replace('-', '')}")


def main() -> None:
    parser = argparse.ArgumentParser(description="BrewLog テイスティングノート パイプライン")
    parser.add_argument("input", nargs="?", help="テイスティングメモのテキストファイル（省略時は標準入力）")
    parser.add_argument("--update", metavar="PAGE_ID", help="既存の Notion ページIDを指定して追加更新")
    args = parser.parse_args()

    if args.input:
        text = open(args.input, encoding="utf-8").read()
    else:
        text = sys.stdin.read()

    run(text, page_id=args.update)


if __name__ == "__main__":
    main()
