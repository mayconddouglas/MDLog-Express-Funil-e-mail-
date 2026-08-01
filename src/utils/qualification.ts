import { LeadQualification } from '../types';

export function calculateLeadQualification(
  frequency: string,
  dailyVolume: string,
  segment: string
): LeadQualification {
  let score = 30;
  const reasons: string[] = [];

  // Evaluate Frequency
  if (frequency === 'Todos os dias') {
    score += 40;
    reasons.push('Necessidade diária de logística e entregas.');
  } else if (frequency === '2 a 3 vezes por semana') {
    score += 25;
    reasons.push('Operação constante (2 a 3x por semana).');
  } else if (frequency === 'Semanalmente') {
    score += 15;
    reasons.push('Necessidade semanal de entregas.');
  } else {
    score += 5;
    reasons.push('Busca esporádica ou em fase de pesquisa.');
  }

  // Evaluate Volume
  if (dailyVolume === 'Mais de 20') {
    score += 35;
    reasons.push('Volume elevado (mais de 20 entregas/dia).');
  } else if (dailyVolume === '11–20') {
    score += 25;
    reasons.push('Volume consistente (11 a 20 entregas/dia).');
  } else if (dailyVolume === '6–10') {
    score += 15;
    reasons.push('Volume moderado (6 a 10 entregas/dia).');
  } else if (dailyVolume === '1–5') {
    score += 10;
    reasons.push('Volume inicial (1 a 5 entregas/dia).');
  } else {
    reasons.push('Volume ainda em definição.');
  }

  // Evaluate Segment synergy with MDLogExpress
  if (['E-commerce', 'Distribuidora', 'Farmácia', 'Autopeças'].includes(segment)) {
    score += 10;
    reasons.push(`Segmento de alta demanda logística (${segment}).`);
  }

  // Cap score
  score = Math.min(100, Math.max(10, score));

  let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let levelLabel = 'Cliente Esporádico / Potencial Inicial';
  let badgeColor = 'bg-neutral-800 text-neutral-300 border-neutral-700';
  let recommendedService = 'Tabela de Entregas Avulsas / Motoboy sob demanda';
  let estimatedMonthlyDeliveries = 'Até 100 entregas/mês';

  if (score >= 75) {
    level = 'HIGH';
    levelLabel = 'Cliente Recorrente (Alto Potencial)';
    badgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
    recommendedService = 'Contrato Dedicado de Frota & Tabela Corporativa Preferencial';
    estimatedMonthlyDeliveries = dailyVolume === 'Mais de 20' ? '+600 entregas/mês' : '250 a 500 entregas/mês';
  } else if (score >= 50) {
    level = 'MEDIUM';
    levelLabel = 'Cliente Médio (Frequência Regular)';
    badgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
    recommendedService = 'Plano Corporativo Flexível / Rotas Agendadas';
    estimatedMonthlyDeliveries = '100 a 250 entregas/mês';
  }

  return {
    level,
    levelLabel,
    score,
    badgeColor,
    reasons,
    recommendedService,
    estimatedMonthlyDeliveries
  };
}
