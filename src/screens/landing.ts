import { extractEncodedPayload, decodePuzzle } from "../encode";
import { extractShortCode } from "../api";

export interface LandingOptions {
  onCreate: () => void;
  onSolveShortLink: (code: string) => void;
  onSolveLegacyLink: (encoded: string) => void;
}

export function renderLanding(container: HTMLElement, opts: LandingOptions): void {
  container.innerHTML = "";

  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "Links";
  container.append(title);

  const subtitle = document.createElement("p");
  subtitle.className = "page-subtitle";
  subtitle.textContent = "A Connections-style puzzle game for you and your friends.";
  container.append(subtitle);

  const actions = document.createElement("div");
  actions.className = "landing-actions";

  const createBtn = document.createElement("button");
  createBtn.className = "btn btn-primary";
  createBtn.textContent = "Create a Puzzle";
  createBtn.addEventListener("click", opts.onCreate);

  const pasteBtn = document.createElement("button");
  pasteBtn.className = "btn";
  pasteBtn.textContent = "Paste a Puzzle Link";

  const pasteRow = document.createElement("div");
  pasteRow.className = "paste-link-row";

  const pasteInput = document.createElement("input");
  pasteInput.type = "text";
  pasteInput.placeholder = "Paste a Links puzzle link here";

  const pasteError = document.createElement("p");
  pasteError.className = "error-text";

  const goBtn = document.createElement("button");
  goBtn.className = "btn btn-primary";
  goBtn.textContent = "Go";
  goBtn.addEventListener("click", () => {
    const shortCode = extractShortCode(pasteInput.value);
    if (shortCode) {
      pasteError.textContent = "";
      opts.onSolveShortLink(shortCode);
      return;
    }

    const encoded = extractEncodedPayload(pasteInput.value);
    if (!encoded || !decodePuzzle(encoded)) {
      pasteError.textContent = "That doesn't look like a valid Links puzzle link.";
      return;
    }
    pasteError.textContent = "";
    opts.onSolveLegacyLink(encoded);
  });

  pasteRow.append(pasteInput, goBtn, pasteError);

  pasteBtn.addEventListener("click", () => {
    pasteRow.classList.toggle("visible");
    if (pasteRow.classList.contains("visible")) pasteInput.focus();
  });

  actions.append(createBtn, pasteBtn, pasteRow);
  container.append(actions);
}
