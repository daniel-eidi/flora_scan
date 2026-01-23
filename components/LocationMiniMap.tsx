
import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types';

declare const L: any;

interface LocationMiniMapProps {
  location: Location;
  height?: string;
}

const LocationMiniMap: React.FC<LocationMiniMapProps> = ({ location, height = '120px' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === 'undefined') return;

    // Limpar mapa anterior se existir
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Criar novo mapa
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: isExpanded,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: isExpanded,
    }).setView([location.latitude, location.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Marcador customizado
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #065f46;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([location.latitude, location.longitude], { icon: markerIcon }).addTo(map);

    mapRef.current = map;

    // Atualizar tamanho do mapa quando expandir/contrair
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location.latitude, location.longitude, isExpanded]);

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200 bg-white shadow-sm">
      {/* Header com coordenadas */}
      <div className="bg-emerald-50 px-3 py-2 flex items-center justify-between border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Localização Capturada</p>
            <p className="text-xs font-mono text-emerald-800 font-medium">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggleExpand}
            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
            title={isExpanded ? "Minimizar" : "Expandir"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              )}
            </svg>
          </button>
          <button
            onClick={handleOpenGoogleMaps}
            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
            title="Abrir no Google Maps"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div
        ref={mapContainerRef}
        style={{ height: isExpanded ? '200px' : height }}
        className="w-full transition-all duration-300 cursor-pointer"
        onClick={!isExpanded ? toggleExpand : undefined}
      />

      {/* Footer com timestamp */}
      <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-100">
        <p className="text-[9px] text-gray-500 text-center">
          Capturado em {new Date(location.timestamp).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
};

export default LocationMiniMap;
