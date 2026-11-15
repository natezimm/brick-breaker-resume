/**
 * The game's dialogs are native <dialog> elements opened with showModal(), so
 * the browser provides Escape to close, a focus trap, an inert page behind and
 * focus returned to the opener. The fallbacks cover environments without it.
 */

export function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

export function closeDialog(dialog) {
  if (!dialog?.hasAttribute('open')) return;
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}

/**
 * Closes the dialog on a click on its backdrop. A click on the backdrop
 * targets the dialog itself but lands outside its box.
 */
export function closeOnBackdropClick(dialog) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;

    const box = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!inside) closeDialog(dialog);
  });
}
