"""
Notion の Tasting Notes データベースに全プロパティを一括追加するセットアップスクリプト。
初回のみ実行してください。
"""

import os
from notion_client import Client  # noqa: E402  (installed package, not local file)
from dotenv import load_dotenv

load_dotenv()

DATABASE_ID = os.environ["NOTION_DATABASE_ID"]


def build_properties() -> dict:
    """引継書 Section 3 の全プロパティ定義を返す"""

    def select_options(*names):
        return [{"name": n} for n in names]

    return {
        # タイトルプロパティのリネーム
        "名前": {"name": "ノートタイトル", "title": {}},

        # 日付
        "評価日":  {"date": {}},
        "焙煎日":  {"date": {}},

        # テキスト
        "評価者名":       {"rich_text": {}},
        "サンプルID":     {"rich_text": {}},
        "産地・地域":     {"rich_text": {}},
        "農園・生産者名": {"rich_text": {}},
        "品種":           {"rich_text": {}},
        "抽出時間":       {"rich_text": {}},
        "ドライアロマ":   {"rich_text": {}},
        "ウェットアロマ": {"rich_text": {}},
        "フロントノート": {"rich_text": {}},
        "ミッドノート":   {"rich_text": {}},
        "フィニッシュ":   {"rich_text": {}},
        "テクスチャー":   {"rich_text": {}},
        "収れん性":       {"rich_text": {}},
        "総評":           {"rich_text": {}},
        "改善提案・特記事項": {"rich_text": {}},

        # セレクト
        "生産国": {
            "select": {"options": select_options(
                "エチオピア", "コロンビア", "ブラジル", "グアテマラ",
                "ケニア", "ルワンダ", "パナマ", "コスタリカ", "その他"
            )}
        },
        "精製方法": {
            "select": {"options": select_options(
                "Washed", "Natural", "Honey", "Anaerobic", "その他"
            )}
        },
        "焙煎度": {
            "select": {"options": select_options(
                "浅煎り", "中浅煎り", "中煎り", "中深煎り", "深煎り"
            )}
        },
        "抽出方法": {
            "select": {"options": select_options(
                "V60", "エアロプレス", "フレンチプレス",
                "エスプレッソ", "xBloom", "その他"
            )}
        },
        "重さ": {
            "select": {"options": select_options(
                "ライト", "ミディアムライト", "ミディアム", "ミディアムフル", "フル"
            )}
        },

        # 数値
        "粉量(g)":            {"number": {"format": "number"}},
        "湯量(ml)":           {"number": {"format": "number"}},
        "湯温(℃)":            {"number": {"format": "number"}},
        "酸味スコア":         {"number": {"format": "number"}},
        "甘味スコア":         {"number": {"format": "number"}},
        "苦味スコア":         {"number": {"format": "number"}},
        "ボディスコア":       {"number": {"format": "number"}},
        "バランススコア":     {"number": {"format": "number"}},
        "クリーンカップスコア":   {"number": {"format": "number"}},
        "アフターテイストスコア": {"number": {"format": "number"}},
        "総合スコア":         {"number": {"format": "number"}},
    }


def setup():
    client = Client(auth=os.environ["NOTION_API_KEY"])

    # 更新前のプロパティ確認
    db = client.databases.retrieve(database_id=DATABASE_ID)
    print(f"レスポンスのキー: {list(db.keys())}")
    print(f"オブジェクトタイプ: {db.get('object')}")
    before = list(db.get("properties", {}).keys())
    print(f"更新前のプロパティ数: {len(before)}")
    print(f"現在のプロパティ: {before}")

    print("\n▶ Notion データベースにプロパティを追加中...")
    result = client.databases.update(
        database_id=DATABASE_ID,
        properties=build_properties(),
    )

    # 更新後のプロパティ確認
    after = list(result["properties"].keys())
    print(f"\n更新後のプロパティ数: {len(after)}")
    print(f"追加されたプロパティ: {[p for p in after if p not in before]}")
    print("\n✓ 完了！Notion の Tasting Notes データベースを確認してください。")


if __name__ == "__main__":
    setup()
