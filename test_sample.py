"""
Groq パーサーの動作確認テスト。
実際の Groq API キーが必要。Notion への書き込みは行わない。
"""

import json
from groq_parser import groq_parse


def test_full_note():
    text = open("sample_note.txt", encoding="utf-8").read()
    result = groq_parse(text)

    print("=== 解析結果 ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 基本フィールドの確認
    assert result.get("生産国") == "エチオピア", f"生産国: {result.get('生産国')}"
    assert result.get("品種") == "ゲシャ", f"品種: {result.get('品種')}"
    assert result.get("総合スコア") == 87, f"総合スコア: {result.get('総合スコア')}"
    assert result.get("酸味スコア") == 4, f"酸味スコア: {result.get('酸味スコア')}"
    assert result.get("粉量g") == 15, f"粉量g: {result.get('粉量g')}"

    print("\n✓ 全アサーション通過")


def test_partial_note():
    """音声メモなど、情報が少ない場合でも null で返ることを確認"""
    text = "エチオピアのゲシャ飲んだ。すごくフローラルで酸味が爽やか。スコアは85くらい。"
    result = groq_parse(text)

    print("\n=== 部分メモの解析結果 ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    assert result.get("生産国") == "エチオピア"
    assert result.get("総合スコア") is not None
    # 読み取れないフィールドは None であることを確認
    assert result.get("評価者名") is None or result.get("評価者名") == ""

    print("\n✓ 部分メモのアサーション通過")


if __name__ == "__main__":
    test_full_note()
    test_partial_note()
    print("\n=== 全テスト完了 ===")
