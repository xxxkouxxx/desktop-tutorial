"""
Notion に Tasting Notes データベースを新規作成するセットアップスクリプト。
NOTION_PARENT_PAGE_ID で指定したページの配下にデータベースを作成します。
初回のみ実行してください。
"""

import os
from notion_client import Client  # noqa: E402  (installed package, not local file)
from dotenv import load_dotenv

load_dotenv()


def select_options(*names):
    return [{"name": n} for n in names]


PROPERTIES = {
    "ノートタイトル": {"title": {}},

    # 日付
    "評価日": {"date": {}},
    "焙煎日": {"date": {}},

    # テキスト
    "評価者名":           {"rich_text": {}},
    "サンプルID":         {"rich_text": {}},
    "産地・地域":         {"rich_text": {}},
    "農園・生産者名":     {"rich_text": {}},
    "品種":               {"rich_text": {}},
    "抽出時間":           {"rich_text": {}},
    "ドライアロマ":       {"rich_text": {}},
    "ウェットアロマ":     {"rich_text": {}},
    "フロントノート":     {"rich_text": {}},
    "ミッドノート":       {"rich_text": {}},
    "フィニッシュ":       {"rich_text": {}},
    "テクスチャー":       {"rich_text": {}},
    "収れん性":           {"rich_text": {}},
    "総評":               {"rich_text": {}},
    "改善提案・特記事項": {"rich_text": {}},

    # セレクト
    "生産国": {"select": {"options": select_options(
        "エチオピア", "コロンビア", "ブラジル", "グアテマラ",
        "ケニア", "ルワンダ", "パナマ", "コスタリカ", "その他"
    )}},
    "精製方法": {"select": {"options": select_options(
        "Washed", "Natural", "Honey", "Anaerobic", "その他"
    )}},
    "焙煎度": {"select": {"options": select_options(
        "浅煎り", "中浅煎り", "中煎り", "中深煎り", "深煎り"
    )}},
    "抽出方法": {"select": {"options": select_options(
        "V60", "エアロプレス", "フレンチプレス", "エスプレッソ", "xBloom", "その他"
    )}},
    "重さ": {"select": {"options": select_options(
        "ライト", "ミディアムライト", "ミディアム", "ミディアムフル", "フル"
    )}},

    # 数値
    "粉量(g)":                {"number": {"format": "number"}},
    "湯量(ml)":               {"number": {"format": "number"}},
    "湯温(℃)":                {"number": {"format": "number"}},
    "酸味スコア":             {"number": {"format": "number"}},
    "甘味スコア":             {"number": {"format": "number"}},
    "苦味スコア":             {"number": {"format": "number"}},
    "ボディスコア":           {"number": {"format": "number"}},
    "バランススコア":         {"number": {"format": "number"}},
    "クリーンカップスコア":   {"number": {"format": "number"}},
    "アフターテイストスコア": {"number": {"format": "number"}},
    "総合スコア":             {"number": {"format": "number"}},
}


def setup():
    client = Client(auth=os.environ["NOTION_API_KEY"])
    parent_page_id = os.environ["NOTION_PARENT_PAGE_ID"]

    print("▶ Notion に Tasting Notes データベースを作成中...")
    result = client.databases.create(
        parent={"type": "page_id", "page_id": parent_page_id},
        title=[{"type": "text", "text": {"content": "Tasting Notes"}}],
        properties=PROPERTIES,
    )

    print(f"レスポンスのキー: {list(result.keys())}")
    db_id = result.get("id", "不明")
    props = list(result.get("properties", {}).keys())
    print(f"✓ 完了！データベース ID: {db_id}")
    print(f"作成されたプロパティ ({len(props)}件): {props}")
    print(f"\n.env の NOTION_DATABASE_ID をこの値に更新してください:")
    print(f"NOTION_DATABASE_ID={db_id.replace('-', '')}")


if __name__ == "__main__":
    setup()
