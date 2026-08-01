import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onBack,
}) => {
  const isQuestionStep = currentStep >= 1 && currentStep <= 6;

  return (
    <header className="w-full max-w-2xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between border-b border-neutral-900 flex-shrink-0">
      <div className="font-display text-xs tracking-widest text-neutral-300 font-bold uppercase">
        MDLog Express
      </div>

      {isQuestionStep && (
        <button
          onClick={onBack}
          type="button"
          className="flex items-center space-x-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer font-mono"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>
      )}
    </header>
  );
};

