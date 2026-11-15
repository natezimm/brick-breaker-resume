import {
  closeDialog,
  closeOnBackdropClick,
  openDialog,
} from '../src/dialogs.js';

describe('dialogs', () => {
  test('uses the native modal API where the browser has it', () => {
    const dialog = document.createElement('dialog');
    dialog.showModal = jest.fn(() => dialog.setAttribute('open', ''));
    dialog.close = jest.fn(() => dialog.removeAttribute('open'));

    openDialog(dialog);
    openDialog(dialog);
    expect(dialog.showModal).toHaveBeenCalledTimes(1);

    closeDialog(dialog);
    closeDialog(dialog);
    expect(dialog.close).toHaveBeenCalledTimes(1);
  });

  test('falls back to the open attribute and still reports the close', () => {
    const dialog = document.createElement('dialog');
    const onClose = jest.fn();
    dialog.addEventListener('close', onClose);

    openDialog(dialog);
    expect(dialog.hasAttribute('open')).toBe(true);
    closeDialog(dialog);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(() => openDialog(null)).not.toThrow();
    expect(() => closeDialog(null)).not.toThrow();
  });

  test('a click outside the box closes it; one on a child does not', () => {
    const dialog = document.createElement('dialog');
    const child = document.createElement('p');
    dialog.appendChild(child);
    dialog.setAttribute('open', '');
    dialog.getBoundingClientRect = () => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
    });
    closeOnBackdropClick(dialog);

    child.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 500, clientY: 500 })
    );
    expect(dialog.hasAttribute('open')).toBe(true);

    dialog.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50 }));
    expect(dialog.hasAttribute('open')).toBe(true);

    dialog.dispatchEvent(new MouseEvent('click', { clientX: 500, clientY: 5 }));
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});
