interface Shortcut {
  keys: string[];
  label: string;
}

interface KeyboardShortcutsBarProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsBar({ shortcuts }: KeyboardShortcutsBarProps) {
  return (
    <div className="flex gap-4 px-5 py-1.5 text-[10px] text-[var(--cevi-text-faint)] bg-[var(--cevi-surface-warm)] border-t border-[var(--cevi-border-light)] flex-wrap items-center font-medium select-none">
      {shortcuts.map((sc, i) => (
        <span key={i} className="inline-flex items-center gap-[5px]">
          {sc.keys.map((k, ki) => (
            <kbd key={ki}>{k}</kbd>
          ))}
          <span>{sc.label}</span>
        </span>
      ))}
    </div>
  );
}
