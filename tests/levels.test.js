import { groupSections, planLevels } from '../src/levels.js';

const el = (kind, text) => ({ kind, text });

// A small résumé: a header, two jobs, projects, then skills and education.
const resume = [
  el('name', 'Ada Lovelace'),
  el('contact', 'London'),
  el('heading', 'WORK HISTORY'),
  el('role', 'Analyst, Engine Co.\t1842 – 1843'),
  el('bullet', 'one two three four'),
  el('bullet', 'five six seven eight'),
  el('role', 'Writer, Notes Ltd.\t1843 – 1844'),
  el('bullet', 'nine ten eleven twelve'),
  el('heading', 'PROJECTS'),
  el('bullet', 'a b c d'),
  el('bullet', 'e f g h'),
  el('heading', 'SKILLS'),
  el('body', 'maths'),
  el('heading', 'EDUCATION'),
  el('body', 'home'),
];

/** Fits up to `max` elements on a screen. */
const fitsUpTo = (max) => (elements) => elements.length <= max;

describe('levels', () => {
  test('the header joins the first section', () => {
    const sections = groupSections(resume);

    expect(sections.map((s) => s.heading)).toEqual([
      'WORK HISTORY',
      'PROJECTS',
      'SKILLS',
      'EDUCATION',
    ]);
    expect(sections[0].elements[0].text).toBe('Ada Lovelace');
  });

  test('a résumé that fits plays as one level', () => {
    const levels = planLevels(resume, () => true);

    expect(levels).toHaveLength(1);
    expect(levels[0].elements).toEqual(resume);
  });

  test('sections start their own level and share one while they fit', () => {
    const levels = planLevels(resume, fitsUpTo(8));

    expect(levels.map((l) => l.title)).toEqual([
      'Work History',
      'Projects, Skills and Education',
    ]);
    expect(levels[0].detail).toBe('Analyst, Engine Co.');
    expect(levels.flatMap((l) => l.elements)).toEqual(resume);
  });

  test('a long section carries on into the next level', () => {
    const levels = planLevels(resume, fitsUpTo(5));

    expect(levels.map((l) => l.title)).toEqual([
      'Work History',
      'Work History, continued',
      'Projects and Skills',
      'Education',
    ]);
    expect(levels.flatMap((l) => l.elements)).toEqual(resume);
  });

  test('a level that opens with a job names it', () => {
    const levels = planLevels(resume, fitsUpTo(4));

    const withJob = levels.find((l) => l.elements[0].kind === 'role');
    expect(withJob.title).toBe('Work History, continued');
    expect(withJob.detail).toBe('Writer, Notes Ltd.');
  });

  test('a job title is never left alone at the foot of a level', () => {
    // Six fit: the second job's title would be the sixth.
    const levels = planLevels(resume, fitsUpTo(6));
    const first = levels[0].elements;

    expect(first[first.length - 1].kind).toBe('bullet');
    expect(levels[1].elements[0].kind).toBe('role');
  });

  test('a level that finishes a section says so and names the ones it opens', () => {
    const levels = planLevels(resume, fitsUpTo(7));

    expect(levels[1].elements[0].text).toMatch(/^Writer/);
    expect(levels[1].title).toBe('Projects and Skills');
    expect(levels[1].detail).toBe('After the rest of Work History');
    expect(levels[2].title).toBe('Education');
  });

  test('a line too long for any screen gets a level of its own', () => {
    const levels = planLevels(
      resume,
      (elements) => !elements.some((e) => e.text === 'a b c d')
    );

    expect(levels.some((l) => l.elements.length === 1)).toBe(true);
    expect(levels.flatMap((l) => l.elements)).toEqual(resume);
  });

  test('splitting again from a line keeps the section names', () => {
    const start = resume.findIndex((e) => e.text === 'five six seven eight');
    const levels = planLevels(resume, fitsUpTo(4), { startAt: start });

    expect(levels.map((l) => l.title)).toEqual([
      'Work History, continued',
      'Projects',
      'Skills and Education',
    ]);
    expect(levels.flatMap((l) => l.elements)).toEqual(resume.slice(start));

    const rest = planLevels(resume, () => true, { startAt: start });
    expect(rest).toHaveLength(1);
    expect(rest[0].title).toBe('Projects, Skills and Education');
    expect(rest[0].detail).toBe('After the rest of Work History');
  });

  test('an empty résumé is one empty level', () => {
    expect(planLevels([], () => false)).toEqual([
      { elements: [], title: 'Résumé' },
    ]);
  });
});
