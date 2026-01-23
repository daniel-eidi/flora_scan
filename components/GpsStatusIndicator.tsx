import React from 'react';
import { GpsStatus } from '../types';

interface GpsStatusIndicatorProps {
  gpsStatus: GpsStatus;
}

const GpsStatusIndicator: React.FC<GpsStatusIndicatorProps> = ({ gpsStatus }) => {
  const getAccuracyLevel = (accuracy: number | null): { label: string; color: string; bgColor: string; bars: number } => {
    if (accuracy === null) {
      return { label: 'Sem GPS', color: 'text-gray-400', bgColor: 'bg-gray-400', bars: 0 };
    }
    if (accuracy <= 5) {
      return { label: 'Excelente', color: 'text-green-400', bgColor: 'bg-green-400', bars: 4 };
    }
    if (accuracy <= 10) {
      return { label: 'Ótimo', color: 'text-green-300', bgColor: 'bg-green-300', bars: 3 };
    }
    if (accuracy <= 20) {
      return { label: 'Bom', color: 'text-yellow-300', bgColor: 'bg-yellow-300', bars: 2 };
    }
    if (accuracy <= 50) {
      return { label: 'Regular', color: 'text-orange-400', bgColor: 'bg-orange-400', bars: 1 };
    }
    return { label: 'Fraco', color: 'text-red-400', bgColor: 'bg-red-400', bars: 1 };
  };

  const { label, color, bgColor, bars } = getAccuracyLevel(gpsStatus.accuracy);

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5">
      {/* Ícone de GPS */}
      <div className={`${color}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <circle cx="12" cy="12" r="8" strokeDasharray="4 2"/>
        </svg>
      </div>

      {/* Barras de sinal */}
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((barNum) => (
          <div
            key={barNum}
            className={`w-1 rounded-sm transition-all ${
              barNum <= bars ? bgColor : 'bg-white/20'
            }`}
            style={{ height: `${barNum * 4}px` }}
          />
        ))}
      </div>

      {/* Info de acurácia */}
      <div className="flex flex-col leading-none">
        <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
        {gpsStatus.accuracy !== null && (
          <span className="text-[9px] text-white/70">
            ±{gpsStatus.accuracy.toFixed(0)}m
          </span>
        )}
      </div>

      {/* Indicador de ativo */}
      {gpsStatus.isActive && (
        <div className={`w-1.5 h-1.5 rounded-full ${bgColor} animate-pulse`} />
      )}
    </div>
  );
};

export default GpsStatusIndicator;
