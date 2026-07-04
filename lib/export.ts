import type { CategoryWithItems } from "./types";

/**
 * Formats the whole list as plain text, ready to paste into
 * the iOS/Android Notes app. Checked items are kept (crossed out
 * with a strike-friendly marker) so nothing gets silently lost.
 */
export function formatListForExport(categories: CategoryWithItems[]): string {
  const lines: string[] = ["🛒 Courses", ""];

  for (const category of categories) {
    if (category.items.length === 0) continue;

    lines.push(`${category.emoji} ${category.name}`);
    for (const item of category.items) {
      lines.push(item.is_checked ? `☑ ${item.name}` : `☐ ${item.name}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export async function copyListToClipboard(
  categories: CategoryWithItems[]
): Promise<void> {
  const text = formatListForExport(categories);
  await navigator.clipboard.writeText(text);
}
