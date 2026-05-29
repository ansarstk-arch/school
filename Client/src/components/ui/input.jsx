import { cn } from "@/lib/utils";

export function Input({
  value,
  handleChanges,
  onChange,
  placeholder,
  type = "text",
  className,
  label,
  error,
  disabled,
  readOnly,
  required,
  min,
  max,
  rows,
  accept,
  id,
  name,
  autoComplete,
  ...props
}) {
  const changeHandler = handleChanges || onChange;
  const base =
    "w-full border border-input rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  if (type === "textarea") {
    return (
      <div className="flex flex-col gap-1">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={changeHandler}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows ?? 3}
          className={cn(base, "resize-none", className)}
          {...props}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={changeHandler}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        min={min}
        max={max}
        accept={accept}
        autoComplete={autoComplete}
        className={cn(base, className)}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
