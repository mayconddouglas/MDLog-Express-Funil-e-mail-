import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RadioOption } from './RadioOption';
import { FormState, LeadData } from '../types';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Building, MapPin, Phone, Mail, User, Truck, ShieldCheck, FileText, XCircle, Clock, Zap, ChevronDown, Star } from 'lucide-react';

interface SmartFormProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  onLeadSubmitted: (lead: LeadData) => void;
}

const SEGMENT_OPTIONS = [
  'Loja Física',
  'E-commerce',
  'Farmácia',
  'Restaurante',
  'Autopeças',
  'Distribuidora',
  'Escritório',
  'Outro',
];

const FREQUENCY_OPTIONS = [
  'Todos os dias',
  '2 a 3 vezes por semana',
  'Semanalmente',
  'Esporadicamente',
  'Ainda estou pesquisando',
];

const VOLUME_OPTIONS = [
  '1–5',
  '6–10',
  '11–20',
  'Mais de 20',
  'Ainda não sei',
];

export const SmartForm: React.FC<SmartFormProps> = ({
  currentStep,
  setCurrentStep,
  totalSteps,
  onLeadSubmitted,
}) => {
  const [formData, setFormData] = useState<FormState>({
    companyName: '',
    segment: '',
    location: '',
    frequency: '',
    dailyVolume: '',
    contactName: '',
    contactWhatsApp: '',
    contactEmail: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastSubmittedLead, setLastSubmittedLead] = useState<LeadData | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when step changes
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [currentStep]);

  // Handle global keydown (Enter to advance, numbers for radio selections)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input and pressed a key other than Enter
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'Enter') {
        if (currentStep >= 1 && currentStep <= 6) {
          e.preventDefault();
          handleNext();
        } else if (currentStep === 0) {
          e.preventDefault();
          setCurrentStep(1);
        }
        return;
      }

      // Shortcut numbers for radio options
      if (!isInput) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1) {
          if (currentStep === 2 && num <= SEGMENT_OPTIONS.length) {
            handleRadioSelect('segment', SEGMENT_OPTIONS[num - 1]);
          } else if (currentStep === 4 && num <= FREQUENCY_OPTIONS.length) {
            handleRadioSelect('frequency', FREQUENCY_OPTIONS[num - 1]);
          } else if (currentStep === 5 && num <= VOLUME_OPTIONS.length) {
            handleRadioSelect('dailyVolume', VOLUME_OPTIONS[num - 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleRadioSelect = (field: keyof FormState, value: string) => {
    updateField(field, value);
    // Auto advance after short delay for seamless flow
    setTimeout(() => {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
      }
    }, 200);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1 && !formData.companyName.trim()) {
      newErrors.companyName = 'Por favor, informe o nome da sua empresa.';
    }

    if (step === 2 && !formData.segment) {
      newErrors.segment = 'Por favor, selecione o segmento do seu negócio.';
    }

    if (step === 3 && !formData.location.trim()) {
      newErrors.location = 'Por favor, informe a cidade ou bairro da sua empresa.';
    }

    if (step === 4 && !formData.frequency) {
      newErrors.frequency = 'Por favor, selecione com que frequência precisa de entregas.';
    }

    if (step === 5 && !formData.dailyVolume) {
      newErrors.dailyVolume = 'Por favor, selecione a média de entregas por dia.';
    }

    if (step === 6) {
      if (!formData.contactName.trim()) {
        newErrors.contactName = 'Por favor, informe seu nome.';
      }
      if (!formData.contactWhatsApp.trim()) {
        newErrors.contactWhatsApp = 'Por favor, informe um WhatsApp válido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 6) {
      // Final submission step
      await submitForm();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success && data.lead) {
        setLastSubmittedLead(data.lead);
        onLeadSubmitted(data.lead);
        setCurrentStep(7); // Final screen
      } else {
        setErrors({ submit: data.error || 'Erro ao enviar a solicitação. Tente novamente.' });
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
      setErrors({ submit: 'Erro de conexão ao enviar a solicitação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = () => {
    setIsFinalizing(true);
    setShowToast(true);
    setTimeout(() => {
      resetForm();
      setIsFinalizing(false);
      setTimeout(() => setShowToast(false), 2500);
    }, 900);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      segment: '',
      location: '',
      frequency: '',
      dailyVolume: '',
      contactName: '',
      contactWhatsApp: '',
      contactEmail: '',
    });
    setErrors({});
    setLastSubmittedLead(null);
    setCurrentStep(0);
  };

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-2 sm:py-4">
      <AnimatePresence mode="wait">
        {/* STEP 0: TELA INICIAL */}
        {currentStep === 0 && (
          <motion.div
            key="step-0"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col w-full px-1"
          >
            <div className="flex flex-col items-center w-full py-4 sm:py-8">
              <div className="text-center mb-8">
                <h2 className="font-headline font-bold text-xl sm:text-2xl text-white tracking-tight mb-2">
                  Por que mudar para a MDLog Express?
                </h2>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto">
                  Veja a diferença entre depender de aplicativos e ter um motoboy dedicado para o seu negócio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mb-8">
                {/* Apps */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[8px] p-5 flex flex-col">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-semibold text-neutral-300">Apps Comuns (Uber/99/inDrive)</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-neutral-400 flex-1">
                    <li className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-red-500/80 mt-0.5 shrink-0" />
                      <span>Demora imprevisível para aceitarem a corrida</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-red-500/80 mt-0.5 shrink-0" />
                      <span>Cancelamentos frequentes de motoristas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-red-500/80 mt-0.5 shrink-0" />
                      <span>Preços dinâmicos (alta em horários de pico)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-red-500/80 mt-0.5 shrink-0" />
                      <span>Entregador não tem compromisso com a sua marca</span>
                    </li>
                  </ul>
                </div>

                {/* MDLog Express */}
                <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-[8px] p-5 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500/10 px-2 py-1 rounded-bl-[8px] border-b border-l border-emerald-500/20">
                     <span className="text-[10px] font-mono font-bold text-emerald-400">EXCLUSIVO</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">MDLog Express</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 flex-1">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Motoboy dedicado na porta da sua loja</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Despacho imediato, sem filas de espera</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Valores fixos sem surpresas no fim do mês</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Especializados no manuseio do seu produto</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-neutral-400 font-medium">
                  Junte-se a dezenas de lojistas locais que já pararam de perder tempo com cancelamentos.
                </span>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                type="button"
                className="group py-3 sm:py-2.5 px-6 w-full sm:w-auto text-xs sm:text-sm font-semibold rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <span>Quero parar de perder tempo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 1: NOME DA EMPRESA */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-3 sm:py-4"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 1 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">
              Qual é o nome da sua empresa?
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Ex.: Loja Exemplo"
                  className="w-full bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs sm:text-sm py-2.5 px-3.5 rounded-[5px] placeholder:text-neutral-600 transition-colors"
                />
              </div>

              {errors.companyName && (
                <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.companyName}</p>
              )}

              <div className="flex items-center justify-between pt-3">
                <span className="text-[11px] text-neutral-500 hidden sm:inline">Pressione Enter ↵ para avançar</span>
                <button
                  onClick={handleNext}
                  type="button"
                  className="py-2 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all ml-auto cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SEGMENTO */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-2 sm:py-3"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 2 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3">
              Qual é o segmento do seu negócio?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {SEGMENT_OPTIONS.map((option, idx) => (
                <RadioOption
                  key={option}
                  label={option}
                  selected={formData.segment === option}
                  onSelect={() => handleRadioSelect('segment', option)}
                  shortcutIndex={idx + 1}
                />
              ))}
            </div>

            {errors.segment && (
              <p className="text-[11px] text-red-400 mb-2 font-medium">{errors.segment}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500 hidden sm:inline">Use os números (1-8) ou clique na opção</span>
              <button
                onClick={handleNext}
                type="button"
                className="py-2 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all ml-auto cursor-pointer flex items-center space-x-1.5"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOCALIZAÇÃO */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-3 sm:py-4"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 3 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">
              Em qual cidade ou bairro sua empresa está localizada?
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Ex.: Boa Viagem • Recife"
                  className="w-full bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs sm:text-sm py-2.5 px-3.5 rounded-[5px] placeholder:text-neutral-600 transition-colors"
                />
              </div>

              {errors.location && (
                <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.location}</p>
              )}

              <div className="flex items-center justify-between pt-3">
                <span className="text-[11px] text-neutral-500 hidden sm:inline">Pressione Enter ↵ para avançar</span>
                <button
                  onClick={handleNext}
                  type="button"
                  className="py-2 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all ml-auto cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: FREQUÊNCIA DE ENTREGAS */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-3 sm:py-4"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 4 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">
              Com que frequência sua empresa precisa de entregas?
            </h2>

            <div className="space-y-2 mb-3">
              {FREQUENCY_OPTIONS.map((option, idx) => (
                <RadioOption
                  key={option}
                  label={option}
                  selected={formData.frequency === option}
                  onSelect={() => handleRadioSelect('frequency', option)}
                  shortcutIndex={idx + 1}
                />
              ))}
            </div>

            {errors.frequency && (
              <p className="text-[11px] text-red-400 mb-2 font-medium">{errors.frequency}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500 hidden sm:inline">Selecione uma opção para prosseguir</span>
              <button
                onClick={handleNext}
                type="button"
                className="py-2 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all ml-auto cursor-pointer flex items-center space-x-1.5"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: MÉDIA DE ENTREGAS POR DIA */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-3 sm:py-4"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 5 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4">
              Em média, quantas entregas sua empresa realiza por dia?
            </h2>

            <div className="space-y-2 mb-3">
              {VOLUME_OPTIONS.map((option, idx) => (
                <RadioOption
                  key={option}
                  label={option}
                  selected={formData.dailyVolume === option}
                  onSelect={() => handleRadioSelect('dailyVolume', option)}
                  shortcutIndex={idx + 1}
                />
              ))}
            </div>

            {errors.dailyVolume && (
              <p className="text-[11px] text-red-400 mb-2 font-medium">{errors.dailyVolume}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500 hidden sm:inline">Última etapa em seguida</span>
              <button
                onClick={handleNext}
                type="button"
                className="py-2 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all ml-auto cursor-pointer flex items-center space-x-1.5"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: DADOS DE CONTATO */}
        {currentStep === 6 && (
          <motion.div
            key="step-6"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="py-2 sm:py-3"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider block mb-1">
              Pergunta 6 de 6
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-white mb-3">
              Como podemos entrar em contato?
            </h2>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  Seu nome <span className="text-white">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs sm:text-sm py-2 pl-9 pr-3 rounded-[5px] placeholder:text-neutral-600 transition-colors"
                  />
                </div>
                {errors.contactName && (
                  <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  WhatsApp com DDD <span className="text-white">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="tel"
                    value={formData.contactWhatsApp}
                    onChange={(e) => updateField('contactWhatsApp', e.target.value)}
                    placeholder="(81) 99999-9999"
                    className="w-full bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs sm:text-sm py-2 pl-9 pr-3 rounded-[5px] placeholder:text-neutral-600 transition-colors"
                  />
                </div>
                {errors.contactWhatsApp && (
                  <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.contactWhatsApp}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  E-mail corporativo <span className="text-neutral-600 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full bg-black border border-white/20 focus:border-white focus:outline-none text-white text-xs sm:text-sm py-2 pl-9 pr-3 rounded-[5px] placeholder:text-neutral-600 transition-colors"
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="p-2 bg-red-950/50 border border-red-800/80 rounded-[5px] text-[11px] text-red-300">
                  {errors.submit}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  type="button"
                  className="w-full py-2.5 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analisando perfil corporativo...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar e Solicitar Contato</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 7: TELA FINAL / SUCESSO */}
        {currentStep === 7 && (
          <motion.div
            key="step-7"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center py-4 sm:py-6"
          >
            <div className="w-10 h-10 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-[5px] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <h1 className="font-headline font-bold text-xl sm:text-2xl text-white tracking-tight mb-2">
              Solicitação recebida.
            </h1>

            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-5">
              Obrigado pelas informações. Os dados deste formulário foram enviados diretamente para <span className="text-white font-medium underline underline-offset-4 decoration-emerald-500/50">mdlogexpress@gmail.com</span>. Nossa equipe comercial entrará em contato em breve.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                onClick={handleFinalize}
                disabled={isFinalizing}
                type="button"
                className="w-full py-2.5 px-5 font-semibold text-xs sm:text-sm rounded-[5px] bg-white text-black hover:bg-[#EAEAEA] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isFinalizing ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center space-x-2 text-emerald-800 font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Concluído!</span>
                  </motion.div>
                ) : (
                  <span>Finalizar</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Micro-Feedback Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-[5px] shadow-2xl flex items-center space-x-2.5 text-xs font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Solicitação concluída com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
