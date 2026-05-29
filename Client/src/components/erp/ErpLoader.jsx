import { useEffect, useState } from "react";

/**
 * useDelayedLoader — only returns true after `delay` ms.
 * Prevents the loader from flashing on fast network responses.
 */
export function useDelayedLoader(loading, delay = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [loading, delay]);

  return show;
}

/**
 * ErpLoader — full-page overlay loader for route-level data fetching.
 * Only render this when useDelayedLoader returns true.
 */
export function ErpLoader({ text = "معلومات راوړل کیږي..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        {/* Animated grid of dots */}
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="size-2 rounded-sm bg-primary"
              style={{
                animation: "erp-dot-pulse 1.2s ease-in-out infinite",
                animationDelay: `${(i % 3) * 0.15 + Math.floor(i / 3) * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Label */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">{text}</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1 rounded-full bg-muted-foreground/50"
                style={{
                  animation: "erp-bounce 1s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes erp-dot-pulse {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1);    }
        }
        @keyframes erp-bounce {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

/**
 * ErpInlineLoader — compact inline loader for sections / cards.
 * Use this inside a card/panel instead of the full-page overlay.
 */
export function ErpInlineLoader({ text = "بارول کیږي..." }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <div className="relative size-8">
        {/* Outer ring */}
        <span className="absolute inset-0 rounded-full border-2 border-border" />
        {/* Spinning arc */}
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          style={{ animation: "erp-spin-ring 0.7s linear infinite" }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>

      <style>{`
        @keyframes erp-spin-ring {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
