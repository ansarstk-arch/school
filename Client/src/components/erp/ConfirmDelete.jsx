import { ErpModal } from "@/components/erp/ErpModal";
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * ConfirmDelete — shared delete confirmation modal
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onConfirm   () => void   — called when user clicks delete
 *   title       string       — item name / identifier shown in bold
 *   subtitle    string?      — optional extra line (e.g. class section)
 */
export function ConfirmDelete({ open, onClose, onConfirm, title, subtitle }) {
  return (
    <ErpModal
      open={open}
      onOpenChange={onClose}
      title="د ړنګولو تایید"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted"
          >
            لغوه
          </button>
          <button
            onClick={() => { onConfirm(); onClose(false); }}
            className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded flex items-center gap-1.5"
          >
            <Trash2 className="size-3.5" /> ړنګول
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        {title && <p className="text-sm font-semibold">{title}{subtitle ? ` — ${subtitle}` : ""}</p>}
        <p className="text-sm text-muted-foreground">
          ایا ډاډه یاست چې غواړئ دا ړنګ کړئ؟
        </p>
        <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-1.5 w-full">
          ⚠ دا کار بیرته نه شي اخیستل کیدای
        </p>
      </div>
    </ErpModal>
  );
}
