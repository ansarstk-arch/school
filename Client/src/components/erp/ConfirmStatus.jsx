import { ErpModal } from "@/components/erp/ErpModal";
import { AlertTriangle, UserCheck, UserX } from "lucide-react";

/**
 * ConfirmStatus — confirmation before activating/deactivating a user
 */
export function ConfirmStatus({ open, onClose, onConfirm, title, subtitle, action = "deactivate" }) {
  const isActivate = action === "activate";

  return (
    <ErpModal
      open={open}
      onOpenChange={onClose}
      title={isActivate ? "د فعالولو تایید" : "د غیر فعالولو تایید"}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">
            لغوه
          </button>
          <button
            onClick={() => { onConfirm(); onClose(false); }}
            className={`px-3 py-1.5 text-sm rounded flex items-center gap-1.5 ${
              isActivate
                ? "bg-success text-success-foreground"
                : "bg-warning text-warning-foreground"
            }`}
          >
            {isActivate ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
            {isActivate ? "فعالول" : "غیر فعالول"}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className={`size-12 rounded-full flex items-center justify-center ${
          isActivate ? "bg-success/10" : "bg-warning/10"
        }`}>
          <AlertTriangle className={`size-6 ${isActivate ? "text-success" : "text-warning"}`} />
        </div>
        {title && (
          <p className="text-sm font-semibold">
            {title}{subtitle ? ` — ${subtitle}` : ""}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {isActivate
            ? "ایا ډاډه یاست چې غواړئ دا بیا فعال کړئ؟"
            : "ایا ډاډه یاست چې غواړئ دا غیر فعال کړئ؟"}
        </p>
        {!isActivate && (
          <p className="text-xs text-muted-foreground bg-muted border border-border rounded px-3 py-2 w-full">
            غیر فعال شوی به د معاش، فیس، حاضرۍ او نورو لیستونو څخه پټ شي. تاسو کولی شئ بیا فعال کړئ.
          </p>
        )}
      </div>
    </ErpModal>
  );
}
