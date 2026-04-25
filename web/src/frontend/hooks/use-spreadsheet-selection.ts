"use client";

import { useState, useCallback, useRef } from "react";

interface SelectionState {
  r: number;
  c: number;
  r2: number;
  c2: number;
}

interface UseSpreadsheetSelectionConfig {
  rowCount: number;
  colCount: number;
  getCellValue: (r: number, c: number) => string;
  onCopy?: (text: string) => void;
}

export function useSpreadsheetSelection(config: UseSpreadsheetSelectionConfig) {
  const { rowCount, colCount, getCellValue, onCopy } = config;
  const [sel, setSel] = useState<SelectionState>({ r: 0, c: 0, r2: 0, c2: 0 });
  const [flashedCells, setFlashedCells] = useState<Set<string>>(new Set());
  const rangeStart = useRef<{ r: number; c: number } | null>(null);

  const getRange = useCallback(
    (s: SelectionState) => ({
      r1: Math.min(s.r, s.r2),
      r2: Math.max(s.r, s.r2),
      c1: Math.min(s.c, s.c2),
      c2: Math.max(s.c, s.c2),
    }),
    [],
  );

  const onMouseDown = useCallback(
    (r: number, c: number, shiftKey: boolean) => {
      if (shiftKey) {
        if (!rangeStart.current) rangeStart.current = { r: sel.r, c: sel.c };
        setSel({ r: rangeStart.current.r, c: rangeStart.current.c, r2: r, c2: c });
        return;
      }
      rangeStart.current = { r, c };
      setSel({ r, c, r2: r, c2: c });
    },
    [sel.r, sel.c],
  );

  const onMouseEnter = useCallback(
    (r: number, c: number, buttons: number) => {
      if (buttons !== 1 || !rangeStart.current) return;
      setSel({ r: rangeStart.current.r, c: rangeStart.current.c, r2: r, c2: c });
    },
    [],
  );

  const selectRow = useCallback(
    (r: number, shiftKey: boolean) => {
      if (shiftKey && rangeStart.current) {
        setSel({ r: rangeStart.current.r, c: 0, r2: r, c2: colCount - 1 });
      } else {
        rangeStart.current = { r, c: 0 };
        setSel({ r, c: 0, r2: r, c2: colCount - 1 });
      }
    },
    [colCount],
  );

  const selectColumn = useCallback(
    (c: number, shiftKey: boolean) => {
      if (shiftKey && rangeStart.current) {
        setSel({ r: 0, c: rangeStart.current.c, r2: rowCount - 1, c2: c });
      } else {
        rangeStart.current = { r: 0, c };
        setSel({ r: 0, c, r2: rowCount - 1, c2: c });
      }
    },
    [rowCount],
  );

  const selectAll = useCallback(() => {
    rangeStart.current = { r: 0, c: 0 };
    setSel({ r: 0, c: 0, r2: rowCount - 1, c2: colCount - 1 });
  }, [rowCount, colCount]);

  const flashSelection = useCallback(() => {
    const range = getRange(sel);
    const keys = new Set<string>();
    for (let r = range.r1; r <= range.r2; r++) {
      for (let c = range.c1; c <= range.c2; c++) {
        keys.add(`${r}:${c}`);
      }
    }
    setFlashedCells(keys);
    setTimeout(() => setFlashedCells(new Set()), 140);
  }, [sel, getRange]);

  const copyCurrent = useCallback(() => {
    const range = getRange(sel);
    const lines: string[] = [];
    for (let r = range.r1; r <= range.r2; r++) {
      const parts: string[] = [];
      for (let c = range.c1; c <= range.c2; c++) {
        parts.push(getCellValue(r, c));
      }
      lines.push(parts.join("\t"));
    }
    const text = lines.join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    flashSelection();
    const preview = text.length > 38 ? text.substring(0, 38) + "\u2026" : text;
    onCopy?.("Copied: " + preview.replace(/\t/g, " | ").replace(/\n/g, " \u21B5 "));
  }, [sel, getRange, getCellValue, onCopy, flashSelection]);

  const move = useCallback(
    (dr: number, dc: number, copy?: boolean) => {
      if (copy) copyCurrent();
      setSel((prev) => {
        const nr = Math.max(0, Math.min(rowCount - 1, prev.r + dr));
        const nc = Math.max(0, Math.min(colCount - 1, prev.c + dc));
        rangeStart.current = { r: nr, c: nc };
        return { r: nr, c: nc, r2: nr, c2: nc };
      });
    },
    [rowCount, colCount, copyCurrent],
  );

  const extendSelection = useCallback(
    (dr: number, dc: number) => {
      setSel((prev) => {
        const nr2 = Math.max(0, Math.min(rowCount - 1, prev.r2 + dr));
        const nc2 = Math.max(0, Math.min(colCount - 1, prev.c2 + dc));
        return { r: prev.r, c: prev.c, r2: nr2, c2: nc2 };
      });
    },
    [rowCount, colCount],
  );

  const cellClasses = useCallback(
    (r: number, c: number): string => {
      const range = getRange(sel);
      if (r < range.r1 || r > range.r2 || c < range.c1 || c > range.c2) {
        if (flashedCells.has(`${r}:${c}`)) return "grid-cell sel-flashed";
        return "grid-cell";
      }

      const classes = ["grid-cell", "sel-fill"];
      if (r === sel.r && c === sel.c) classes.push("sel-anchor");
      if (r === range.r1) classes.push("sel-top");
      if (r === range.r2) classes.push("sel-bottom");
      if (c === range.c1) classes.push("sel-left");
      if (c === range.c2) classes.push("sel-right");
      if (flashedCells.has(`${r}:${c}`)) classes.push("sel-flashed");
      return classes.join(" ");
    },
    [sel, getRange, flashedCells],
  );

  const isRowSelected = useCallback(
    (r: number): boolean => {
      const range = getRange(sel);
      return r >= range.r1 && r <= range.r2;
    },
    [sel, getRange],
  );

  const isColSelected = useCallback(
    (c: number): boolean => {
      const range = getRange(sel);
      return c >= range.c1 && c <= range.c2;
    },
    [sel, getRange],
  );

  const selectedCellCount = (() => {
    const range = getRange(sel);
    return (range.r2 - range.r1 + 1) * (range.c2 - range.c1 + 1);
  })();

  return {
    sel,
    onMouseDown,
    onMouseEnter,
    selectRow,
    selectColumn,
    selectAll,
    move,
    extendSelection,
    copyCurrent,
    cellClasses,
    isRowSelected,
    isColSelected,
    selectedCellCount,
  };
}
