import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number; // 6 questions
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  if (currentStep === 0 || currentStep > totalSteps) {
    return null;
  }

  const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-3 mb-4">
      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5 font-medium">
        <span>Pergunta {currentStep} de {totalSteps}</span>
        <span>{percentage}% concluído</span>
      </div>
      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
