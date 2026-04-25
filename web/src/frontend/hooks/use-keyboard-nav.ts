"use client";

import { useEffect, type RefObject } from "react";

interface UseKeyboardNavConfig {
  wrapperRef: RefObject<HTMLElement | null>;
  move: (dr: number, dc: number, copy?: boolean) => void;
  extendSelection: (dr: number, dc: number) => void;
  copyCurrent: () => void;
  selectAll: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
}

export function useKeyboardNav(config: UseKeyboardNavConfig) {
  const { wrapperRef, move, extendSelection, copyCurrent, selectAll, onEscape, onSpace } = config;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    function handleKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        copyCurrent();
        return;
      }
      if (meta && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        selectAll();
        return;
      }
      if (e.key === " " && onSpace) {
        e.preventDefault();
        onSpace();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (e.shiftKey && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const dr = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        const dc = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        extendSelection(dr, dc);
        return;
      }

      if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
      else if (e.key === "Enter") { e.preventDefault(); move(1, 0, true); }
      else if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); move(0, 1, true); }
      else if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); move(0, -1, true); }
      else if (e.key === "Home") { e.preventDefault(); move(0, -999); }
      else if (e.key === "End") { e.preventDefault(); move(0, 999); }
    }

    el.addEventListener("keydown", handleKey);
    return () => el.removeEventListener("keydown", handleKey);
  }, [wrapperRef, move, extendSelection, copyCurrent, selectAll, onEscape, onSpace]);
}
