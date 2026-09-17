import { GROUP_COLORS, type Puzzle } from "../types";
import { encodePuzzle } from "../encode";

interface Tile {
  id: string;
  text: string;
  groupIndex: number;
}

export interface SolveOptions {
  selfTest: boolean;
  onEdit: () => void;
  onHome: () => void;
  onMakeYourOwn: () => void;
}

const MAX_MISTAKES = 4;

export function renderSolve(
  container: HTMLElement,
  puzzle: Puzzle,
  opts: SolveOptions,
): void {
  const maxMistakes = opts.selfTest ? Infinity : MAX_MISTAKES;
  let tiles: Tile[] = shuffle(buildTiles(puzzle));
  let solvedOrder: number[] = [];
  const selected = new Set<string>();
  let mistakes = 0;
  let gameOver: "won" | "lost" | null = null;
  let revealedLoss = false;
  let toastMessage = "";
  let shakeIds = new Set<string>();

  render();

  function buildTiles(p: Puzzle): Tile[] {
    const out: Tile[] = [];
    p.groups.forEach((g, gi) => {
      g.members.forEach((m, mi) => {
        out.push({ id: `${gi}:${mi}`, text: m, groupIndex: gi });
      });
    });
    return out;
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toggleSelect(id: string): void {
    if (gameOver) return;
    if (selected.has(id)) {
      selected.delete(id);
    } else if (selected.size < 4) {
      selected.add(id);
    }
    render();
  }

  function deselectAll(): void {
    selected.clear();
    render();
  }

  function doShuffle(): void {
    tiles = shuffle(tiles);
    render();
  }

  function submit(): void {
    if (selected.size !== 4 || gameOver) return;
    const selectedTiles = tiles.filter((t) => selected.has(t.id));
    const counts = new Map<number, number>();
    for (const t of selectedTiles) {
      counts.set(t.groupIndex, (counts.get(t.groupIndex) ?? 0) + 1);
    }
    const [matchedGroup, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

    if (count === 4) {
      solvedOrder = [...solvedOrder, matchedGroup];
      tiles = tiles.filter((t) => t.groupIndex !== matchedGroup);
      selected.clear();
      toastMessage = "";
      shakeIds = new Set();
      if (solvedOrder.length === 4) gameOver = "won";
      render();
      return;
    }

    mistakes++;
    shakeIds = new Set(selected);
    toastMessage = count === 3 ? "One away..." : "";
    if (mistakes >= maxMistakes) gameOver = "lost";
    render();
    window.setTimeout(() => {
      shakeIds = new Set();
      container.querySelectorAll(".tile.shake").forEach((el) => el.classList.remove("shake"));
    }, 400);
  }

  function revealLoss(): void {
    revealedLoss = true;
    const remaining = GROUP_COLORS.map((_, i) => i).filter((i) => !solvedOrder.includes(i));
    solvedOrder = [...solvedOrder, ...remaining];
    tiles = [];
    render();
  }

  function shareLink(): void {
    const url = `${location.origin}${location.pathname}#/play/${encodePuzzle(puzzle)}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    window.alert(`Link copied to clipboard:\n${url}`);
  }

  function render(): void {
    container.innerHTML = "";

    if (opts.selfTest) {
      const topBar = el("div", "top-bar");
      topBar.append(button("Edit", opts.onEdit), button("Share", shareLink, "btn-primary"));
      container.append(topBar);

      const badge = el("p", "meta-line");
      badge.textContent = "Self-test — unlimited mistakes, nothing is shared yet";
      container.append(badge);
    }

    const title = el("h1", "page-title");
    title.textContent = puzzle.puzzleTitle;
    container.append(title);

    const meta = el("p", "meta-line");
    meta.textContent = `by ${puzzle.createdBy} · ${puzzle.createdDate}`;
    container.append(meta);

    const banners = el("div", "banners");
    for (const gi of solvedOrder) banners.append(renderBanner(gi));
    container.append(banners);

    if (tiles.length > 0) {
      const grid = el("div", "grid");
      for (const t of tiles) grid.append(renderTile(t));
      container.append(grid);

      const toast = el("div", "toast" + (toastMessage ? " visible" : ""));
      toast.textContent = toastMessage || " ";
      container.append(toast);

      const mistakesRow = el("div", "mistakes-row");
      if (Number.isFinite(maxMistakes)) {
        const label = document.createElement("span");
        label.textContent = "Mistakes Remaining:";
        const pips = el("div", "pips");
        for (let i = 0; i < maxMistakes - mistakes; i++) pips.append(el("span", "pip"));
        mistakesRow.append(label, pips);
      } else {
        mistakesRow.textContent = "Unlimited mistakes (self-test)";
      }
      container.append(mistakesRow);

      const btnRow = el("div", "btn-row");
      const shuffleBtn = button("Shuffle", doShuffle);
      const deselectBtn = button("Deselect All", deselectAll);
      deselectBtn.disabled = selected.size === 0;
      const submitBtn = button("Submit", submit, "btn-primary");
      submitBtn.disabled = selected.size !== 4;
      btnRow.append(shuffleBtn, deselectBtn, submitBtn);
      container.append(btnRow);
    }

    if (gameOver === "won") {
      container.append(
        renderEndModal("You solved it!", "Nicely done — every group found."),
      );
    } else if (gameOver === "lost" && !revealedLoss) {
      container.append(renderLossModal());
    } else if (gameOver === "lost" && revealedLoss) {
      container.append(
        renderEndModal("Better luck next time!", "Here's how the puzzle breaks down."),
      );
    }
  }

  function renderTile(t: Tile): HTMLButtonElement {
    const btn = document.createElement("button");
    const classes = ["tile"];
    if (selected.has(t.id)) classes.push("selected");
    if (shakeIds.has(t.id)) classes.push("shake");
    btn.className = classes.join(" ");
    btn.textContent = t.text;
    btn.disabled = !!gameOver;
    btn.addEventListener("click", () => toggleSelect(t.id));
    return btn;
  }

  function renderBanner(groupIndex: number): HTMLDivElement {
    const g = puzzle.groups[groupIndex];
    const div = el("div", `group-banner ${GROUP_COLORS[groupIndex]}`);
    const theme = el("div", "theme");
    theme.textContent = g.theme;
    const members = el("div", "members");
    members.textContent = g.members.join(", ");
    div.append(theme, members);
    return div;
  }

  function renderLossModal(): HTMLDivElement {
    const backdrop = el("div", "modal-backdrop");
    const modal = el("div", "modal");
    const h2 = document.createElement("h2");
    h2.textContent = "Better luck next time!";
    modal.append(h2, button("Reveal unsolved groups", revealLoss, "btn-primary"));
    backdrop.append(modal);
    return backdrop;
  }

  function renderEndModal(heading: string, sub: string): HTMLDivElement {
    const backdrop = el("div", "modal-backdrop");
    const modal = el("div", "modal");
    const h2 = document.createElement("h2");
    h2.textContent = heading;
    const p = document.createElement("p");
    p.textContent = sub;
    const row = el("div", "btn-row");
    row.append(
      button("Home", opts.onHome),
      button("Make your own puzzle", opts.onMakeYourOwn, "btn-primary"),
    );
    modal.append(h2, p, row);
    backdrop.append(modal);
    return backdrop;
  }

  function button(label: string, onClick: () => void, extraClass = ""): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = extraClass ? `btn ${extraClass}` : "btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function el(tag: string, className: string): HTMLDivElement {
    const node = document.createElement(tag) as HTMLDivElement;
    node.className = className;
    return node;
  }
}
