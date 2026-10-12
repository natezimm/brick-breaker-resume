import { renderOverlayBricks } from '../src/overlay.js';

function mockResume(elements) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(elements),
  });
}

describe('start screen résumé', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="startOverlay">
        <div id="light" class="look-resume" data-mode="typeset"></div>
        <div id="dark" class="look-resume" data-mode="wall"></div>
      </div>`;
    document.documentElement.removeAttribute('data-theme');
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 900 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 700,
    });
  });

  test('does nothing without a start overlay', async () => {
    document.body.innerHTML = '';
    global.fetch = jest.fn();

    await renderOverlayBricks();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('does nothing when the overlay has no look panes', async () => {
    document.body.innerHTML = '<div id="startOverlay"></div>';
    global.fetch = jest.fn();

    await renderOverlayBricks();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('draws the résumé in both looks from a single request', async () => {
    mockResume([
      { tag: 'p', text: 'Nathan Zimmerman' },
      { tag: 'p', text: 'Raritan, NJ' },
    ]);

    await renderOverlayBricks();

    const light = document.getElementById('light');
    const dark = document.getElementById('dark');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(light.dataset.layout).toBe('typeset');
    expect(dark.dataset.layout).toBe('wall');
    expect(dark.querySelectorAll('.overlay-brick')).toHaveLength(4);
    // Only the typeset page carries a rule under the contact line, and its
    // pieces are bricks like the four words.
    const rule = light.querySelectorAll('.overlay-brick.brick--rule');
    expect(rule.length).toBeGreaterThan(0);
    expect(light.querySelectorAll('.overlay-brick')).toHaveLength(
      4 + rule.length
    );
    expect(dark.querySelectorAll('.brick--rule')).toHaveLength(0);
  });

  test('warns instead of failing when the résumé cannot be loaded', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(renderOverlayBricks()).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
