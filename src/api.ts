import { isValidPuzzle, type Puzzle } from "./types";

const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{4,12}$/;

export async function createShortLink(puzzle: Puzzle): Promise<string> {
  const res = await fetch("/api/puzzles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(puzzle),
  });
  if (!res.ok) {
    throw new Error(`Couldn't create a share link (${res.status}). Try again in a moment.`);
  }
  const data = (await res.json()) as { code: string };
  return data.code;
}

export async function fetchPuzzleByCode(code: string): Promise<Puzzle | null> {
  const res = await fetch(`/api/puzzles/${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return isValidPuzzle(data) ? data : null;
}

/** Pulls a short code out of a pasted `/p/<code>` link, or a bare code, or returns null. */
export function extractShortCode(input: string): string | null {
  const trimmed = input.trim();
  const pathMatch = trimmed.match(/\/p\/([A-Za-z0-9]{4,12})(?:[/?#]|$)/);
  if (pathMatch) return pathMatch[1];
  return SHORT_CODE_PATTERN.test(trimmed) ? trimmed : null;
}
