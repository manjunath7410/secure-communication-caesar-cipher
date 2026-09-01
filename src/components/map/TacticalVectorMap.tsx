import React, { useState } from 'react';
import {
  Shield,
  Send,
  Radio,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { RelayStation } from './RelayStationMap';

interface TacticalVectorMapProps {
  stations: RelayStation[];
  selectedStation: RelayStation | null;
  onSelectStation: (station: RelayStation) => void;
  onTransmitToStation?: (station: RelayStation) => void;
}

export const TacticalVectorMap: React.FC<TacticalVectorMapProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  onTransmitToStation,
}) => {
  const [hoveredStation, setHoveredStation] = useState<RelayStation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [radarSweep, setRadarSweep] = useState(true);

  // Converts Latitude / Longitude to SVG projection coordinate percentage (Equirectangular)
  const projectCoordinates = (lat: number, lng: number) => {
    // x: -180 to 180 -> 0% to 100%
    const x = ((lng + 180) / 360) * 100;
    // y: 90 to -90 -> 0% to 100%
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const handleCopy = (station: RelayStation) => {
    navigator.clipboard.writeText(`${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`);
    setCopiedId(station.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeStation = selectedStation || hoveredStation || stations[0];

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[#0c1322] text-neutral-100 shadow-sm select-none">
      {/* Background World Map Grids & Coordinates */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.08)" strokeWidth="0.75" />
          </pattern>
          <linearGradient id="relay-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Tactical Grid Background */}
        <rect width="100%" height="100%" fill="url(#tactical-grid)" />

        {/* Global Lat/Lng Reference Lines */}
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(59, 130, 246, 0.2)" strokeDasharray="4,4" strokeWidth="1" />
        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(59, 130, 246, 0.2)" strokeDasharray="4,4" strokeWidth="1" />
        <line x1="0%" y1="37%" x2="100%" y2="37%" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5" />
        <line x1="0%" y1="63%" x2="100%" y2="63%" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5" />

        {/* Continents Simplified Geospatial Silhouettes */}
        <g fill="rgba(30, 58, 138, 0.22)" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="0.75">
          {/* North America */}
          <path d="M 18% 18% Q 25% 15% 32% 20% L 35% 32% Q 28% 40% 24% 46% L 21% 42% Q 14% 35% 16% 25% Z" />
          {/* South America */}
          <path d="M 28% 52% Q 36% 56% 34% 70% L 30% 84% Q 26% 80% 25% 65% Z" />
          {/* Europe */}
          <path d="M 46% 20% Q 54% 18% 58% 26% L 54% 36% Q 48% 38% 46% 28% Z" />
          {/* Africa */}
          <path d="M 46% 40% Q 56% 40% 58% 54% L 54% 72% Q 48% 74% 44% 56% Z" />
          {/* Asia */}
          <path d="M 60% 18% Q 82% 20% 86% 36% L 78% 52% Q 66% 54% 58% 34% Z" />
          {/* Australia */}
          <path d="M 80% 68% Q 90% 68% 88% 80% L 82% 82% Q 78% 76% 80% 68% Z" />
        </g>

        {/* Cryptographic Transmission Mesh Lines Between Connected Stations */}
        {stations.map((st1, idx) => {
          const next = stations[(idx + 1) % stations.length];
          const p1 = projectCoordinates(st1.lat, st1.lng);
          const p2 = projectCoordinates(next.lat, next.lng);
          return (
            <line
              key={`mesh-${st1.id}-${next.id}`}
              x1={`${p1.x}%`}
              y1={`${p1.y}%`}
              x2={`${p2.x}%`}
              y2={`${p2.y}%`}
              stroke="url(#relay-line-grad)"
              strokeWidth="1.25"
              strokeDasharray="3,3"
              className="opacity-40 animate-pulse"
            />
          );
        })}

        {/* Active Node Pulse Rings and Beacon Points */}
        {stations.map((station) => {
          const pos = projectCoordinates(station.lat, station.lng);
          const isSelected = selectedStation?.id === station.id;
          const isHovered = hoveredStation?.id === station.id;

          const color =
            station.clearanceLevel === 'TOP_SECRET'
              ? '#3B82F6'
              : station.clearanceLevel === 'SECRET'
              ? '#10B981'
              : '#64748B';

          return (
            <g
              key={`node-${station.id}`}
              className="cursor-pointer transition-transform"
              onClick={() => onSelectStation(station)}
              onMouseEnter={() => setHoveredStation(station)}
              onMouseLeave={() => setHoveredStation(null)}
            >
              {/* Outer Pulsing Beacon */}
              {(isSelected || isHovered) && (
                <circle
                  cx={`${pos.x}%`}
                  cy={`${pos.y}%`}
                  r="18"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Target Aim Reticle when selected */}
              {isSelected && (
                <circle
                  cx={`${pos.x}%`}
                  cy={`${pos.y}%`}
                  r="12"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}

              {/* Core Node Circle */}
              <circle
                cx={`${pos.x}%`}
                cy={`${pos.y}%`}
                r={isSelected ? 6 : 4.5}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={isSelected ? 2 : 1.25}
                className="drop-shadow-md"
              />

              {/* Node City Label */}
              <text
                x={`${pos.x}%`}
                y={`${pos.y - 3}%`}
                textAnchor="middle"
                fill={isSelected ? '#93C5FD' : '#E2E8F0'}
                fontSize="11"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontWeight={isSelected ? '700' : '500'}
                className="pointer-events-none drop-shadow-sm"
              >
                {station.city} (k={station.activeShift})
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Top Telemetry Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/85 backdrop-blur-md border border-neutral-700/80 text-xs font-medium text-neutral-200 shadow-md">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Tactical Cryptographic Grid ({stations.length} Active Nodes)</span>
          </div>

          <button
            type="button"
            onClick={() => setRadarSweep(!radarSweep)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-colors cursor-pointer ${
              radarSweep
                ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                : 'bg-neutral-900/70 border-neutral-700 text-neutral-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Radar Sweep</span>
          </button>
        </div>

        <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-700/60 text-neutral-400">
          SYS STATUS: <span className="text-emerald-400 font-semibold">ALL RELAYS ONLINE</span>
        </div>
      </div>

      {/* Floating Station Inspector Panel */}
      {activeStation && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-10 pointer-events-auto">
          <div className="p-4 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-neutral-700/90 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-400">
                  <Shield className="w-3 h-3" />
                  <span>{activeStation.code}</span>
                  <span className="text-neutral-500">|</span>
                  <span className="text-emerald-400">{activeStation.status}</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-100 mt-0.5">
                  {activeStation.name}
                </h3>
                <p className="text-xs text-neutral-400">
                  {activeStation.city}, {activeStation.country}
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 shrink-0">
                Shift k = {activeStation.activeShift}
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-2">
              {activeStation.description}
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-neutral-950/70 p-2 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">COORDINATES</span>
                <span className="text-neutral-200 font-medium">
                  {activeStation.lat.toFixed(2)}°, {activeStation.lng.toFixed(2)}°
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">FREQUENCY</span>
                <span className="text-neutral-200 font-medium">{activeStation.frequency}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">LATENCY</span>
                <span className="text-emerald-400 font-medium">{activeStation.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-neutral-500 block">CLEARANCE</span>
                <span className="text-blue-300 font-medium">{activeStation.clearanceLevel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(activeStation)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedId === activeStation.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-400" />
                    <span>Coords</span>
                  </>
                )}
              </button>

              {onTransmitToStation && (
                <button
                  type="button"
                  onClick={() => onTransmitToStation(activeStation)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Use Key (k={activeStation.activeShift})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
