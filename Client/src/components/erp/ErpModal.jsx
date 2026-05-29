import Modal from "react-modal";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

Modal.setAppElement("#root");

const sizeMap = {
  sm: "w-full max-w-md",
  md: "w-full max-w-xl",
  lg: "w-full max-w-3xl",
  xl: "w-full max-w-5xl",
};

export function ErpModal({ open, onOpenChange, title, children, footer, size = "md" }) {
  return (
    <Modal
      isOpen={open}
      onRequestClose={() => onOpenChange(false)}
      closeTimeoutMS={200}
      overlayClassName="ReactModal__Overlay"
      className={cn("ReactModal__Content", sizeMap[size])}
      shouldCloseOnOverlayClick={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border shrink-0">
        <h2 className="text-sm sm:text-base font-semibold text-foreground pr-4">{title}</h2>
        <button
          onClick={() => onOpenChange(false)}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="px-4 sm:px-5 py-3 border-t border-border flex items-center justify-end gap-2 flex-wrap shrink-0">
          {footer}
        </div>
      )}
    </Modal>
  );
}
