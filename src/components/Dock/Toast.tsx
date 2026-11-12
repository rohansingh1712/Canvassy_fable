import { useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';

/** Transient confirmation with an Undo action — replaces "are you sure?" dialogs. */
export function Toast() {
  const toast = useCanvasStore((s) => s.toast);
  const { dismissToast, undo } = useCanvasStore.getState();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 5000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="toast" key={toast.id} role="status">
      <span>{toast.message}</span>
      {toast.undoable && (
        <button className="toast-action" onClick={undo}>
          Undo
        </button>
      )}
    </div>
  );
}
