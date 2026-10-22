import React, { useState, useEffect } from 'react';
import { User } from '../types/guestbook';
import { api, ServerTime } from '../services/api';
import { Leaf, Clock, Calendar, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeView: 'home' | 'form' | 'checkout' | 'events' | 'admin';
  setActiveView: (view: 'home' | 'form' | 'checkout' | 'events' | 'admin') => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenCheckoutModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  onOpenCheckoutModal,
}) => {
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);

  useEffect(() => {
    // Fetch initial time
    api.getServerTime().then(setServerTime);

    // Live clock interval (updates minute display)
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const fullDateId = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
      }).format(now);

      setServerTime({
        dateStr,
        timeStr,
        isoStr: now.toISOString(),
        fullDateId,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 sm:gap-8">
          
          {/* Zone 1: Brand wordmark (single element, clean display) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 p-0.5 flex items-center justify-center shadow-xs group-hover:border-emerald-500 transition-colors shrink-0 overflow-hidden">
                <img
                  src="/assets/aistudio/1713909500616_5b14171f.png"
                  alt="Logo SMP Alam Excellentia"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg text-emerald-950 tracking-tight leading-tight whitespace-nowrap">
                  SMP Alam Excellentia
                </span>
                <span className="text-xs font-medium text-emerald-700 tracking-wide uppercase">
                  Buku Tamu Digital
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single line, uncluttered) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveView('home')}
              className={`hover:text-emerald-900 transition-colors whitespace-nowrap pb-1 ${
                activeView === 'home'
                  ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                  : ''
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => setActiveView('form')}
              className={`hover:text-emerald-900 transition-colors whitespace-nowrap pb-1 ${
                activeView === 'form'
                  ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                  : ''
              }`}
            >
              Isi Buku Tamu
            </button>

            <button
              onClick={onOpenCheckoutModal}
              className="hover:text-emerald-900 transition-colors whitespace-nowrap pb-1 flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Catat Jam Keluar</span>
            </button>

            <button
              onClick={() => setActiveView('events')}
              className={`hover:text-emerald-900 transition-colors whitespace-nowrap pb-1 ${
                activeView === 'events'
                  ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                  : ''
              }`}
            >
              Kegiatan Sekolah
            </button>
          </nav>

          {/* Zone 3: Live Clock & Primary CTA / Admin Entry */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Server Time (WIB) */}
            <div className="hidden lg:flex items-center gap-3 py-1.5 px-3 bg-stone-100/90 rounded-lg text-xs font-mono tabular-nums text-stone-700 border border-stone-200/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-medium">{serverTime?.dateStr || '...'}</span>
              </div>
              <span className="text-stone-300">|</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold text-emerald-950">{serverTime?.timeStr || '...'} WIB</span>
              </div>
            </div>

            {/* Admin or Staff Portal Access */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('admin')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeView === 'admin'
                      ? 'bg-emerald-900 text-white'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'kepsek' ? 'Kepsek' : 'Petugas'}</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveView('admin')}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Portal Petugas</span>
              </button>
            )}

            {/* Quick Fill Button */}
            {activeView !== 'form' && (
              <button
                onClick={() => setActiveView('form')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                Isi Buku Tamu
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
