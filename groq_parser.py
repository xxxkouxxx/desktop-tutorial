"""
Groq API を使ってテイスティングメモ（自由文）を構造化 JSON に変換する。
LINEから送られてきたテキストを引継書 Section 4 のプロンプトで解析する。
"""

import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """あなたはコーヒーのテイスティングノートを解析する専門AIです。
ユーザーから送られてきたコーヒーテイスティングのメモを読み取り、
以下のJSON形式で情報を抽出してください。

フィールドが読み取れない場合は null を入れてください。
スコアは必ず1〜5の整数、総合スコアは60〜100の整数に正規化してください。
日付は YYYY-MM-DD 形式で返してください。

返答はJSONのみ。前置きや説明文は不要です。

{
  "評価日": "",
  "評価者名": "",
  "サンプルID": "",
  "生産国": "",
  "産地地域": "",
  "農園生産者名": "",
  "品種": "",
  "精製方法": "",
  "焙煎度": "",
  "焙煎日": "",
  "抽出方法": "",
  "粉量g": null,
  "湯量ml": null,
  "湯温℃": null,
  "抽出時間": "",
  "ドライアロマ": "",
  "ウェットアロマ": "",
  "酸味スコア": null,
  "甘味スコア": null,
  "苦味スコア": null,
  "ボディスコア": null,
  "バランススコア": null,
  "クリーンカップスコア": null,
  "アフターテイストスコア": null,
  "フロントノート": "",
  "ミッドノート": "",
  "フィニッシュ": "",
  "テクスチャー": "",
  "重さ": "",
  "収れん性": "",
  "総合スコア": null,
  "総評": "",
  "改善提案特記事項": ""
}"""


def groq_parse(text: str, model: str = "llama-3.3-70b-versatile") -> dict:
    """
    テイスティングメモを Groq API で解析し、構造化 dict を返す。
    読み取れなかったフィールドは null（None）になる。
    """
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"以下のテイスティングノートを解析してください：\n\n{text}"},
        ],
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    # コードブロックで囲まれていた場合の除去
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        text = open(sys.argv[1], encoding="utf-8").read()
    else:
        text = sys.stdin.read()

    result = groq_parse(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))
