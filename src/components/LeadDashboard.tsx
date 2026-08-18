import React, { useState } from 'react';
import { LeadData } from '../types';
import {
  X,
  Trash2,
  Download,
  MessageSquare,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  Truck,
  Phone,
  Mail,
  Search,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface LeadDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  leads: LeadData[];
  onDeleteLead: (id: string) => void;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({
  isOpen,
  onClose,
  leads,
  onDeleteLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(leads[0] || null);

  if (!isOpen) return null;

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterLevel === 'ALL' || lead.qualification.level === filterLevel;

    return matchesSearch && matchesFilter;
  });

  const exportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      'ID',
      'Data',
      'Empresa',
      'Segmento',
      'Localizacao',
      'Frequencia',
      'Volume Diario',
      'Nivel Qualificacao',
      'Pontuacao',
      'Contato Nome',
      'WhatsApp',
      'Email',
    ];

    const rows = leads.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleString('pt-BR'),
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.segment}"`,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${l.frequency}"`,
      `"${l.dailyVolume}"`,
      `"${l.qualification.levelLabel}"`,
      l.qualification.score,
      `"${l.contactName}"`,
      `"${l.contactWhatsApp}"`,
      `"${l.contactEmail || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_mdlogexpress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createWhatsAppLink = (lead: LeadData) => {
    const cleanPhone = lead.contactWhatsApp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${lead.contactName}, tudo bem? Sou da equipe comercial da MDLogExpress! Recebi sua solicitação referente à empresa *${lead.companyName}* (${lead.segment}). Vi que você precisa de soluções logísticas para ${lead.frequency} com volume médio de ${lead.dailyVolume} entregas/dia. Como podemos te ajudar?`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-950 border border-neutral-800 rounded-[5px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div>
            <h2 className="font-headline font-bold text-lg text-white flex items-center gap-2">
              <span>Painel de Qualificação de Leads</span>
              <span className="text-xs bg-neutral-900 border border-neutral-800 font-mono text-neutral-400 px-2 py-0.5 rounded-[3px]">
                {leads.length} cadastradas
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gestão comercial e inteligência de prospecção MDLogExpress
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-medium rounded-[5px] transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-[5px] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-neutral-900/50 border-b border-neutral-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por empresa, segmento, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-3 py-1 rounded-[5px] border cursor-pointer transition-colors ${
                filterLevel === 'ALL'
                  ? 'bg-white text-black font-semibold border-white'
                  : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Todos ({leads.length})
            </button>
            <button
              onClick={() => setFilterLevel('HIGH')}
              className={`px-3 py-1 rounded-[5px] border cursor-pointer transition-colors ${
                filterLevel === 'HIGH'
                  ? 'bg-emerald-500 text-black font-semibold border-emerald-400'
                  : 'bg-black text-emerald-400 border-emerald-950 hover:border-emerald-800'
              }`}
            >
              Alto Potencial ({leads.filter((l) => l.qualification.level === 'HIGH').length})
            </button>
            <button
              onClick={() => setFilterLevel('MEDIUM')}
              className={`px-3 py-1 rounded-[5px] border cursor-pointer transition-colors ${
                filterLevel === 'MEDIUM'
                  ? 'bg-amber-500 text-black font-semibold border-amber-400'
                  : 'bg-black text-amber-400 border-amber-950 hover:border-amber-800'
              }`}
            >
              Médio ({leads.filter((l) => l.qualification.level === 'MEDIUM').length})
            </button>
            <button
              onClick={() => setFilterLevel('LOW')}
              className={`px-3 py-1 rounded-[5px] border cursor-pointer transition-colors ${
                filterLevel === 'LOW'
                  ? 'bg-neutral-300 text-black font-semibold border-neutral-200'
                  : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Inicial ({leads.filter((l) => l.qualification.level === 'LOW').length})
            </button>
          </div>
        </div>

        {/* Main Content split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
          {/* List panel */}
          <div className="md:col-span-5 border-r border-neutral-800 overflow-y-auto divide-y divide-neutral-900 bg-black">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                Nenhum lead encontrado com estes filtros.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-neutral-900 border-l-2 border-l-white'
                        : 'hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm text-white truncate max-w-[200px]">
                        {lead.companyName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] border ${lead.qualification.badgeColor}`}
                      >
                        Score {lead.qualification.score}
                      </span>
                    </div>

                    <div className="mt-1.5 text-xs text-neutral-400 flex items-center space-x-2">
                      <span className="text-white">{lead.segment}</span>
                      <span>•</span>
                      <span className="truncate">{lead.location}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Vol: {lead.dailyVolume}/dia</span>
                      <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details panel */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-neutral-950 flex flex-col justify-between">
            {selectedLead ? (
              <div>
                <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                      Ficha de Qualificação do Lead
                    </span>
                    <h3 className="font-headline font-bold text-xl text-white mt-1">
                      {selectedLead.companyName}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                      {selectedLead.segment} • <MapPin className="w-3.5 h-3.5 text-neutral-500 inline" /> {selectedLead.location}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onDeleteLead(selectedLead.id);
                      setSelectedLead(null);
                    }}
                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-[5px] transition-colors cursor-pointer"
                    title="Excluir este lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Qualification Card */}
                <div className="my-5 p-4 rounded-[5px] border border-neutral-800 bg-neutral-900/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-[3px] border ${selectedLead.qualification.badgeColor}`}
                      >
                        {selectedLead.qualification.levelLabel}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      Pontuação: <strong className="text-white">{selectedLead.qualification.score}/100</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <p>
                      <strong className="text-neutral-400">Serviço Recomendado:</strong>{' '}
                      <span className="text-white font-medium">{selectedLead.qualification.recommendedService}</span>
                    </p>
                    <p>
                      <strong className="text-neutral-400">Projeção Mensal:</strong>{' '}
                      <span className="text-white">{selectedLead.qualification.estimatedMonthlyDeliveries}</span>
                    </p>
                  </div>

                  {/* Reasons */}
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <span className="text-[11px] text-neutral-500 font-medium block mb-1.5">
                      Fatores de Qualificação:
                    </span>
                    <ul className="space-y-1">
                      {selectedLead.qualification.reasons.map((r, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Executive Insights */}
                  {selectedLead.qualification.aiInsights && (
                    <div className="mt-3 pt-3 border-t border-neutral-800 bg-black/40 p-3 rounded-[3px] border border-neutral-800/80">
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3" /> Análise de IA MDLogExpress
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed italic">
                        "{selectedLead.qualification.aiInsights}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Operations & Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-[5px]">
                    <span className="text-neutral-500 font-medium block mb-2">Dados da Operação</span>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Frequência: <strong>{selectedLead.frequency}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <Truck className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Volume Diário: <strong>{selectedLead.dailyVolume}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-[5px]">
                    <span className="text-neutral-500 font-medium block mb-2">Contato do Responsável</span>
                    <div className="space-y-2">
                      <div className="text-white font-medium">{selectedLead.contactName}</div>
                      <div className="flex items-center space-x-2 text-neutral-300">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{selectedLead.contactWhatsApp}</span>
                      </div>
                      {selectedLead.contactEmail && (
                        <div className="flex items-center space-x-2 text-neutral-300 truncate">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="truncate">{selectedLead.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Cadastrado em {new Date(selectedLead.createdAt).toLocaleString('pt-BR')}
                  </span>

                  <a
                    href={createWhatsAppLink(selectedLead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-[5px] transition-colors shadow-lg cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-black" />
                    <span>Iniciar Atendimento no WhatsApp</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 py-12">
                <Building2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Selecione um lead da lista para visualizar os detalhes completos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
