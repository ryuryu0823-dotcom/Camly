import ja from "./dictionaries/ja";
import en from "./dictionaries/en";

export type Locale = "ja" | "en";

export const dictionaries: Record<Locale, typeof ja> = { ja, en };

export const DEFAULT_LOCALE: Locale = "ja";

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/** すべてのキーパス("brand.tagline"等)をフラットに列挙する。CIの欠落検出テストで使う。 */
export function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}
