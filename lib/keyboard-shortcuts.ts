import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(config: ShortcutConfig | ShortcutConfig[]) {
  useEffect(() => {
    const shortcuts = Array.isArray(config) ? config : [config];

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const matchesKey = event.key === shortcut.key;
        const matchesCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const matchesShift = shortcut.shift ? event.shiftKey : true;
        const matchesAlt = shortcut.alt ? event.altKey : true;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);
}

// Common keyboard shortcut patterns
export const KeyboardShortcuts = {
  // Answer selection (1-4 or 1-9)
  useAnswerSelection: (onSelect: (index: number) => void, maxOptions: number = 4) => {
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const num = parseInt(event.key);
        if (!isNaN(num) && num >= 1 && num <= maxOptions) {
          event.preventDefault();
          onSelect(num - 1);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelect, maxOptions]);
  },

  // Enter to submit
  useEnterToSubmit: (onSubmit: () => void) => {
    useKeyboardShortcut({
      key: 'Enter',
      callback: onSubmit,
      preventDefault: true,
    });
  },

  // Escape to close/cancel
  useEscapeToClose: (onClose: () => void) => {
    useKeyboardShortcut({
      key: 'Escape',
      callback: onClose,
    });
  },
};
