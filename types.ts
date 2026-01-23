
export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface ReportEntryData {
  dap?: number;           // Diâmetro à Altura do Peito (cm)
  altura?: number;        // Altura estimada (m)
  estadoFitossanitario?: 'bom' | 'regular' | 'ruim' | 'morta';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  location?: Location;
  plantData?: PlantData;
  selectedForReport?: boolean;
  reportData?: ReportEntryData;
}

export interface PlantData {
  nomeComum: string;
  nomeCientifico: string;
  acuracia: number;
  precisaMaisInfo: boolean;
  sugestao?: string;
  descricao: string;
}

export enum IdentificationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}
