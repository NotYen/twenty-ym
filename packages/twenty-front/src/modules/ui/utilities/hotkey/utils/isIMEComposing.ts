/**
 * Check if the keyboard event is from an IME (Input Method Editor) composition.
 * This allows CJK (Chinese, Japanese, Korean) users to use arrow keys
 * for character selection in the IME candidate window.
 *
 * Checks multiple conditions for different IME implementations:
 * - isComposing: standard CompositionEvent API
 * - keyCode 229: legacy IME indicator (used by some browsers)
 * - key === 'Process': some IMEs send this during composition
 */
export const isIMEComposing = (event: KeyboardEvent): boolean => {
  return event.isComposing || event.keyCode === 229 || event.key === 'Process';
};
