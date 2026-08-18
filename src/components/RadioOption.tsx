import React from 'react';
import { Check } from 'lucide-react';

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  shortcutIndex?: number;
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  label,
  selected,
  onSelect,
  shortcutIndex,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full group text-left py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-[5px] border transition-all duration-200 flex items-center justify-between cursor-pointer ${
        selected
          ? 'bg-neutral-900 border-white text-white font-medium shadow-sm'
          : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white hover:bg-neutral-950'
      }`}
    >
      <div className="flex items-center space-x-3.5">
        <div
          className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors ${
            selected
              ? 'bg-white border-white text-black'
              : 'border-neutral-700 bg-neutral-900 group-hover:border-neutral-500'
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
        <span className="text-xs sm:text-sm font-medium tracking-tight">{label}</span>
      </div>

      {shortcutIndex !== undefined && (
        <span
          className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border transition-colors ${
            selected
              ? 'bg-white text-black font-bold border-white'
              : 'bg-neutral-900 text-neutral-500 border-neutral-800 group-hover:text-neutral-300 group-hover:border-neutral-700'
          }`}
        >
          {shortcutIndex}
        </span>
      )}
    </button>
  );
};
