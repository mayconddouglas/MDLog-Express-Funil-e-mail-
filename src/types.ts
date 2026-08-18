export type SegmentType =
  | 'Loja Física'
  | 'E-commerce'
  | 'Farmácia'
  | 'Restaurante'
  | 'Autopeças'
  | 'Distribuidora'
  | 'Escritório'
  | 'Outro';

export type FrequencyType =
  | 'Todos os dias'
  | '2 a 3 vezes por semana'
  | 'Semanalmente'
  | 'Esporadicamente'
  | 'Ainda estou pesquisando';

export type DailyVolumeType =
  | '1–5'
  | '6–10'
  | '11–20'
  | 'Mais de 20'
  | 'Ainda não sei';

export interface LeadQualification {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  levelLabel: string;
  score: number; // 0 - 100
  badgeColor: string;
  reasons: string[];
  recommendedService: string;
  estimatedMonthlyDeliveries: string;
  aiInsights?: string;
}

export interface LeadData {
  id: string;
  companyName: string;
  segment: SegmentType | string;
  location: string;
  frequency: FrequencyType | string;
  dailyVolume: DailyVolumeType | string;
  contactName: string;
  contactWhatsApp: string;
  contactEmail?: string;
  createdAt: string;
  qualification: LeadQualification;
}

export interface FormState {
  companyName: string;
  segment: string;
  location: string;
  frequency: string;
  dailyVolume: string;
  contactName: string;
  contactWhatsApp: string;
  contactEmail: string;
}
