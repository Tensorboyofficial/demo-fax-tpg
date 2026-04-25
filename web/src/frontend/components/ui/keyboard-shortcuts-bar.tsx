interface Shortcut {
  keys: string[];
  label: string;
}

interface KeyboardShortcutsBarProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsBar({ shortcuts }: KeyboardShortcutsBarProps) {
  return (
    <div className="flex gap-4 px-5 py-1.5 text-[10px] text-[#9CA3AF] bg-[#FCFCFC] border-t border-[#EAEAEA] flex-wrap items-center font-medium select-none">
      {shortcuts.map((sc, i) => (
        <span key={i} className="inline-flex items-center gap-[5px]">
          {sc.keys.map((k, ki) => (
            <kbd
              key={ki}
              className="font-mono text-[9px] bg-white border border-[#E5E5E5] border-b-[1.5px] rounded-[3px] px-[4px] py-[1px] text-[#4B5563] min-w-[12px] text-center inline-block font-medium"
            >
              {k}
            </kbd>
          ))}
          <span className="font-medium">{sc.label}</span>
        </span>
      ))}
    </div>
  );
}
