import React, { useState } from 'react';
import {
  Radio,
  Shield,
  Send,
  Navigation,
  Key,
  Wifi,
  Lock,
  Layers,
  MapPin,
  ExternalLink,
  Check,
  Copy,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Server,
} from 'lucide-react';
import { AppView } from '../types/navigation';
import {
  RelayStationMap,
  DEFAULT_RELAY_STATIONS,
  RelayStation,
} from '../components/map/RelayStationMap';

interface MapPageProps {
  onNavigate: (view: AppView, params?: any) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onNavigate, onToast }) => {
  const [selectedStation, setSelectedStation] = useState<RelayStation>(DEFAULT_RELAY_STATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'RELAYING' | 'STANDBY'>('ALL');
  const [originStation, setOriginStation] = useState<RelayStation>(DEFAULT_RELAY_STATIONS[0]);
  const [destinationStation, setDestinationStation] = useState<RelayStation>(DEFAULT_RELAY_STATIONS[1]);

  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapsMapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  const filteredStations = DEFAULT_RELAY_STATIONS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTransmitToStation = (station: RelayStation) => {
    onToast?.(
      'info',
      'Relay Shift Selected',
      `Configured Caesar shift key (k=${station.activeShift}) for ${station.city} node.`
    );
    onNavigate('encrypt');
  };

  // Approximate Haversine distance for transmission telemetry display
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const routeDistance = calculateDistanceKm(
    originStation.lat,
    originStation.lng,
    destinationStation.lat,
    destinationStation.lng
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
              <span>Google Maps Platform</span>
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              {DEFAULT_RELAY_STATIONS.length} Secure Global Nodes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Relay Station Network
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Interactive geospatial map of cryptographic transmission hubs, frequency nodes, and regional Caesar cipher routing points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('encrypt')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypt with Active Shift</span>
          </button>
        </div>
      </div>

      {/* Main Google Map View */}
      <RelayStationMap
        apiKey={mapsApiKey}
        mapId={mapsMapId}
        selectedStation={selectedStation}
        onSelectStation={(st) => setSelectedStation(st)}
        onTransmitToStation={handleTransmitToStation}
      />

      {/* Grid: Station Detail & Route Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Station Card (1 Col) */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {selectedStation.code}
              </span>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mt-0.5">
                {selectedStation.name}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedStation.city}, {selectedStation.country}
              </p>
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                selectedStation.status === 'ONLINE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {selectedStation.status}
            </span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {selectedStation.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px]">COORDINATES</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                {selectedStation.lat.toFixed(4)}, {selectedStation.lng.toFixed(4)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px]">ACTIVE KEY SHIFT</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Shift k = {selectedStation.activeShift}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px]">FREQUENCY</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                {selectedStation.frequency}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px]">AVG LATENCY</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {selectedStation.latencyMs} ms
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleTransmitToStation(selectedStation)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Use Node Key (Shift {selectedStation.activeShift})</span>
            </button>
          </div>
        </div>

        {/* Transmission Route Simulator (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Encrypted Transmission Relay Route
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Zero-Plaintext Multi-Hop Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Origin Station
              </label>
              <select
                value={originStation.id}
                onChange={(e) => {
                  const st = DEFAULT_RELAY_STATIONS.find((s) => s.id === e.target.value);
                  if (st) setOriginStation(st);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEFAULT_RELAY_STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city} — {s.name} (k={s.activeShift})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Destination Station
              </label>
              <select
                value={destinationStation.id}
                onChange={(e) => {
                  const st = DEFAULT_RELAY_STATIONS.find((s) => s.id === e.target.value);
                  if (st) setDestinationStation(st);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEFAULT_RELAY_STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city} — {s.name} (k={s.activeShift})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Metric Summary */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {originStation.city} ({originStation.code})
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {destinationStation.city} ({destinationStation.code})
                </span>
              </div>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {routeDistance.toLocaleString()} km
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">ORIGIN SHIFT</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  k = {originStation.activeShift}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">EST. TIME OF FLIGHT</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.max(originStation.latencyMs, destinationStation.latencyMs)} ms
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">DESTINATION SHIFT</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  k = {destinationStation.activeShift}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station Filter & Directory List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Global Cryptographic Node Directory
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredStations.map((station) => (
            <button
              key={station.id}
              type="button"
              onClick={() => {
                setSelectedStation(station);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedStation.id === station.id
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                  : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {station.code}
                </span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  k = {station.activeShift}
                </span>
              </div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {station.city}, {station.country}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {station.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
