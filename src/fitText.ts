const MIN_FONT_SIZE_PX = 8;
const STEP_PX = 1;

/**
 * Shrinks an element's font-size until its text fits on one line within its
 * current box, starting from whatever size CSS already gave it. Falls back
 * to wrapping (rather than clipping) if it still doesn't fit at the floor size.
 */
export function fitTextToOneLine(el: HTMLElement): void {
  el.style.whiteSpace = "nowrap";
  el.style.fontSize = "";

  let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && fontSize > MIN_FONT_SIZE_PX) {
    fontSize -= STEP_PX;
    el.style.fontSize = `${fontSize}px`;
  }

  if (el.scrollWidth > el.clientWidth) {
    el.style.whiteSpace = "normal";
  }
}
