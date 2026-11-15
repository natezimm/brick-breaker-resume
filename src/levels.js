/**
 * Splits the résumé into levels when it can't all be played on one screen.
 *
 * Each heading opens a section; the name and contact lines join the first.
 * Whole sections share a level while they fit, and a section that doesn't
 * fit beside the last one starts a level of its own. A section too long for
 * one screen carries on into the next level, line by line, and a job title
 * or heading is never left alone at the foot of a level.
 */

/**
 * @typedef {Object} ResumeLevel
 * @property {Object[]} elements the classified résumé elements to lay out
 * @property {string} title the section the level starts in, e.g. "Projects"
 * @property {string} [detail] the job the level starts with, if any
 */

const HEADER_KINDS = new Set(['name', 'contact']);
const LEAD_KINDS = new Set(['heading', 'role']);

function titleCase(text) {
  return text
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

/** Groups classified elements into sections, one per heading. */
export function groupSections(elements) {
  const sections = [];

  elements.forEach((element) => {
    const current = sections[sections.length - 1];
    const headerOnly =
      current && !current.heading && current.elements.every(isHeader);
    const opens = !current || (element.kind === 'heading' && !headerOnly);

    if (opens) sections.push({ heading: null, elements: [element] });
    else current.elements.push(element);

    if (element.kind === 'heading') {
      sections[sections.length - 1].heading = element.text;
    }
  });

  return sections;
}

function isHeader(element) {
  return HEADER_KINDS.has(element.kind);
}

function joinNames(names) {
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    : names[0];
}

function describeLevel(elements, sections) {
  const first = elements.find((e) => !isHeader(e)) ?? elements[0];
  const section = sections.find((s) => s.elements.includes(first));
  const heading = section?.heading ? titleCase(section.heading) : 'Résumé';
  const continues = first.kind !== 'heading' && Boolean(section?.heading);
  // Every section that opens within the level is named: "Skills and
  // Education".
  const opened = sections
    .filter((s) => s.heading && elements.includes(s.elements[0]))
    .map((s) => titleCase(s.heading));

  const level = { elements };
  if (!continues) {
    level.title = joinNames(opened.length ? opened : [heading]);
  } else if (opened.length) {
    level.title = joinNames(opened);
    level.detail = `After the rest of ${heading}`;
  } else {
    level.title = `${heading}, continued`;
  }

  // Name the job when the level opens with one.
  if (level.detail) return level;
  const start = elements.indexOf(first);
  const role = first.kind === 'heading' ? elements[start + 1] : elements[start];
  if (role?.kind === 'role') level.detail = role.text.split('\t')[0].trim();
  return level;
}

/**
 * @param {Object[]} elements classified résumé elements
 * @param {(elements: Object[]) => boolean} fits whether these elements lay
 *   out on one screen without dropping a word
 * @param {{startAt?: number}} [options] split only the elements from this
 *   index on; earlier ones still name the sections
 * @returns {ResumeLevel[]}
 */
export function planLevels(elements, fits, { startAt = 0 } = {}) {
  const sections = groupSections(elements);
  const rest = elements.slice(startAt);

  if (rest.length === 0 || fits(rest)) {
    return startAt === 0
      ? [{ elements: rest, title: 'Résumé' }]
      : [describeLevel(rest, sections)];
  }

  const remaining = new Set(rest);
  const pending = sections
    .map((section) => ({
      ...section,
      elements: section.elements.filter((e) => remaining.has(e)),
    }))
    .filter((section) => section.elements.length > 0);
  const chunks = [];
  let current = [];

  const flush = () => {
    if (current.length) chunks.push(current);
    current = [];
  };

  pending.forEach((section) => {
    const together = current.concat(section.elements);
    if (fits(together)) {
      current = together;
      return;
    }

    flush();
    section.elements.forEach((element) => {
      if (fits(current.concat(element))) {
        current.push(element);
        return;
      }

      // Carry a trailing heading or job title over with the line it leads.
      let carried = [];
      while (
        current.length > 1 &&
        LEAD_KINDS.has(current[current.length - 1].kind)
      ) {
        carried = [current.pop(), ...carried];
      }
      flush();
      // A single line too long for any screen plays as much as fits.
      current = [...carried, element];
    });
  });
  flush();

  return chunks.map((chunk) => describeLevel(chunk, sections));
}
