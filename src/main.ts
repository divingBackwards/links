import "./style.css";
import { renderLanding } from "./screens/landing";
import { renderCreate } from "./screens/create";
import { renderSolve } from "./screens/solve";
import { decodePuzzle, encodePuzzle } from "./encode";
import { fetchPuzzleByCode } from "./api";
import type { Puzzle } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;

function goHome(): void {
  location.assign("/");
}

function goCreate(): void {
  location.assign("/#/create");
}

function goPlayLegacy(encoded: string): void {
  location.hash = `#/play/${encoded}`;
}

function goPlayShort(code: string): void {
  // A real navigation (not a hash change) so the URL itself is the short, shareable link.
  location.assign(`/p/${code}`);
}

function goTest(puzzle: Puzzle): void {
  location.hash = `#/test/${encodePuzzle(puzzle)}`;
}

function renderError(message: string): void {
  app.innerHTML = "";
  const h1 = document.createElement("h1");
  h1.className = "page-title";
  h1.textContent = "Hmm, that link's broken";
  const p = document.createElement("p");
  p.className = "page-subtitle";
  p.textContent = message;
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = "Home";
  btn.addEventListener("click", goHome);
  const row = document.createElement("div");
  row.className = "btn-row";
  row.append(btn);
  app.append(h1, p, row);
}

function renderLoading(): void {
  app.innerHTML = "";
  const p = document.createElement("p");
  p.className = "page-subtitle";
  p.textContent = "Loading puzzle…";
  app.append(p);
}

async function loadShortLink(code: string): Promise<void> {
  renderLoading();
  let puzzle: Puzzle | null;
  try {
    puzzle = await fetchPuzzleByCode(code);
  } catch {
    puzzle = null;
  }
  if (!puzzle) {
    renderError("This puzzle link doesn't match anything we have. Ask whoever sent it to re-share it.");
    return;
  }
  renderSolve(app, puzzle, {
    selfTest: false,
    onEdit: goCreate,
    onHome: goHome,
    onMakeYourOwn: goCreate,
  });
}

function router(): void {
  const hash = location.hash.replace(/^#/, "") || "/";

  if (hash === "/" || hash === "") {
    renderLanding(app, { onCreate: goCreate, onSolveShortLink: goPlayShort, onSolveLegacyLink: goPlayLegacy });
    return;
  }

  if (hash === "/create") {
    renderCreate(app, { onTest: goTest, onHome: goHome });
    return;
  }

  if (hash.startsWith("/play/")) {
    const encoded = hash.slice("/play/".length);
    const puzzle = decodePuzzle(encoded);
    if (!puzzle) {
      renderError("This puzzle link looks corrupted or incomplete. Ask whoever sent it to re-share it.");
      return;
    }
    renderSolve(app, puzzle, {
      selfTest: false,
      onEdit: goCreate,
      onHome: goHome,
      onMakeYourOwn: goCreate,
    });
    return;
  }

  if (hash.startsWith("/test/")) {
    const encoded = hash.slice("/test/".length);
    const puzzle = decodePuzzle(encoded);
    if (!puzzle) {
      renderError("Couldn't load your test puzzle. Head back and try creating it again.");
      return;
    }
    renderSolve(app, puzzle, {
      selfTest: true,
      onEdit: goCreate,
      onHome: goHome,
      onMakeYourOwn: goCreate,
    });
    return;
  }

  renderLanding(app, { onCreate: goCreate, onSolveShortLink: goPlayShort, onSolveLegacyLink: goPlayLegacy });
}

const shortLinkMatch = location.pathname.match(/^\/p\/([A-Za-z0-9]{4,12})$/);
if (shortLinkMatch) {
  loadShortLink(shortLinkMatch[1]);
} else {
  window.addEventListener("hashchange", router);
  router();
}
