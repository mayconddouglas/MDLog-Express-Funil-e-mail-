import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { SmartForm } from './components/SmartForm';
import { LeadDashboard } from './components/LeadDashboard';
import { LeadData } from './types';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps] = useState<number>(6);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);

  // Fetch leads from backend API
  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.warn('Unable to fetch leads from server:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLeadSubmitted = (newLead: LeadData) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0 && currentStep <= 6) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-black text-white flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Top Header */}
      <Header
        currentStep={currentStep}
        onBack={handleBackStep}
      />

      {/* Progress Bar for Step 1-6 */}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      {/* Form Container */}
      <main className="flex-1 flex flex-col justify-center overflow-y-auto px-4 no-scrollbar">
        <SmartForm
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          totalSteps={totalSteps}
          onLeadSubmitted={handleLeadSubmitted}
        />
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-2xl mx-auto px-4 py-3 sm:py-4 border-t border-neutral-900 text-center text-xs text-neutral-600 font-mono flex-shrink-0">
        MDLogExpress
      </footer>

      {/* Commercial Lead Management Dashboard Modal */}
      <LeadDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        leads={leads}
        onDeleteLead={handleDeleteLead}
      />
    </div>
  );
}
