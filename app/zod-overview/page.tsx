// Zod エディタ（スキーマバリデーションライブラリ）概要ページ

type Row = { cols: string[] };

function Table({ headers, rows }: { headers: string[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700 mb-8">
      <table className="w-full text-sm text-slate-300">
        <thead className="bg-slate-800 text-slate-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-2 px-4 text-left font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-800/40"}>
              {row.cols.map((cell, j) => (
                <td key={j} className="py-2 px-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className={`text-xl font-bold mb-3 ${color}`}>{title}</h2>
      {children}
    </section>
  );
}

export default function ZodOverviewPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">Zod エディタ 機能一覧</h1>
        <p className="text-slate-400 text-sm mb-10">
          TypeScript-first スキーマバリデーションライブラリ「Zod」の全機能・エディタツールまとめ
        </p>

        {/* 1. スキーマ型 */}
        <Section title="1. スキーマ型一覧" color="text-blue-400">
          <Table
            headers={["分類", "メソッド", "説明"]}
            rows={[
              { cols: ["プリミティブ", "z.string()", "文字列"] },
              { cols: ["プリミティブ", "z.number()", "数値（整数・小数）"] },
              { cols: ["プリミティブ", "z.boolean()", "真偽値"] },
              { cols: ["プリミティブ", "z.date()", "Date オブジェクト"] },
              { cols: ["プリミティブ", "z.bigint()", "BigInt"] },
              { cols: ["プリミティブ", "z.symbol()", "Symbol"] },
              { cols: ["特殊値", "z.undefined()", "undefined"] },
              { cols: ["特殊値", "z.null()", "null"] },
              { cols: ["特殊値", "z.void()", "void（主に関数戻り値）"] },
              { cols: ["特殊値", "z.any()", "任意の型（バリデーションなし）"] },
              { cols: ["特殊値", "z.unknown()", "未知の型（型安全な any）"] },
              { cols: ["特殊値", "z.never()", "到達不能な型"] },
              { cols: ["オブジェクト", "z.object({ ... })", "キーと値を持つオブジェクト"] },
              { cols: ["オブジェクト", "z.record(schema)", "動的キーのオブジェクト（辞書型）"] },
              { cols: ["オブジェクト", "z.map(k, v)", "Map 型"] },
              { cols: ["配列・コレクション", "z.array(schema)", "配列（全要素が同型）"] },
              { cols: ["配列・コレクション", "z.tuple([...])", "固定長・各要素の型が異なるタプル"] },
              { cols: ["配列・コレクション", "z.set(schema)", "Set 型"] },
              { cols: ["合成・分岐", "z.union([...])", "いずれかの型に一致（OR）"] },
              { cols: ["合成・分岐", "z.discriminatedUnion(key, [...])", "判別子付きユニオン（高速）"] },
              { cols: ["合成・分岐", "z.intersection(a, b)", "両方の型に一致（AND）"] },
              { cols: ["リテラル・列挙", "z.literal(value)", "特定のリテラル値のみ許可"] },
              { cols: ["リテラル・列挙", "z.enum([...])", "文字列の列挙型"] },
              { cols: ["リテラル・列挙", "z.nativeEnum(MyEnum)", "TypeScript の enum を使用"] },
              { cols: ["その他", "z.function()", "関数スキーマ（引数・戻り値を検証）"] },
              { cols: ["その他", "z.lazy(() => schema)", "再帰的スキーマの定義"] },
              { cols: ["その他", "z.promise(schema)", "Promise 型"] },
              { cols: ["その他", "z.instanceof(Class)", "特定クラスのインスタンス"] },
            ]}
          />
        </Section>

        {/* 2. パースメソッド */}
        <Section title="2. パース・バリデーションメソッド" color="text-green-400">
          <Table
            headers={["メソッド", "同期/非同期", "エラー時の挙動", "説明"]}
            rows={[
              { cols: [".parse(data)", "同期", "ZodError をスロー", "バリデーションしてパース（標準）"] },
              { cols: [".safeParse(data)", "同期", "{ success, data/error } を返す", "try/catch 不要の安全なパース"] },
              { cols: [".parseAsync(data)", "非同期", "ZodError をスロー", "async refinement / transform 使用時"] },
              { cols: [".safeParseAsync(data)", "非同期", "{ success, data/error } を返す", "非同期の安全なパース"] },
            ]}
          />
        </Section>

        {/* 3. 文字列バリデーション */}
        <Section title="3. 文字列バリデーション（z.string() のメソッド）" color="text-yellow-400">
          <Table
            headers={["メソッド", "説明", "例"]}
            rows={[
              { cols: [".min(n)", "最小文字数", ".min(3)"] },
              { cols: [".max(n)", "最大文字数", ".max(100)"] },
              { cols: [".length(n)", "厳密な文字数", ".length(10)"] },
              { cols: [".email()", "メールアドレス形式", ""] },
              { cols: [".url()", "URL 形式", ""] },
              { cols: [".uuid()", "UUID v4 形式", ""] },
              { cols: [".cuid()", "CUID 形式", ""] },
              { cols: [".cuid2()", "CUID2 形式", ""] },
              { cols: [".ulid()", "ULID 形式", ""] },
              { cols: [".emoji()", "絵文字のみ", ""] },
              { cols: [".ip()", "IPv4 または IPv6", ""] },
              { cols: [".cidr()", "CIDR 表記の IP 範囲", ""] },
              { cols: [".datetime()", "ISO 8601 日時形式", ""] },
              { cols: [".date()", "ISO 8601 日付形式（YYYY-MM-DD）", ""] },
              { cols: [".time()", "ISO 8601 時刻形式（HH:MM:SS）", ""] },
              { cols: [".duration()", "ISO 8601 期間形式", ""] },
              { cols: [".base64()", "Base64 エンコード文字列", ""] },
              { cols: [".regex(pattern)", "正規表現パターンに一致", '.regex(/^[A-Z]/)'] },
              { cols: [".includes(str)", "指定文字列を含む", '.includes("hello")'] },
              { cols: [".startsWith(str)", "指定文字列で始まる", ""] },
              { cols: [".endsWith(str)", "指定文字列で終わる", ""] },
              { cols: [".trim()", "前後の空白を除去（変換）", ""] },
              { cols: [".toLowerCase()", "小文字に変換", ""] },
              { cols: [".toUpperCase()", "大文字に変換", ""] },
            ]}
          />
        </Section>

        {/* 4. 数値バリデーション */}
        <Section title="4. 数値バリデーション（z.number() のメソッド）" color="text-orange-400">
          <Table
            headers={["メソッド", "説明"]}
            rows={[
              { cols: [".gt(n)", "n より大きい（超過）"] },
              { cols: [".gte(n) / .min(n)", "n 以上"] },
              { cols: [".lt(n)", "n より小さい（未満）"] },
              { cols: [".lte(n) / .max(n)", "n 以下"] },
              { cols: [".int()", "整数のみ"] },
              { cols: [".positive()", "正の数（0 より大きい）"] },
              { cols: [".nonnegative()", "0 以上"] },
              { cols: [".negative()", "負の数（0 より小さい）"] },
              { cols: [".nonpositive()", "0 以下"] },
              { cols: [".multipleOf(n)", "n の倍数"] },
              { cols: [".finite()", "有限数（Infinity 除外）"] },
              { cols: [".safe()", "Number.MIN_SAFE_INTEGER ～ MAX_SAFE_INTEGER の範囲"] },
            ]}
          />
        </Section>

        {/* 5. オブジェクトメソッド */}
        <Section title="5. オブジェクトメソッド（z.object() のメソッド）" color="text-purple-400">
          <Table
            headers={["メソッド", "説明"]}
            rows={[
              { cols: [".extend({ ... })", "既存スキーマにフィールドを追加（新スキーマ生成）"] },
              { cols: [".merge(schema)", "別のオブジェクトスキーマとマージ"] },
              { cols: [".pick({ key: true })", "特定フィールドのみ抽出した新スキーマ"] },
              { cols: [".omit({ key: true })", "特定フィールドを除いた新スキーマ"] },
              { cols: [".partial()", "全フィールドをオプション化"] },
              { cols: [".partial({ key: true })", "指定フィールドのみオプション化"] },
              { cols: [".required()", "全フィールドを必須化"] },
              { cols: [".passthrough()", "未知のフィールドをそのまま通過させる"] },
              { cols: [".strict()", "未知のフィールドがあるとエラー"] },
              { cols: [".strip()", "未知のフィールドを削除（デフォルト動作）"] },
              { cols: [".catchall(schema)", "未知のフィールドに対するスキーマを指定"] },
              { cols: [".keyof()", "キー名の ZodEnum を生成"] },
            ]}
          />
        </Section>

        {/* 6. 変換・修飾 */}
        <Section title="6. 変換・修飾メソッド（全スキーマ共通）" color="text-pink-400">
          <Table
            headers={["メソッド", "説明"]}
            rows={[
              { cols: [".optional()", "undefined を許可（T | undefined）"] },
              { cols: [".nullable()", "null を許可（T | null）"] },
              { cols: [".nullish()", "undefined と null を許可（T | null | undefined）"] },
              { cols: [".default(value)", "undefined の場合にデフォルト値を使用"] },
              { cols: [".catch(value)", "バリデーション失敗時のフォールバック値"] },
              { cols: [".transform(fn)", "バリデーション後に値を変換"] },
              { cols: [".refine(fn, message)", "カスタムバリデーション関数を追加"] },
              { cols: [".superRefine(fn)", "詳細なエラー制御ができるカスタムバリデーション"] },
              { cols: [".pipe(schema)", "出力を別スキーマに渡して連鎖バリデーション（v4）"] },
              { cols: [".readonly()", "型を Readonly にする"] },
              { cols: [".brand<Tag>()", "ブランド型を付与（型レベルの識別子）"] },
              { cols: [".describe(text)", "スキーマにドキュメント文字列を追加"] },
              { cols: [".meta({ ... })", "任意のメタデータを付与（v4）"] },
            ]}
          />
        </Section>

        {/* 7. 型推論 */}
        <Section title="7. TypeScript 型推論ユーティリティ" color="text-cyan-400">
          <Table
            headers={["ユーティリティ", "説明", "使用例"]}
            rows={[
              { cols: ["z.infer<typeof Schema>", "スキーマから TypeScript 型を抽出", "type User = z.infer<typeof UserSchema>"] },
              { cols: ["z.input<typeof Schema>", "変換前の入力型を抽出", "transform 前の型"] },
              { cols: ["z.output<typeof Schema>", "変換後の出力型を抽出", "transform 後の型"] },
              { cols: ["z.ZodType", "全スキーマの基底クラス型", "汎用的な型アノテーション"] },
            ]}
          />
        </Section>

        {/* 8. Zod v4 新機能 */}
        <Section title="8. Zod v4 新機能（2025年）" color="text-emerald-400">
          <Table
            headers={["機能", "内容", "詳細"]}
            rows={[
              { cols: ["パフォーマンス改善", "最大 14x 高速化", "文字列 14x・配列 7x・オブジェクト 6.5x の高速化"] },
              { cols: ["バンドルサイズ削減", "コアが 57% 軽量化", "以前のバージョンと比べて大幅に縮小"] },
              { cols: ["@zod/mini", "超軽量版パッケージ（約 1.9KB gzip）", "ツリーシェイキング対応、フロントエンド向け関数型 API"] },
              { cols: ["z.pipe()", "スキーマの連鎖", "変換とバリデーションを pipeline でつなぐ"] },
              { cols: ["JSON Schema 変換", "z.toJSONSchema() / z.fromJSONSchema()", "外部ライブラリ不要で JSON Schema と相互変換"] },
              { cols: ["メタデータ", ".meta({ ... })", "スキーマに型付きメタデータを付与、フォーム生成などに活用"] },
              { cols: ["エラー設定の統一", "error パラメータ", "message / required_error / invalid_type_error を一つに統合"] },
              { cols: ["トップレベルフォーマット", "z.email(), z.uuid(), z.url()", "メソッドからトップレベル関数に昇格（ツリーシェイキング対応）"] },
              { cols: ["z.coerce.*", "型強制", "z.coerce.number() など入力を自動変換"] },
            ]}
          />
        </Section>

        {/* 9. プレイグラウンドツール */}
        <Section title="9. Zodプレイグラウンド・エディタツール一覧" color="text-amber-400">
          <Table
            headers={["ツール名", "URL", "特徴"]}
            rows={[
              { cols: ["Zod Playground (公式)", "zod-playground.vercel.app", "公式が提供するスキーマテスト環境"] },
              { cols: ["Zod Test Playground", "zodtestplayground.vercel.app", "スキーマを貼り付けてリアルタイム検証、バージョン切り替え対応"] },
              { cols: ["Zod101", "zod101.smol-apps.de", "インタラクティブなチュートリアル付きプレイグラウンド"] },
              { cols: ["Zod Playground (zodplayground.top)", "zodplayground.top", "オンライン Zod スキーマエディタ"] },
              { cols: ["transform.tools", "transform.tools/json-to-zod", "JSON → Zod スキーマ 自動変換"] },
              { cols: ["Tecktol Converter", "tecktol.com/zod-to-json-schema", "Zod → JSON Schema 自動変換"] },
            ]}
          />
          <p className="text-slate-400 text-xs mt-2">
            ※ プレイグラウンドの共通機能：リアルタイムバリデーション / safeParse 結果表示 / エラーメッセージ確認 / スキーマ共有 URL / Zodバージョン切り替え
          </p>
        </Section>

        {/* 10. IDEサポート */}
        <Section title="10. エディタ / IDE サポートと最適化" color="text-violet-400">
          <Table
            headers={["項目", "内容"]}
            rows={[
              { cols: ["TypeScript 自動補完", "スキーマ定義・バリデーションメソッドの補完が VS Code などで自動動作"] },
              { cols: ["型推論表示", "z.infer<> でホバーすると推論型をエディタが表示"] },
              { cols: ["エラー箇所の強調", "ZodError の path フィールドでどのフィールドがエラーか特定可能"] },
              { cols: ["tsconfig 推奨設定", "skipLibCheck: true / incremental: true / strictFunctionTypes: true"] },
              { cols: ["Zod v4 の型チェック高速化", "内部実装の改善により tsc の型チェック速度が大幅向上"] },
              { cols: ["スキーマの分割", "大きなスキーマを小さく分割すると IDE のパフォーマンスが向上"] },
              { cols: ["VS Code 拡張", "TypeScript/JavaScript の標準拡張だけで補完・型推論が動作"] },
            ]}
          />
        </Section>

        <p className="text-slate-600 text-xs text-right mt-4">
          出典: zod.dev · github.com/colinhacks/zod · infoq.com
        </p>
      </div>
    </main>
  );
}
