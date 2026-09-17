export const GROUP_COLORS = ["yellow", "green", "blue", "purple"] as const;
export type GroupColor = (typeof GROUP_COLORS)[number];

export const THEME_MAX_LENGTH = 32;
export const MEMBER_MAX_LENGTH = 12;

export interface PuzzleGroup {
  theme: string;
  members: [string, string, string, string];
}

export interface Puzzle {
  puzzleTitle: string;
  createdBy: string;
  createdDate: string;
  groups: [PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup];
}

export function isValidPuzzle(data: unknown): data is Puzzle {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.puzzleTitle !== "string" || !d.puzzleTitle.trim()) return false;
  if (typeof d.createdBy !== "string" || !d.createdBy.trim()) return false;
  if (typeof d.createdDate !== "string" || !d.createdDate.trim()) return false;
  if (!Array.isArray(d.groups) || d.groups.length !== 4) return false;

  const seen = new Set<string>();
  for (const group of d.groups) {
    if (typeof group !== "object" || group === null) return false;
    const g = group as Record<string, unknown>;
    if (typeof g.theme !== "string" || !g.theme.trim()) return false;
    if (!Array.isArray(g.members) || g.members.length !== 4) return false;
    for (const member of g.members) {
      if (typeof member !== "string" || !member.trim()) return false;
      const key = member.trim().toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return true;
}
