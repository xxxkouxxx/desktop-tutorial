"""
Notion API でテイスティングノートページを作成・更新する。
引継書 Section 3 の全プロパティに対応。
null フィールドはスキップ（後から追加更新可能）。
"""

import os
from datetime import date
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()


def _build_properties(data: dict) -> dict:
    """
    groq_parse の出力 dict から Notion プロパティ dict を組み立てる。
    値が None/空文字のフィールドはスキップする（部分保存OK）。
    """
    props = {}

    # ノートタイトル（自動生成: 評価日 + 生産国 + 品種）
    title_parts = [
        data.get("評価日") or str(date.today()),
        data.get("生産国"),
        data.get("品種"),
    ]
    title = " ".join(p for p in title_parts if p)
    props["ノートタイトル"] = {"title": [{"text": {"content": title}}]}

    # テキスト型フィールド
    text_fields = [
        "評価者名", "サンプルID", "産地地域", "農園生産者名", "品種",
        "抽出時間", "ドライアロマ", "ウェットアロマ",
        "フロントノート", "ミッドノート", "フィニッシュ",
        "テクスチャー", "収れん性", "総評", "改善提案特記事項",
    ]
    for field in text_fields:
        val = data.get(field)
        if val:
            props[field] = {"rich_text": [{"text": {"content": str(val)}}]}

    # 日付型フィールド
    date_fields = ["評価日", "焙煎日"]
    for field in date_fields:
        val = data.get(field)
        if val:
            props[field] = {"date": {"start": val}}

    # セレクト型フィールド
    select_fields = ["生産国", "精製方法", "焙煎度", "抽出方法", "重さ"]
    for field in select_fields:
        val = data.get(field)
        if val:
            props[field] = {"select": {"name": val}}

    # 数値型フィールド
    number_fields = {
        "粉量(g)": "粉量g",
        "湯量(ml)": "湯量ml",
        "湯温(℃)": "湯温℃",
        "酸味スコア": "酸味スコア",
        "甘味スコア": "甘味スコア",
        "苦味スコア": "苦味スコア",
        "ボディスコア": "ボディスコア",
        "バランススコア": "バランススコア",
        "クリーンカップスコア": "クリーンカップスコア",
        "アフターテイストスコア": "アフターテイストスコア",
        "総合スコア": "総合スコア",
    }
    for notion_key, data_key in number_fields.items():
        val = data.get(data_key)
        if val is not None:
            props[notion_key] = {"number": int(val)}

    return props


def create_note(data: dict) -> str:
    """
    テイスティングノートを Notion データベースに新規作成する。
    戻り値: 作成されたページID
    """
    client = Client(auth=os.environ["NOTION_API_KEY"])
    database_id = os.environ["NOTION_DATABASE_ID"]

    props = _build_properties(data)
    page = client.pages.create(
        parent={"database_id": database_id},
        properties=props,
    )
    return page["id"]


def update_note(page_id: str, data: dict) -> None:
    """
    既存のテイスティングノートページを追加データで更新する。
    None/空のフィールドはスキップし、既存値を保持する。
    """
    client = Client(auth=os.environ["NOTION_API_KEY"])

    # タイトルフィールドは update 時に再生成しない（ページID で特定済み）
    props = _build_properties(data)
    props.pop("ノートタイトル", None)

    client.pages.update(page_id=page_id, properties=props)


if __name__ == "__main__":
    import json, sys
    data = json.load(sys.stdin)
    page_id = create_note(data)
    print(f"作成完了: https://notion.so/{page_id.replace('-', '')}")
