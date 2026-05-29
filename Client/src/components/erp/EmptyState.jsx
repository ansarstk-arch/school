import { Inbox } from "lucide-react";

export function EmptyState({ title = "Nothing here yet", description, icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
