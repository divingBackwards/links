const DRAFT_KEY = "links:draft";

export interface Draft {
  puzzleTitle: string;
  createdBy: string;
  createdDate: string;
  themes: [string, string, string, string];
  members: [
    [string, string, string, string],
    [string, string, string, string],
    [string, string, string, string],
    [string, string, string, string],
  ];
}

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.) — draft recovery is a
    // nice-to-have, so fail silently rather than interrupting the creator.
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
