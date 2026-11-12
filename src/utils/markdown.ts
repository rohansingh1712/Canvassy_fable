// Simple markdown utilities
// For now, we'll rely on react-markdown for rendering
// This file can hold helper functions for markdown processing

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export function extractSummary(bodyText: string): string {
  if (!bodyText) return '';
  const lines = bodyText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@summary ')) {
      return trimmed.substring(9).trim(); // Remove '@summary ' prefix
    }
  }
  return '';
}

export function hasSummaryLine(bodyText: string): boolean {
  if (!bodyText) return false;
  return bodyText.split('\n').some(line =>
    line.trim().startsWith('@summary ')
  );
}

/** What a note is called when collapsed: its @summary, else its first line of text. */
export function cardTitle(body: string, summary?: string): string {
  if (summary) return summary;
  const firstLine = (body || '')
    .split('\n')
    .map((line) => stripMarkdown(line).replace(/^[-*+]\s+|^\d+\.\s+|^>\s*/, ''))
    .find((line) => line.length > 0 && !line.startsWith('@summary'));
  if (!firstLine) return '';
  return firstLine.length > 90 ? `${firstLine.slice(0, 88).trimEnd()}…` : firstLine;
}
