import { useRef, type ReactNode, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps children in a card that tilts toward the pointer in 3D, driven purely
 * by CSS custom properties (--rx/--ry/--tz) set on pointer move — no extra
 * dependency, and it degrades to a flat card with no JS listeners on touch
 * devices (onPointerMove simply won't fire the way it does for a mouse).
 */
export function Tilt({
  children,
  className,
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt angle in degrees. */
  max?: number;
  /** Whether to render a subtle light-glare layer that follows the pointer. */
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * max * 2;
    const rx = (0.5 - py) * max * 2;
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--tz", "6px");
    el.style.setProperty("--glare-x", `${px * 100}%`);
    el.style.setProperty("--glare-y", `${py * 100}%`);
    el.style.setProperty("--glare-o", "1");
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0px");
    el.style.setProperty("--glare-o", "0");
  }

  const glareStyle: CSSProperties = {
    background:
      "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), oklch(1 0 0 / 12%), transparent 45%)",
    opacity: "var(--glare-o, 0)",
    transition: "opacity 200ms ease",
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className={cn("tilt-3d relative transition-transform duration-150 ease-out", className)}
    >
      {children}
      {glare ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={glareStyle}
        />
      ) : null}
    </div>
  );
}
