import { GROUP_COLORS, MEMBER_MAX_LENGTH, THEME_MAX_LENGTH, type Puzzle } from "../types";
import { loadDraft, saveDraft, clearDraft, type Draft } from "../storage";

export interface CreateOptions {
  onTest: (puzzle: Puzzle) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): Draft {
  return {
    puzzleTitle: "",
    createdBy: "",
    createdDate: today(),
    themes: ["", "", "", ""],
    members: [
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ],
  };
}

export function renderCreate(container: HTMLElement, opts: CreateOptions): void {
  const draft: Draft = loadDraft() ?? emptyDraft();

  container.innerHTML = "";

  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "Create a Puzzle";
  container.append(title);

  const subtitle = document.createElement("p");
  subtitle.className = "page-subtitle";
  subtitle.textContent = "Four groups of four. Easiest at the top, trickiest at the bottom.";
  container.append(subtitle);

  const form = document.createElement("form");
  form.noValidate = true;

  const metaForm = document.createElement("div");
  metaForm.className = "meta-form";

  const titleField = labeledInput("Puzzle title", draft.puzzleTitle, (v) => {
    draft.puzzleTitle = v;
    persist();
  });
  const authorField = labeledInput("Author", draft.createdBy, (v) => {
    draft.createdBy = v;
    persist();
  });
  const dateField = labeledInput("Date", draft.createdDate, (v) => {
    draft.createdDate = v;
    persist();
  }, "date");
  metaForm.append(titleField.wrapper, authorField.wrapper, dateField.wrapper);
  form.append(metaForm);

  GROUP_COLORS.forEach((color, groupIndex) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = `group-form ${color}`;

    const label = document.createElement("div");
    label.className = "group-label";
    label.textContent = `${color[0].toUpperCase()}${color.slice(1)} (${difficultyLabel(groupIndex)})`;
    groupDiv.append(label);

    const themeRow = document.createElement("div");
    themeRow.className = "theme-row";
    const themeInput = document.createElement("input");
    themeInput.type = "text";
    themeInput.placeholder = "Group theme";
    themeInput.maxLength = THEME_MAX_LENGTH;
    themeInput.value = draft.themes[groupIndex];
    const themeCount = document.createElement("div");
    themeCount.className = "field-count";
    const updateThemeCount = () => {
      themeCount.textContent = `${themeInput.value.length}/${THEME_MAX_LENGTH}`;
      themeCount.classList.toggle("over", themeInput.value.length >= THEME_MAX_LENGTH);
    };
    themeInput.addEventListener("input", () => {
      draft.themes[groupIndex] = themeInput.value;
      updateThemeCount();
      persist();
    });
    updateThemeCount();
    themeRow.append(themeInput, themeCount);
    groupDiv.append(themeRow);

    const membersRow = document.createElement("div");
    membersRow.className = "members-row";
    for (let memberIndex = 0; memberIndex < 4; memberIndex++) {
      const memberInput = document.createElement("input");
      memberInput.type = "text";
      memberInput.placeholder = `Word/phrase ${memberIndex + 1}`;
      memberInput.maxLength = MEMBER_MAX_LENGTH;
      memberInput.value = draft.members[groupIndex][memberIndex];
      memberInput.addEventListener("input", () => {
        draft.members[groupIndex][memberIndex] = memberInput.value;
        persist();
      });
      membersRow.append(memberInput);
    }
    groupDiv.append(membersRow);

    form.append(groupDiv);
  });

  const errorText = document.createElement("p");
  errorText.className = "error-text";

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary";
  submitBtn.textContent = "Submit";
  btnRow.append(submitBtn);

  form.append(errorText, btnRow);
  container.append(form);

  function persist(): void {
    saveDraft(draft);
  }

  function difficultyLabel(groupIndex: number): string {
    return ["easiest", "easy-ish", "tricky", "trickiest"][groupIndex];
  }

  function labeledInput(
    labelText: string,
    value: string,
    onInput: (v: string) => void,
    type = "text",
  ): { wrapper: HTMLLabelElement; input: HTMLInputElement } {
    const wrapper = document.createElement("label");
    wrapper.textContent = labelText;
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.addEventListener("input", () => onInput(input.value));
    wrapper.append(input);
    return { wrapper, input };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = validate(draft);
    if (err) {
      errorText.textContent = err;
      return;
    }
    errorText.textContent = "";

    const puzzle: Puzzle = {
      puzzleTitle: draft.puzzleTitle.trim(),
      createdBy: draft.createdBy.trim(),
      createdDate: draft.createdDate.trim(),
      groups: [0, 1, 2, 3].map((gi) => ({
        theme: draft.themes[gi].trim().toUpperCase(),
        members: draft.members[gi].map((m) => m.trim().toUpperCase()) as [
          string,
          string,
          string,
          string,
        ],
      })) as Puzzle["groups"],
    };

    opts.onTest(puzzle);
  });
}

function validate(draft: Draft): string | null {
  if (!draft.puzzleTitle.trim()) return "Give your puzzle a title.";
  if (!draft.createdBy.trim()) return "Add your name as the author.";
  if (!draft.createdDate.trim()) return "Set a creation date.";

  const seen = new Set<string>();
  for (let gi = 0; gi < 4; gi++) {
    if (!draft.themes[gi].trim()) return `Group ${gi + 1} needs a theme.`;
    if (draft.themes[gi].length > THEME_MAX_LENGTH) {
      return `Group ${gi + 1}'s theme is over the ${THEME_MAX_LENGTH}-character limit.`;
    }
    for (let mi = 0; mi < 4; mi++) {
      const member = draft.members[gi][mi].trim();
      if (!member) return `Group ${gi + 1}, word ${mi + 1} is empty.`;
      if (member.length > MEMBER_MAX_LENGTH) {
        return `Group ${gi + 1}, word ${mi + 1} is over the ${MEMBER_MAX_LENGTH}-character limit.`;
      }
      const key = member.toUpperCase();
      if (seen.has(key)) return `"${member}" is used more than once — every tile must be unique.`;
      seen.add(key);
    }
  }
  return null;
}

export function clearCreateDraft(): void {
  clearDraft();
}
