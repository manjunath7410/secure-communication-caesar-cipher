import React, { useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Radio,
  Shield,
  Send,
  Navigation,
  RefreshCw,
  Key,
  Wifi,
  Lock,
  Layers,
  MapPin,
  ExternalLink,
  Check,
  Copy,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TacticalVectorMap } from './TacticalVectorMap';

export interface RelayStation {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'STANDBY' | 'RELAYING' | 'MAINTENANCE';
  clearanceLevel: 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  activeShift: number;
  frequency: string;
  latencyMs: number;
  description: string;
}

export const DEFAULT_RELAY_STATIONS: RelayStation[] = [
  {
    id: 'station-gva-01',
    name: 'Geneva Primary Cryptographic Relay',
    code: 'GVA-SEC-01',
    city: 'Geneva',
    country: 'Switzerland',
    lat: 46.2044,
    lng: 6.1432,
    status: 'ONLINE',
    clearanceLevel: 'TOP_SECRET',
    activeShift: 3,
    frequency: '433.920 MHz',
    latencyMs: 12,
    description: 'Central European cryptographic neutral zone node for multi-hop ciphertext relays.',
  },
  {
    id: 'station-tyo-02',
    name: 'Tokyo Quantum Telemetry Station',
    code: 'TYO-NOD-02',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    status: 'ONLINE',
    clearanceLevel: 'TOP_SECRET',
    activeShift: 13,
    frequency: '868.100 MHz',
    latencyMs: 48,
    description: 'Asia-Pacific primary secure transmission hub with integrated ROT13 cryptographic buffer.',
  },
  {
    id: 'station-was-03',
    name: 'Washington Defense Communications Hub',
    code: 'WAS-COM-03',
    city: 'Washington, D.C.',
    country: 'United States',
    lat: 38.9072,
    lng: -77.0369,
    status: 'RELAYING',
    clearanceLevel: 'TOP_SECRET',
    activeShift: 7,
    frequency: '915.000 MHz',
    latencyMs: 24,
    description: 'Atlantic defense gateway with high-throughput encrypted ciphertext dispatch.',
  },
  {
    id: 'station-lon-04',
    name: 'London Bletchley Heritage Terminal',
    code: 'LON-BLE-04',
    city: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    status: 'ONLINE',
    clearanceLevel: 'SECRET',
    activeShift: 5,
    frequency: '434.075 MHz',
    latencyMs: 18,
    description: 'Historical cryptanalytic command center monitoring European regional node integrity.',
  },
  {
    id: 'station-sin-05',
    name: 'Singapore Equator Secure Node',
    code: 'SIN-EQT-05',
    city: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    status: 'ONLINE',
    clearanceLevel: 'SECRET',
    activeShift: 17,
    frequency: '923.200 MHz',
    latencyMs: 62,
    description: 'Maritime communications relay bridging Southeast Asian encrypted channels.',
  },
  {
    id: 'station-syd-06',
    name: 'Sydney Southern Cross Terminal',
    code: 'SYD-SXC-06',
    city: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    status: 'STANDBY',
    clearanceLevel: 'CONFIDENTIAL',
    activeShift: 9,
    frequency: '916.800 MHz',
    latencyMs: 110,
    description: 'Pacific rim monitoring outpost for deep-ocean communication links.',
  },
  {
    id: 'station-ber-07',
    name: 'Berlin Cryptographic Gateway',
    code: 'BER-CRY-07',
    city: 'Berlin',
    country: 'Germany',
    lat: 52.5200,
    lng: 13.4050,
    status: 'ONLINE',
    clearanceLevel: 'SECRET',
    activeShift: 21,
    frequency: '868.300 MHz',
    latencyMs: 15,
    description: 'Central transmission router for continental tactical message validation.',
  },
  {
    id: 'station-sao-08',
    name: 'São Paulo Southern Hub',
    code: 'SAO-STH-08',
    city: 'São Paulo',
    country: 'Brazil',
    lat: -23.5505,
    lng: -46.6333,
    status: 'ONLINE',
    clearanceLevel: 'CONFIDENTIAL',
    activeShift: 4,
    frequency: '902.500 MHz',
    latencyMs: 85,
    description: 'South American telemetry relay and zero-knowledge message store.',
  },
];

interface RelayStationMapProps {
  apiKey?: string;
  mapId?: string;
  selectedStation: RelayStation | null;
  onSelectStation: (station: RelayStation) => void;
  onTransmitToStation?: (station: RelayStation) => void;
}

// Subcomponent to trigger smooth camera re-centering
function MapCameraController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();

  React.useEffect(() => {
    if (map && target) {
      map.panTo(target);
      map.setZoom(Math.max(map.getZoom() || 3, 5));
    }
  }, [map, target]);

  return null;
}

export const RelayStationMap: React.FC<RelayStationMapProps> = ({
  apiKey = '',
  mapId,
  selectedStation,
  onSelectStation,
  onTransmitToStation,
}) => {
  const hasValidGoogleKey = typeof apiKey === 'string' && apiKey.trim().length > 15 && !apiKey.includes('PLACEHOLDER');
  const [mapMode, setMapMode] = useState<'tactical' | 'google'>(hasValidGoogleKey ? 'google' : 'tactical');
  const [hasLoadError, setHasLoadError] = useState(false);
  const { resolvedTheme } = useTheme();
  const [activeStationInfo, setActiveStationInfo] = useState<RelayStation | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const defaultCenter = useMemo(() => ({ lat: 25.0, lng: 15.0 }), []);

  const handleMarkerClick = useCallback(
    (station: RelayStation) => {
      onSelectStation(station);
      setActiveStationInfo(station);
    },
    [onSelectStation]
  );

  const handleCopyCoordinates = (station: RelayStation) => {
    const coordStr = `${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`;
    navigator.clipboard.writeText(coordStr);
    setCopiedCoords(station.id);
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  const getPinColors = (status: RelayStation['status'], clearance: RelayStation['clearanceLevel']) => {
    if (status === 'MAINTENANCE') {
      return { background: '#EF4444', glyphColor: '#FFFFFF', borderColor: '#B91C1C' };
    }
    if (status === 'RELAYING') {
      return { background: '#F59E0B', glyphColor: '#FFFFFF', borderColor: '#D97706' };
    }
    if (clearance === 'TOP_SECRET') {
      return { background: '#2563EB', glyphColor: '#FFFFFF', borderColor: '#1D4ED8' };
    }
    if (clearance === 'SECRET') {
      return { background: '#059669', glyphColor: '#FFFFFF', borderColor: '#047857' };
    }
    return { background: '#64748B', glyphColor: '#FFFFFF', borderColor: '#475569' };
  };

  // If tactical radar mode is active, or if no valid API key exists, or if Google Maps failed to load
  if (mapMode === 'tactical' || !hasValidGoogleKey || hasLoadError) {
    return (
      <div className="space-y-2">
        <TacticalVectorMap
          stations={DEFAULT_RELAY_STATIONS}
          selectedStation={selectedStation}
          onSelectStation={onSelectStation}
          onTransmitToStation={onTransmitToStation}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Military Tactical Vector Radar • {DEFAULT_RELAY_STATIONS.length} Active Cryptographic Nodes</span>
          </span>
          {hasValidGoogleKey && !hasLoadError && (
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Switch to Google Maps Satellite View</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs bg-neutral-100 dark:bg-neutral-900">
      <APIProvider
        apiKey={apiKey}
        onError={() => setHasLoadError(true)}
      >
        <Map
          id="secure-relay-main-map"
          defaultCenter={defaultCenter}
          defaultZoom={2.5}
          minZoom={2}
          maxZoom={18}
          mapId={mapId || undefined}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={false}
          colorScheme={resolvedTheme === 'dark' ? 'DARK' : 'LIGHT'}
          className="w-full h-full"
        >
          <MapCameraController
            target={selectedStation ? { lat: selectedStation.lat, lng: selectedStation.lng } : null}
          />

          {/* Render all cryptographic relay station markers */}
          {DEFAULT_RELAY_STATIONS.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const pinColors = getPinColors(station.status, station.clearanceLevel);

            return (
              <AdvancedMarker
                key={station.id}
                position={{ lat: station.lat, lng: station.lng }}
                title={`${station.name} (${station.code})`}
                onClick={() => handleMarkerClick(station)}
                zIndex={isSelected ? 100 : 10}
              >
                <Pin
                  background={isSelected ? '#3B82F6' : pinColors.background}
                  glyphColor={pinColors.glyphColor}
                  borderColor={isSelected ? '#1E40AF' : pinColors.borderColor}
                  scale={isSelected ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* Detailed InfoWindow on Marker Selection */}
          {activeStationInfo && (
            <InfoWindow
              position={{ lat: activeStationInfo.lat, lng: activeStationInfo.lng }}
              onCloseClick={() => setActiveStationInfo(null)}
              headerContent={
                <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-900">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeStationInfo.code}</span>
                  <span className="text-neutral-400 font-normal">| {activeStationInfo.city}</span>
                </div>
              }
            >
              <div className="p-1 max-w-xs text-xs space-y-2 text-neutral-800">
                <div className="font-medium text-sm leading-tight text-neutral-900">
                  {activeStationInfo.name}
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {activeStationInfo.description}
                </p>

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono bg-neutral-50 p-2 rounded-lg border border-neutral-200/80">
                  <div>
                    <span className="text-neutral-500 block">KEY SHIFT</span>
                    <span className="font-semibold text-blue-700">k = {activeStationInfo.activeShift}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">FREQUENCY</span>
                    <span className="font-semibold text-neutral-800">{activeStationInfo.frequency}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">LATENCY</span>
                    <span className="font-semibold text-emerald-700">{activeStationInfo.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">STATUS</span>
                    <span className="font-semibold text-neutral-800">{activeStationInfo.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyCoordinates(activeStationInfo)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-[11px] font-medium text-neutral-700 transition-colors cursor-pointer"
                  >
                    {copiedCoords === activeStationInfo.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span>Coordinates</span>
                      </>
                    )}
                  </button>

                  {onTransmitToStation && (
                    <button
                      type="button"
                      onClick={() => onTransmitToStation(activeStationInfo)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-[11px] font-medium text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Use Shift ({activeStationInfo.activeShift})</span>
                    </button>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Controls & Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span>{DEFAULT_RELAY_STATIONS.length} Active Cryptographic Relays</span>
        </div>

        {/* Map Type Selector */}
        <div className="inline-flex rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-0.5 shadow-sm text-xs">
          {(['roadmap', 'hybrid', 'terrain'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMapType(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                mapType === type
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMapMode('tactical')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 text-white hover:bg-neutral-800 text-[11px] font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Tactical Radar View</span>
        </button>
      </div>
    </div>
  );
};
