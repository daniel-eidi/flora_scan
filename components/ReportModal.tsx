
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ReportEntryData } from '../types';
import { FileText, X, MapPin, Printer, TreeDeciduous, Ruler, Activity, Edit3 } from 'lucide-react';

declare const L: any;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessages: Message[];
  onUpdateReportData?: (messageId: string, data: ReportEntryData) => void;
}

const estadoOptions: { value: ReportEntryData['estadoFitossanitario']; label: string; color: string }[] = [
  { value: 'bom', label: 'Bom', color: 'bg-green-100 text-green-800' },
  { value: 'regular', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ruim', label: 'Ruim', color: 'bg-orange-100 text-orange-800' },
  { value: 'morta', label: 'Morta', color: 'bg-red-100 text-red-800' },
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, selectedMessages, onUpdateReportData }) => {
  const [localReportData, setLocalReportData] = useState<Record<string, ReportEntryData>>({});
  const [showReport, setShowReport] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Initialize local report data from messages
  useEffect(() => {
    if (isOpen) {
      const initialData: Record<string, ReportEntryData> = {};
      selectedMessages.forEach(msg => {
        initialData[msg.id] = msg.reportData || {};
      });
      setLocalReportData(initialData);
      setShowReport(false);
    }
  }, [isOpen, selectedMessages]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!showReport || !mapRef.current || !isOpen) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const messagesWithLocation = selectedMessages.filter(msg => msg.location);
    if (messagesWithLocation.length === 0) return;

    // Calculate center
    const lats = messagesWithLocation.map(m => m.location!.latitude);
    const lngs = messagesWithLocation.map(m => m.location!.longitude);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Create map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add numbered markers
    messagesWithLocation.forEach((msg, idx) => {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: #065f46;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${idx + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([msg.location!.latitude, msg.location!.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <strong>${msg.plantData?.nomeComum || 'Planta'}</strong><br/>
          <em>${msg.plantData?.nomeCientifico || ''}</em><br/>
          <small>${msg.location!.latitude.toFixed(6)}, ${msg.location!.longitude.toFixed(6)}</small>
        `);
    });

    // Fit bounds if multiple markers
    if (messagesWithLocation.length > 1) {
      const bounds = L.latLngBounds(messagesWithLocation.map(m => [m.location!.latitude, m.location!.longitude]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showReport, selectedMessages, isOpen]);

  const handleFieldChange = useCallback((messageId: string, field: keyof ReportEntryData, value: any) => {
    setLocalReportData(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: value
      }
    }));
    if (onUpdateReportData) {
      onUpdateReportData(messageId, {
        ...localReportData[messageId],
        [field]: value
      });
    }
  }, [localReportData, onUpdateReportData]);

  const handlePrint = () => {
    window.print();
  };

  const getReportData = (msgId: string): ReportEntryData => {
    return localReportData[msgId] || {};
  };

  const getEstadoStyle = (estado?: ReportEntryData['estadoFitossanitario']) => {
    const opt = estadoOptions.find(o => o.value === estado);
    return opt?.color || 'bg-gray-100 text-gray-600';
  };

  // Statistics calculations
  const totalRegistros = selectedMessages.length;
  const especiesUnicas = new Set(selectedMessages.map(m => m.plantData?.nomeCientifico).filter(Boolean)).size;
  const acuraciaMedia = selectedMessages.length > 0
    ? Math.round(selectedMessages.reduce((acc, m) => acc + (m.plantData?.acuracia || 0), 0) / selectedMessages.length)
    : 0;
  const comLocalizacao = selectedMessages.filter(m => m.location).length;

  if (!isOpen) return null;

  // Editing mode - show form to edit DAP, altura, estado
  if (!showReport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-800 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Edit3 size={24} />
              <div>
                <h2 className="text-xl font-bold">Editar Dados do Laudo</h2>
                <p className="text-emerald-100 text-xs">Preencha os campos adicionais antes de gerar o relatório</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content - Editable Fields */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {selectedMessages.map((msg, idx) => (
                <div key={msg.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {msg.image && (
                      <img
                        src={msg.image}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        alt={msg.plantData?.nomeComum}
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-emerald-900 truncate">{msg.plantData?.nomeComum}</h4>
                        <span className="text-xs text-gray-500 italic truncate">{msg.plantData?.nomeCientifico}</span>
                      </div>

                      {/* Editable Fields */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* DAP */}
                        <div>
                          <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                            <TreeDeciduous size={12} />
                            DAP (cm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={getReportData(msg.id).dap || ''}
                            onChange={(e) => handleFieldChange(msg.id, 'dap', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Ex: 15.5"
                          />
                        </div>

                        {/* Altura */}
                        <div>
                          <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                            <Ruler size={12} />
                            Altura (m)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={getReportData(msg.id).altura || ''}
                            onChange={(e) => handleFieldChange(msg.id, 'altura', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Ex: 8.0"
                          />
                        </div>

                        {/* Estado Fitossanitário */}
                        <div>
                          <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                            <Activity size={12} />
                            Estado Fitossanitário
                          </label>
                          <select
                            value={getReportData(msg.id).estadoFitossanitario || ''}
                            onChange={(e) => handleFieldChange(msg.id, 'estadoFitossanitario', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Selecione...</option>
                            {estadoOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="px-8 py-3 bg-emerald-800 text-white rounded-full font-bold hover:bg-emerald-900 transition-shadow shadow-lg flex items-center gap-2"
            >
              <FileText size={18} />
              Gerar Laudo Técnico
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Report View - Full technical report
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden print:max-w-none print:max-h-none print:rounded-none print:shadow-none">
        {/* Header - No Print */}
        <div className="bg-emerald-800 text-white p-6 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h2 className="text-xl font-bold">Laudo Técnico de Levantamento de Flora</h2>
              <p className="text-emerald-100 text-xs">BioScan - Sistema de Identificação Botânica</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReport(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
            >
              Editar Dados
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Imprimir Laudo"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-6 print:overflow-visible">
          <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">

            {/* Document Header */}
            <header className="border-b-4 border-emerald-800 pb-6 text-center">
              <h1 className="text-3xl font-bold text-emerald-800 tracking-tight">LAUDO TÉCNICO DE LEVANTAMENTO DE FLORA</h1>
              <p className="text-gray-600 uppercase tracking-widest text-sm font-bold mt-2">BioScan - Sistema de Identificação Botânica</p>
              <p className="text-gray-500 text-sm mt-3">
                Data de Emissão: {new Date().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </header>

            {/* 01. Summary Statistics */}
            <section>
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center text-sm">01</span>
                Resumo Estatístico
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-800">{totalRegistros}</p>
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Total de Registros</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-800">{especiesUnicas}</p>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Espécies Únicas</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-800">{acuraciaMedia}%</p>
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Acurácia Média</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-800">{comLocalizacao}</p>
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Com Geolocalização</p>
                </div>
              </div>
            </section>

            {/* 02. Species Table */}
            <section className="print:break-inside-avoid">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center text-sm">02</span>
                Tabela de Espécies Identificadas
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-300">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-emerald-800 text-white">
                    <tr>
                      <th className="px-3 py-3 text-center w-10">#</th>
                      <th className="px-3 py-3">Nome Comum</th>
                      <th className="px-3 py-3">Nome Científico</th>
                      <th className="px-3 py-3 text-center">Coordenadas</th>
                      <th className="px-3 py-3 text-center">DAP (cm)</th>
                      <th className="px-3 py-3 text-center">Altura (m)</th>
                      <th className="px-3 py-3 text-center">Estado</th>
                      <th className="px-3 py-3 text-center">Acurácia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedMessages.map((msg, idx) => {
                      const reportData = getReportData(msg.id);
                      return (
                        <tr key={msg.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-3 text-center font-bold text-emerald-800">{idx + 1}</td>
                          <td className="px-3 py-3 font-semibold text-gray-900">{msg.plantData?.nomeComum || '-'}</td>
                          <td className="px-3 py-3 italic text-emerald-700">{msg.plantData?.nomeCientifico || '-'}</td>
                          <td className="px-3 py-3 font-mono text-xs text-center text-gray-600">
                            {msg.location
                              ? `${msg.location.latitude.toFixed(5)}, ${msg.location.longitude.toFixed(5)}`
                              : '-'}
                          </td>
                          <td className="px-3 py-3 text-center">{reportData.dap ?? '-'}</td>
                          <td className="px-3 py-3 text-center">{reportData.altura ?? '-'}</td>
                          <td className="px-3 py-3 text-center">
                            {reportData.estadoFitossanitario ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoStyle(reportData.estadoFitossanitario)}`}>
                                {estadoOptions.find(o => o.value === reportData.estadoFitossanitario)?.label}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-bold ${
                              (msg.plantData?.acuracia || 0) >= 80 ? 'text-green-600' :
                              (msg.plantData?.acuracia || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {msg.plantData?.acuracia ?? '-'}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-medium text-gray-700">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right">Totais / Médias:</td>
                      <td className="px-3 py-3 text-center">
                        {(() => {
                          const daps = selectedMessages.map(m => getReportData(m.id).dap).filter(d => d !== undefined) as number[];
                          return daps.length > 0 ? (daps.reduce((a, b) => a + b, 0) / daps.length).toFixed(1) : '-';
                        })()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {(() => {
                          const alturas = selectedMessages.map(m => getReportData(m.id).altura).filter(a => a !== undefined) as number[];
                          return alturas.length > 0 ? (alturas.reduce((a, b) => a + b, 0) / alturas.length).toFixed(1) : '-';
                        })()}
                      </td>
                      <td className="px-3 py-3 text-center">-</td>
                      <td className="px-3 py-3 text-center font-bold">{acuraciaMedia}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* 03. Location Map */}
            {comLocalizacao > 0 && (
              <section className="print:break-before-page">
                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center text-sm">03</span>
                  Mapa de Localização
                </h3>
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div
                    ref={mapRef}
                    className="h-80 w-full print:h-64"
                    style={{ minHeight: '320px' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Marcadores numerados correspondem aos registros na tabela acima.
                </p>
              </section>
            )}

            {/* 04. Photographic Records */}
            <section className="print:break-before-page">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center text-sm">04</span>
                Registros Fotográficos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3">
                {selectedMessages.map((msg, idx) => (
                  <div key={msg.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white print:break-inside-avoid">
                    {msg.image && (
                      <div className="relative">
                        <img
                          src={msg.image}
                          className="h-36 w-full object-cover print:h-28"
                          alt={msg.plantData?.nomeComum}
                        />
                        <span className="absolute top-2 left-2 w-6 h-6 bg-emerald-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    )}
                    <div className="p-3">
                      <h4 className="font-bold text-emerald-900 text-sm truncate">{msg.plantData?.nomeComum}</h4>
                      <p className="text-xs text-emerald-600 italic truncate">{msg.plantData?.nomeCientifico}</p>
                      {msg.location && (
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                          {msg.location.latitude.toFixed(5)}, {msg.location.longitude.toFixed(5)}
                        </p>
                      )}
                      <a
                        href={msg.location ? `https://www.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2 py-1 mt-2 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium hover:bg-emerald-100 transition-colors no-print ${!msg.location ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <MapPin size={10} />
                        Ver no Maps
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Signature Section */}
            <section className="print:break-inside-avoid mt-12 pt-8 border-t-2 border-gray-300">
              <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-800 text-white rounded-full flex items-center justify-center text-sm">05</span>
                Responsável Técnico
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Nome do Responsável:</label>
                  <div className="border-b-2 border-gray-400 h-8"></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Registro Profissional (CRBio/CREA):</label>
                  <div className="border-b-2 border-gray-400 h-8"></div>
                </div>
              </div>
              <div className="mt-8">
                <label className="block text-xs font-medium text-gray-600 mb-2">Assinatura:</label>
                <div className="border-b-2 border-gray-400 h-16"></div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Local e Data: _________________________________, _____ de _______________ de _______
                </p>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Documento gerado automaticamente pelo sistema BioScan - Identificação Botânica com Inteligência Artificial</p>
              <p className="mt-1">Este laudo tem caráter técnico-informativo e deve ser validado por profissional habilitado.</p>
            </footer>
          </div>
        </div>

        {/* Footer - No Print */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-center gap-4 no-print">
          <button
            onClick={() => setShowReport(false)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            Voltar para Edição
          </button>
          <button
            onClick={handlePrint}
            className="px-8 py-3 bg-emerald-800 text-white rounded-full font-bold hover:bg-emerald-900 transition-shadow shadow-lg flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir Laudo
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; }
          #root > div { height: auto !important; overflow: visible !important; }
          .leaflet-control-attribution { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportModal;
