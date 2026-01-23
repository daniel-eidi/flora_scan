
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Location, IdentificationStatus, PlantData, ReportEntryData, GpsStatus } from './types';
import { identifyPlant } from './services/geminiService';
import ImageInput from './components/ImageInput';
import PlantIdentificationResult from './components/PlantIdentificationResult';
import ReportModal from './components/ReportModal';
import GpsStatusIndicator from './components/GpsStatusIndicator';
import { FileText } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Eu sou o BioScan. Envie uma foto de uma planta, árvore ou flor para que eu possa identificá-la para você. Vou te dizer o nome, a precisão e se preciso de mais detalhes.',
    }
  ]);
  const [status, setStatus] = useState<IdentificationStatus>(IdentificationStatus.IDLE);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>({
    accuracy: null,
    isActive: false,
    lastUpdate: null,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Monitorar GPS continuamente
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus({ accuracy: null, isActive: false, lastUpdate: null });
      return;
    }

    const handlePosition = (pos: GeolocationPosition) => {
      setGpsStatus({
        accuracy: pos.coords.accuracy,
        isActive: true,
        lastUpdate: pos.timestamp,
      });
    };

    const handleError = () => {
      setGpsStatus(prev => ({
        ...prev,
        isActive: false,
      }));
    };

    // Iniciar monitoramento contínuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getLocation = (): Promise<Location | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
            accuracy: pos.coords.accuracy,
          });
        },
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleImageSelected = async (base64Image: string) => {
    setStatus(IdentificationStatus.LOADING);
    
    // Captura localização no momento da imagem
    const currentLocation = await getLocation();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Analisando esta imagem...',
      image: base64Image,
      location: currentLocation,
      selectedForReport: true, // Auto-select for report by default
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await identifyPlant(base64Image);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.precisaMaisInfo 
          ? `Identifiquei como ${result.nomeComum}, mas para ter certeza absoluta, ${result.sugestao?.toLowerCase() || 'preciso de mais detalhes'}.` 
          : `Tudo pronto! Esta é uma ${result.nomeComum}.`,
        plantData: result,
        location: currentLocation,
        selectedForReport: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStatus(IdentificationStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ops! Ocorreu um erro ao processar a imagem. Por favor, tente novamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
      setStatus(IdentificationStatus.ERROR);
    }
  };

  const toggleMessageSelection = (id: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, selectedForReport: !m.selectedForReport } : m
    ));
  };

  const handleUpdateReportData = useCallback((messageId: string, data: ReportEntryData) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reportData: { ...m.reportData, ...data } } : m
    ));
  }, []);

  const selectedForReport = messages.filter(m => m.role === 'assistant' && m.plantData && m.selectedForReport);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 shadow-md z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">BioScan AI</h1>
              <p className="text-emerald-100 text-xs">Seu guia botânico portátil</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GpsStatusIndicator gpsStatus={gpsStatus} />

            {selectedForReport.length > 0 && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white text-emerald-800 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
              >
                <FileText size={16} />
                <span>Relatório ({selectedForReport.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.image && (
                <div className="mb-3 overflow-hidden rounded-lg border-2 border-white/20 shadow-inner">
                  <img src={msg.image} alt="Upload de planta" className="w-full h-48 object-cover" />
                </div>
              )}
              
              <p className="text-sm font-medium">{msg.content}</p>

              {msg.plantData && (
                <PlantIdentificationResult 
                  data={msg.plantData} 
                  location={msg.location}
                  isSelected={msg.selectedForReport}
                  onToggleSelect={() => toggleMessageSelection(msg.id)}
                />
              )}
            </div>
            
            {msg.location && msg.role === 'user' && (
              <span className="text-[10px] text-gray-400 mt-1 mr-2 italic">
                Localização: {msg.location.latitude.toFixed(4)}, {msg.location.longitude.toFixed(4)}
              </span>
            )}
          </div>
        ))}

        {status === IdentificationStatus.LOADING && (
          <div className="flex items-center gap-3 text-emerald-700 bg-white/80 backdrop-blur-sm p-4 rounded-2xl w-fit shadow-sm border border-emerald-100">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm font-semibold italic">Consultando base botânica...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ImageInput 
        onImageSelected={handleImageSelected} 
        disabled={status === IdentificationStatus.LOADING} 
      />
      
      <div className="bg-white px-4 pb-4 text-center">
        <p className="text-[10px] text-gray-400">
          BioScan utiliza Inteligência Artificial avançada. Verifique as informações para fins críticos.
        </p>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        selectedMessages={selectedForReport}
        onUpdateReportData={handleUpdateReportData}
      />
    </div>
  );
};

export default App;
