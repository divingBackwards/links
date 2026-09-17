import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { isValidPuzzle, type Puzzle } from "./types";

export function encodePuzzle(puzzle: Puzzle): string {
  return compressToEncodedURIComponent(JSON.stringify(puzzle));
}

export function decodePuzzle(encoded: string): Puzzle | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json);
    return isValidPuzzle(data) ? data : null;
  } catch {
    return null;
  }
}

/** Pulls the encoded payload out of a full URL a user might paste, or returns the input as-is. */
export function extractEncodedPayload(input: string): string {
  const trimmed = input.trim();
  const hashIndex = trimmed.indexOf("#");
  const afterHash = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : trimmed;
  const withoutRoute = afterHash.replace(/^\/(play|test)\//, "");
  return withoutRoute;
}
