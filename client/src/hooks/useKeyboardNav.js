import { useEffect } from 'react';

/**
 * Replaces vanilla lbKeydown document listener.
 * Props drive navigation instead of reading global currentPhotoId / photos[].
 */
export function useKeyboardNav({
  isOpen,
  activeId,
  photoIds,
  onClose,
  onNavigate,
  ignoreInputFocus = true,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (ignoreInputFocus) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }

      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (!activeId || photoIds.length <= 1) return;

      const idx = photoIds.indexOf(activeId);
      if (idx === -1) return;

      const next =
        e.key === 'ArrowRight'
          ? photoIds[(idx + 1) % photoIds.length]
          : photoIds[(idx - 1 + photoIds.length) % photoIds.length];

      onNavigate(next);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, activeId, photoIds, onClose, onNavigate, ignoreInputFocus]);
}
