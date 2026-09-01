import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Clock,
  Copy,
  Check,
  BookOpen,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Settings2,
  Info
} from 'lucide-react';
import { AppView } from '../types/navigation';
import { useOperationsLog } from '../hooks/useOperationsLog';
import { copyToClipboard } from '../utils/clipboard';
import { Logo } from '../components/branding/Logo';
import { useShift } from '../context/ShiftContext';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onToast }) => {
  const { activities } = useOperationsLog();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEdu, setShowEdu] = useState(false);
  const { shift } = useShift();

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      onToast?.('success', 'Copied', 'Message copied to clipboard.');
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hr ago';
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const recentActivities = activities.slice(0, 4);
  const mobileActivities = activities.slice(0, 2);

  const renderDesktop = () => (
    <div className="hidden md:block w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Educational Notice Badge */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 transition-colors">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <span className="font-semibold">Educational use only.</span> Caesar Cipher is a classical shift cipher and is intended for cryptography study and research.
        </div>
      </div>

      {/* Main Greeting & Call to Action with Logo */}
      <div className="text-center space-y-4 py-4 sm:py-6 flex flex-col items-center">
        <Logo size="2xl" variant="default" id="home-hero-logo" />

        <div className="space-y-1.5 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Secure Communication
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-medium">
            Caesar Cipher Educational Tool
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 pt-1">
            Encrypt and decrypt messages using interactive shift algorithms, vulnerability analysis, and frequency cryptanalysis.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full max-w-md mx-auto">
          <button
            type="button"
            id="home-btn-encrypt"
            onClick={() => onNavigate('encrypt')}
            className="w-full sm:w-auto flex-1 h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Encrypt Message</span>
          </button>

          <button
            type="button"
            id="home-btn-decrypt"
            onClick={() => onNavigate('decrypt')}
            className="w-full sm:w-auto flex-1 h-12 px-6 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium text-sm border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Decrypt Message</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Recent activity</span>
          </h2>
          {activities.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No recent activity
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your encrypted and decrypted messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => {
              const isEnc = act.type === 'ENCRYPT';
              const textToCopy = act.outputSnippet;
              const isCopied = copiedId === act.id;

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isEnc
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                       }`}
                    >
                      {isEnc ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {isEnc ? 'Encrypted message' : 'Decrypted message'}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                          Shift {act.shift}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                        {act.outputSnippet || act.inputSnippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-400">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(act.id, textToCopy)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Copy result"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Educational & Map Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('map')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Relay Station Map
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Explore global crypto nodes, transmission frequencies, &amp; routing paths.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 shrink-0 transition-colors" />
        </div>

        <div
          onClick={() => onNavigate('learn')}
          className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-900 border border-blue-100 dark:border-neutral-800 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-neutral-700 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                How does the Cipher work?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Explore shift diagrams, letter frequency, and security limits.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 shrink-0 transition-colors" />
        </div>
      </div>
    </div>
  );

  const getShiftedChar = (char: string, shiftVal: number) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(((code - 65 + shiftVal) % 26) + 65);
  };

  const renderMobile = () => (
    <div className="block md:hidden w-full px-4 pt-6 pb-24 space-y-6">
      
      {/* Security Status Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">Secure session</h2>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">Protection active</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Protected</span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('encrypt')}
          className="relative flex flex-col items-center p-5 rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)] active:scale-[0.98] transition-all cursor-pointer group overflow-hidden h-[250px]"
        >
          {/* Abstract background waves */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)' }} />
          
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mt-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] border border-white/10 z-10">
            <Lock className="w-7 h-7 text-white" />
          </div>
          
          <h3 className="text-[20px] font-bold leading-tight text-center mb-3 z-10">Encrypt<br/>Message</h3>
          <p className="text-[12px] text-blue-100 text-center leading-relaxed px-1 z-10">Convert your message<br/>into secure cipher text.</p>
          
          <div className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md z-10 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('decrypt')}
          className="relative flex flex-col items-center p-5 rounded-[24px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.2)] active:scale-[0.98] transition-all cursor-pointer group overflow-hidden h-[250px]"
        >
          {/* Abstract background waves */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)' }} />

          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mt-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] border border-white/10 z-10">
            <Unlock className="w-7 h-7 text-white" />
          </div>
          
          <h3 className="text-[20px] font-bold leading-tight text-center mb-3 z-10">Decrypt<br/>Message</h3>
          <p className="text-[12px] text-indigo-100 text-center leading-relaxed px-1 z-10">Decode your cipher text<br/>back to original message.</p>
          
          <div className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md z-10 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </div>
        </button>
      </div>

      {/* Active Cipher Card */}
      <div 
        onClick={() => onNavigate('settings')}
        className="bg-white dark:bg-neutral-900 rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] border border-neutral-100 dark:border-neutral-800 active:bg-neutral-50 dark:active:bg-neutral-800/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-medium text-neutral-500 dark:text-neutral-400">Current cipher</h2>
          <Settings2 className="w-4 h-4 text-neutral-400" />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100">Caesar Cipher</span>
          <span className="text-[13px] font-mono font-medium px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            Shift {shift}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[13px] font-mono text-neutral-600 dark:text-neutral-400 mb-4 overflow-hidden whitespace-nowrap">
          <span>A→{getShiftedChar('A', shift)}</span>
          <span>B→{getShiftedChar('B', shift)}</span>
          <span>C→{getShiftedChar('C', shift)}</span>
          <span>...</span>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <span className="text-[14px] font-medium text-blue-600 dark:text-blue-400">Change shift</span>
          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100">Recent activity</h2>
          {activities.length > 0 && (
             <button
               type="button"
               onClick={() => onNavigate('history')}
               className="text-[14px] font-medium text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
             >
               View all
             </button>
          )}
        </div>

        {mobileActivities.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-6 text-center border border-neutral-100 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Nothing here yet</p>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 mb-4">Encrypt your first message to see activity here.</p>
            <button
               type="button"
               onClick={() => onNavigate('encrypt')}
               className="text-[14px] font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 active:opacity-70"
            >
              Encrypt message <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
             {mobileActivities.map(act => {
               const isEnc = act.type === 'ENCRYPT';
               return (
                 <div
                   key={act.id}
                   onClick={() => onNavigate('history')}
                   className="bg-white dark:bg-neutral-900 rounded-[20px] p-4 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none border border-neutral-100 dark:border-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
                 >
                   <div className="flex items-center gap-3 min-w-0">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                       isEnc ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                     }`}>
                       {isEnc ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                     </div>
                     <div className="min-w-0">
                       <h3 className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                         {isEnc ? 'Encrypted message' : 'Decrypted message'}
                       </h3>
                       <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[12px] font-mono text-neutral-500 dark:text-neutral-400">Shift {act.shift}</span>
                         <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                         <span className="text-[12px] text-neutral-400 dark:text-neutral-500">{formatRelativeTime(act.timestamp)}</span>
                       </div>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-700 shrink-0" />
                 </div>
               );
             })}
          </div>
        )}
      </div>

      {/* Educational Notice */}
      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[20px] overflow-hidden border border-neutral-200/60 dark:border-neutral-800 transition-all">
        <button
          type="button"
          onClick={() => setShowEdu(!showEdu)}
          className="w-full p-4 flex items-center justify-between gap-3 active:bg-neutral-100 dark:active:bg-neutral-800/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            <span className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">Educational cipher</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-neutral-400 transition-transform ${showEdu ? 'rotate-90' : ''}`} />
        </button>
        {showEdu && (
          <div className="px-4 pb-4 pt-1 text-[14px] text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-200/50 dark:border-neutral-800">
            Caesar Cipher is intended for cryptography education and research. It should not be used to protect real sensitive information.
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="text-[14px] font-medium text-blue-600 dark:text-blue-400 active:opacity-70"
              >
                Learn more
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {renderDesktop()}
      {renderMobile()}
    </>
  );
};
