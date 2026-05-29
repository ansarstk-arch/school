import { X } from "lucide-react";
import { useEffect } from "react";

/**
 * Image Lightbox Component
 * Displays an image in fullscreen with close button
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether lightbox is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 */
export function ImageLightbox({ open, onClose, src, alt = "" }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="بندول"
      >
        <X className="size-6" />
      </button>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
