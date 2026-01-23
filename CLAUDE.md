# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BioScan is a plant identification web app built with React and TypeScript. Users upload or capture photos of plants, and the app uses Google's Gemini AI to identify them, returning the common name, scientific name, accuracy score, and botanical description in Portuguese.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` to your Google Gemini API key.

## Architecture

**Entry Point**: `index.tsx` renders `App.tsx` which manages all application state.

**Core Flow**:
1. User uploads image via `ImageInput` component (camera or gallery)
2. `App.tsx` captures geolocation and calls `identifyPlant()` from `geminiService`
3. Gemini AI returns structured JSON with plant data
4. Results displayed in chat-style UI using `PlantIdentificationResult`
5. Users can select identifications for a printable `ReportModal`

**Key Files**:
- `services/geminiService.ts` - Gemini AI integration with structured JSON response schema
- `types.ts` - TypeScript interfaces (`Message`, `PlantData`, `Location`, `IdentificationStatus`)
- `components/ImageInput.tsx` - Camera/gallery image capture with base64 encoding
- `components/PlantIdentificationResult.tsx` - Plant data display with accuracy coloring
- `components/ReportModal.tsx` - Printable botanical field report with Google Maps links

**API Response Schema** (from Gemini):
```typescript
{
  nomeComum: string;        // Common name in Portuguese
  nomeCientifico: string;   // Scientific name
  acuracia: number;         // Confidence 0-100
  precisaMaisInfo: boolean; // Needs more photos
  sugestao?: string;        // Suggestion for better photo
  descricao: string;        // Botanical description
}
```

## Tech Stack

- React 19 with TypeScript
- Vite for bundling
- `@google/genai` for Gemini AI
- `lucide-react` for icons
- Tailwind CSS (via CDN, not configured in build)

## Path Alias

`@/*` maps to project root (configured in `vite.config.ts` and `tsconfig.json`).
