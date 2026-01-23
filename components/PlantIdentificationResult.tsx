
import React from 'react';
import { PlantData, Location } from '../types';
import LocationMiniMap from './LocationMiniMap';

interface PlantIdentificationResultProps {
  data: PlantData;
  location?: Location;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const PlantIdentificationResult: React.FC<PlantIdentificationResultProps> = ({ 
  data, 
  location, 
  isSelected, 
  onToggleSelect 
}) => {
  const getAccuracyColor = (acc: number) => {
    if (acc > 80) return 'text-green-600';
    if (acc > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mt-2 space-y-3">
      <div className={`bg-emerald-50 p-4 rounded-xl border transition-all ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-100'} shadow-sm`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-emerald-900">{data.nomeComum}</h3>
            <p className="text-emerald-700 italic text-sm">{data.nomeCientifico}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className={`text-lg font-bold ${getAccuracyColor(data.acuracia)}`}>
              {data.acuracia}%
            </span>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Acurácia</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {data.descricao}
        </p>

        {data.precisaMaisInfo && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-3 mb-2 rounded-r">
            <p className="text-xs font-bold text-amber-800 uppercase mb-1">Atenção: Mais fotos necessárias</p>
            <p className="text-sm text-amber-900">{data.sugestao}</p>
          </div>
        )}

        {/* Botão de seleção para relatório */}
        <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-end">
          {onToggleSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isSelected
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {isSelected ? '✓ No Relatório' : '+ Relatório'}
            </button>
          )}
        </div>
      </div>

      {/* Mini-mapa com localização */}
      {location && (
        <LocationMiniMap location={location} />
      )}
    </div>
  );
};

export default PlantIdentificationResult;
