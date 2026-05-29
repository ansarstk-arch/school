import { useState, useRef } from "react";
import { CloudinaryImage } from "./CloudinaryImage";
import { cn } from "@/lib/utils";

/**
 * ImageUpload Component
 * Handles image selection, preview, and upload
 */
export function ImageUpload({
  value,
  onChange,
  label = "انځور پورته کول",
  error,
  disabled,
  maxSize = 5, // MB
  accept = "image/jpeg,image/png,image/jpg",
  previewSize = 150,
  className,
}) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`د فایل اندازه دیره لویه ده. تر ٹولو ${maxSize} میګابایټ`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("مهرباني وکړئ د انځور فایل انتخاب کړئ");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    if (onChange) {
      onChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="relative">
          {preview ? (
            <div className="relative group">
              <CloudinaryImage
                src={preview}
                alt="مخکینه"
                width={previewSize}
                height={previewSize}
                quality={85}
                className="border-2 border-border rounded"
                objectFit="cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded flex items-center justify-center bg-muted cursor-pointer hover:bg-muted/80 transition"
              style={{ width: previewSize, height: previewSize }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center text-muted-foreground">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-xs">انځور انتخاب کړئ</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {preview ? "انځور بدلول" : "انځور انتخاب کړئ"}
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            تر ٹولو اندازه: {maxSize} میګابایټ
            <br />
            ملاتړ فارمیټونه: JPG, PNG
            <br />
            <span className="text-primary">په اوټوماتیک ډول کمپریس کیږي</span>
          </p>
        </div>
      </div>

      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
