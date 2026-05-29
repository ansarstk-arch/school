import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CloudinaryImage Component
 * Displays images from Cloudinary with optimization, loading states, and fallbacks
 */
export function CloudinaryImage({
  src,
  alt = "انځور",
  width = 400,
  height = 400,
  quality = 80,
  className,
  fallback = "/placeholder.png",
  rounded = false,
  objectFit = "cover",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // If no src or error, show fallback
  if (!src || error) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground",
          rounded && "rounded-full",
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="w-1/3 h-1/3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  }

  // Optimize Cloudinary URL
  const optimizedUrl = getOptimizedCloudinaryUrl(src, { width, height, quality });

  return (
    <div className={cn("relative overflow-hidden", rounded && "rounded-full", className)}>
      {loading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-xs text-muted-foreground">لوډ کیږي...</span>
        </div>
      )}
      <img
        src={optimizedUrl}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        style={{
          width,
          height,
          objectFit,
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}

/**
 * Get optimized Cloudinary URL with transformations
 */
function getOptimizedCloudinaryUrl(url, options = {}) {
  const { width = 400, height = 400, quality = 80 } = options;

  // If not a Cloudinary URL, return as-is
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  // Extract parts from Cloudinary URL
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dk2srogw3";
  
  // Check if URL already has transformations
  if (url.includes("/upload/")) {
    // Insert transformations after /upload/
    const transformation = `w_${width},h_${height},c_fill,q_${quality},f_auto`;
    return url.replace("/upload/", `/upload/${transformation}/`);
  }

  return url;
}

/**
 * Avatar Component - Circular profile image
 */
export function Avatar({ src, alt, size = 40, className }) {
  return (
    <CloudinaryImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={85}
      className={className}
      rounded={true}
      objectFit="cover"
    />
  );
}

/**
 * Thumbnail Component - Small preview image
 */
export function Thumbnail({ src, alt, className }) {
  return (
    <CloudinaryImage
      src={src}
      alt={alt}
      width={80}
      height={80}
      quality={70}
      className={className}
      objectFit="cover"
    />
  );
}

/**
 * ImagePreview Component - Large preview with modal support
 */
export function ImagePreview({ src, alt, className }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={cn("cursor-pointer hover:opacity-80 transition", className)}
        onClick={() => setShowModal(true)}
      >
        <CloudinaryImage
          src={src}
          alt={alt}
          width={300}
          height={300}
          quality={85}
          objectFit="cover"
        />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-10 left-0 text-white hover:text-gray-300"
              onClick={() => setShowModal(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getOptimizedCloudinaryUrl(src, { width: 1200, height: 1200, quality: 90 })}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
