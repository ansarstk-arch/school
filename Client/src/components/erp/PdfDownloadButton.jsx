import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

/**
 * Reusable PDF Download Button with Loading State
 * 
 * @param {Object} props
 * @param {Function} props.onDownload - Async function that handles the PDF download
 * @param {string} props.label - Button label (default: "PDF ډاونلوډ")
 * @param {string} props.loadingLabel - Loading label (default: "ډاونلوډ کیږي...")
 * @param {string} props.variant - Button variant: 'primary' | 'secondary' | 'outline' (default: 'outline')
 * @param {string} props.size - Button size: 'sm' | 'md' | 'lg' (default: 'sm')
 * @param {boolean} props.disabled - Disable button
 * @param {string} props.className - Additional CSS classes
 */
export function PdfDownloadButton({
  onDownload,
  label = "PDF ډاونلوډ",
  loadingLabel = "ډاونلوډ کیږي...",
  variant = "outline",
  size = "sm",
  disabled = false,
  className = "",
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onDownload();
    } catch (error) {
      console.error("PDF download error:", error);
      // Error handling is done in the parent component via toast
    } finally {
      setIsLoading(false);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
    outline: "border border-input hover:bg-muted",
  };

  // Size styles
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const baseStyles = "rounded flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={buttonStyles}
      type="button"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <FileDown className="size-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/**
 * Compact PDF Download Icon Button (for tables/toolbars)
 */
export function PdfDownloadIconButton({
  onDownload,
  disabled = false,
  className = "",
  title = "PDF ډاونلوډ",
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      await onDownload();
    } catch (error) {
      console.error("PDF download error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={title}
      className={`p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
      type="button"
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
    </button>
  );
}
