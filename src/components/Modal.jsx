import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export default function Modal({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/35"
    >
      <div className="flex justify-between items-center border-b border-slate-100 px-6 py-5">
        <h2 id="modal-title" className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
