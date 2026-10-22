import React, { useState, useEffect } from 'react';
import { SchoolSettings, SchoolEvent } from '../types/guestbook';
import { api, DashboardStats, ServerTime } from '../services/api';
import {
  BookOpen,
  Clock,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  Users,
  LogOut,
  QrCode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface HomeHeroProps {
  settings: SchoolSettings;
  onOpenForm: (eventId?: string) => void;
  onOpenCheckout: () => void;
  onOpenEventList: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  settings,
  onOpenForm,
  onOpenCheckout,
  onOpenEventList,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => {
    api.getServerTime().then(setServerTime);
    api.getStats().then(setStats).catch(() => {});
    api.getEvents().then((evs) => {
      setEvents(evs.filter((e) => e.status === 'active'));
    }).catch(() => {});

    // Live clock update
    const interval = setInterval(() => {
      const now = new Date();
      setServerTime({
        dateStr: now.toISOString().split('T')[0],
        timeStr: new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now),
        isoStr: now.toISOString(),
        fullDateId: new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          dateStyle: 'full',
        }).format(now),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Hero Header Banner */}
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        {/* Campus Background Image with Subtle Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/nature_school_campus_hero_1792660507842.jpg"
            alt="Kampus SMP Alam Excellentia Pamekasan"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-emerald-950/60" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="flex flex-col items-center text-center">
            
            {/* School Crest Logo */}
            <div className="mb-6 p-1.5 bg-white rounded-full shadow-lg border-2 border-emerald-400/40">
              <img
                src={settings.logo_url || '/assets/aistudio/1713909500616_5b14171f.png'}
                alt="Logo SMP Alam Excellentia Pamekasan"
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/1713909500616_5b14171f.png';
                }}
              />
            </div>

            {/* School Title & Identity */}
            <span className="text-emerald-300 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">
              Sistem Buku Tamu Digital Resmi
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight max-w-3xl leading-tight">
              {settings.name}
            </h1>
            <p className="mt-2 text-emerald-200/90 text-sm sm:text-base font-normal max-w-2xl">
              {settings.tagline}
            </p>

            {/* Live Clock & Date Badge (Server Time Asia/Jakarta) */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-mono text-emerald-100 bg-emerald-900/80 border border-emerald-700/60 rounded-xl px-5 py-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-sans font-medium">{serverTime?.fullDateId || 'Memuat tanggal...'}</span>
              </div>
              <span className="text-emerald-500 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-base">{serverTime?.timeStr || '--:--'} WIB</span>
              </div>
            </div>

            {/* Sambutan Resmi Sesuai Ketentuan */}
            <div className="mt-8 max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 text-stone-100 shadow-md">
              <p className="font-heading font-semibold text-lg text-emerald-100">
                “Selamat Datang di SMP Alam Excellentia Pamekasan”
              </p>
              <p className="mt-2 text-stone-200 text-sm leading-relaxed">
                “Silakan mengisi buku tamu digital sebelum memulai kunjungan. Terima kasih atas kunjungan Anda.”
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => onOpenForm()}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-heading font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-98"
              >
                <BookOpen className="w-5 h-5" />
                <span>ISI BUKU TAMU</span>
              </button>

              <button
                onClick={onOpenCheckout}
                className="w-full sm:w-auto px-6 py-4 bg-white/15 hover:bg-white/25 text-white font-medium text-sm sm:text-base rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-emerald-300" />
                <span>Catat Jam Keluar (Check-Out)</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Metrics Bar (Tabular Figures) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Tamu Hari Ini</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">
                {stats?.totalToday ?? 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Sedang Berkunjung</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                {stats?.activeNow ?? 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Kunjungan Bulan Ini</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">
                {stats?.totalMonth ?? 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-medium block">Total Tahun Ini</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">
                {stats?.totalYear ?? 0}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Special Event Guestbook Highlight */}
      {events.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-emerald-900 text-white rounded-2xl overflow-hidden shadow-sm border border-emerald-800 grid grid-cols-1 lg:grid-cols-12">
            
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Buku Tamu Khusus Kegiatan Aktif</span>
                </div>
                <h3 className="font-heading font-bold text-2xl text-white mt-2 leading-tight">
                  {events[0].title}
                </h3>
                <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
                  {events[0].description}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>{events[0].date} ({events[0].time_start} - {events[0].time_end} WIB)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{events[0].location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenForm(events[0].id)}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Isi Kehadiran Acara Ini</span>
                </button>

                <button
                  onClick={onOpenEventList}
                  className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 text-sm rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Lihat Seluruh Kegiatan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Event photo thumbnail */}
            <div className="lg:col-span-4 relative min-h-[180px] bg-emerald-950">
              <img
                src="/src/assets/images/school_nature_gathering_1792660508800.jpg"
                alt="Kegiatan Sekolah Alam"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent flex items-end p-4">
                <span className="text-xs text-emerald-200 font-medium">
                  {events[0].organizer_pic}
                </span>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Informative Nature School Visitor Guidelines & Location */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-stone-900 mb-1.5">
              Tata Tertib Tamu Sekolah Alam
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Demi kenyamanan dan ketertiban proses pembelajaran alamiah siswa, seluruh tamu diimbau mematuhi etika berbusana sopan, menjaga keasrian taman, dan tidak merokok di seluruh lingkungan sekolah.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-stone-900 mb-1.5">
              Jam Layanan & Jam Keluar
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pelayanan tamu dibuka Senin - Sabtu pukul 07.30 - 15.00 WIB. Setiap tamu diharapkan melakukan konfirmasi check-out sebelum meninggalkan area sekolah untuk kelengkapan administrasi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-stone-900 mb-1.5">
              Lokasi & Kontak Sekolah
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {settings.address}, {settings.district}, {settings.regency}. Hubungi WhatsApp: {settings.phone} atau email {settings.email}.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
        <div>
          <span className="font-medium text-stone-700">{settings.name}</span> — NPSN: {settings.npsn}
        </div>
        <div>
          © 2026 Buku Tamu Digital Sekolah Alam. Dilindungi Undang-Undang.
        </div>
      </footer>
    </div>
  );
};
