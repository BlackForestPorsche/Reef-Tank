"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HOLD_MS = 520;
const ARM_MS = 4000;

export function HoldButton({
  label,
  hint,
  onConfirm,
  disabled,
  variant = "teal",
  active,
}: {
  label: string;
  hint?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "teal" | "danger" | "amber";
  active?: boolean;
}) {
  const root = useRef<HTMLButtonElement>(null);
  const [fill, setFill] = useState(0);
  const [armed, setArmed] = useState(false);
  const holding = useRef(false);
  const armedRef = useRef(false);
  const fired = useRef(false);
  const raf = useRef<number | null>(null);
  const started = useRef(0);
  const armTimer = useRef<number | null>(null);
  const confirmRef = useRef(onConfirm);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    confirmRef.current = onConfirm;
    disabledRef.current = disabled;
    armedRef.current = armed;
  });

  useEffect(() => {
    const button = root.current;
    if (!button) return;

    function stopRaf() {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    }

    function clearArm() {
      if (armTimer.current) window.clearTimeout(armTimer.current);
      armTimer.current = null;
      armedRef.current = false;
      setArmed(false);
    }

    function fire() {
      if (fired.current || disabledRef.current) return;
      fired.current = true;
      holding.current = false;
      stopRaf();
      clearArm();
      setFill(1);
      void confirmRef.current();
      window.setTimeout(() => {
        setFill(0);
        fired.current = false;
      }, 160);
    }

    function tick() {
      if (!holding.current) return;
      const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
      setFill(p);
      if (p >= 1) {
        fire();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    }

    function pointerDown(e: PointerEvent) {
      if (disabledRef.current) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();

      if (armedRef.current) {
        fire();
        return;
      }

      fired.current = false;
      holding.current = true;
      started.current = performance.now();
      try {
        root.current?.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      raf.current = requestAnimationFrame(tick);
    }

    function pointerUp(e: PointerEvent) {
      if (!holding.current) return;
      const elapsed = performance.now() - started.current;
      holding.current = false;
      stopRaf();
      try {
        root.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (fired.current) return;
      setFill(0);
      if (elapsed < HOLD_MS) {
        armedRef.current = true;
        setArmed(true);
        if (armTimer.current) window.clearTimeout(armTimer.current);
        armTimer.current = window.setTimeout(() => {
          clearArm();
        }, ARM_MS);
      }
    }

    function blockMenu(e: Event) {
      e.preventDefault();
    }

    function pointerCancel(e: PointerEvent) {
      e.preventDefault();
    }

    button.addEventListener("pointerdown", pointerDown, { passive: false });
    button.addEventListener("pointerup", pointerUp, { passive: false });
    button.addEventListener("pointercancel", pointerCancel, { passive: false });
    button.addEventListener("contextmenu", blockMenu, { capture: true });
    button.addEventListener("auxclick", blockMenu);

    return () => {
      stopRaf();
      clearArm();
      button.removeEventListener("pointerdown", pointerDown);
      button.removeEventListener("pointerup", pointerUp);
      button.removeEventListener("pointercancel", pointerCancel);
      button.removeEventListener("contextmenu", blockMenu, {
        capture: true,
      } as EventListenerOptions);
      button.removeEventListener("auxclick", blockMenu);
    };
  }, []);

  const colors = {
    teal: "from-teal-500/80 to-cyan-400/90 text-teal-50",
    danger: "from-rose-600/80 to-orange-500/80 text-rose-50",
    amber: "from-amber-500/80 to-yellow-400/80 text-amber-50",
  };

  return (
    <button
      ref={root}
      type="button"
      disabled={disabled}
      data-armed={armed ? "true" : "false"}
      className={cn(
        "relative isolate touch-none overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-left select-none [-webkit-touch-callout:none]",
        "disabled:opacity-40",
        active && "ring-2 ring-teal-300/70",
        armed && "ring-2 ring-amber-300/80",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 origin-left bg-linear-to-r opacity-90",
          colors[variant],
        )}
        style={{ transform: `scaleX(${fill})`, transformOrigin: "left center" }}
      />
      <div className="pointer-events-none relative">
        <div className="font-medium tracking-wide">
          {armed ? `Confirm ${label}` : label}
        </div>
        <div className="mt-1 text-xs text-white/55">
          {armed ? "Click again to start" : (hint ?? "Hold or click twice")}
        </div>
      </div>
    </button>
  );
}
