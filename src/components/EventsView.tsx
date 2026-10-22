import React, { useState, useEffect } from 'react';
import { SchoolEvent, SchoolSettings } from '../types/guestbook';
import { api } from '../services/api';
import QRCode from 'qrcode';
import {
  CalendarDays,
  Building2,
  User as UserIcon,
  Clock,
  ArrowRight,
  BookOpen,
  QrCode,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface EventsViewProps {
  settings: SchoolSettings;
  onSelectEvent: (eventId: string) => void;
  onBack: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  settings,
  onSelectEvent,
  onBack,
}) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrEvent, setSelectedQrEvent] = useState<SchoolEvent | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    api.getEvents()
      .then((evs) => setEvents(evs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedQrEvent) {
      const url = `${window.location.origin}/?event=${selectedQrEvent.id}`;
      QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: '#064e3b', light: '#ffffff' } })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [selectedQrEvent]);

  return (
    <div className="min-h-screen bg-nature-pattern py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-950 hover:text-emerald-800 bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-8 text-center max-w-3xl mx-auto">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-800 mb-3">
            <CalendarDays className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest block">
            Buku Tamu Khusus Kegiatan
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 mt-1">
            Kegiatan Resmi SMP Alam Excellentia
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
            Hadir pada acara sekolah seperti pertemuan orang tua, seminar parenting, studi banding, atau open house? Silakan pilih kegiatan di bawah untuk mengisi daftar hadir digital khusus.
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-sm">
            Memuat daftar kegiatan sekolah...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 max-w-lg mx-auto">
            <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-medium text-stone-700">Belum ada kegiatan khusus yang sedang aktif.</p>
            <p className="text-xs text-stone-500 mt-1">
              Untuk kunjungan umum sehari-hari, Anda dapat langsung menggunakan formulir Buku Tamu Reguler.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev: any) => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                      ev.status === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {ev.status === 'active' ? 'Sedang Dibuka' : 'Selesai'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-950">
                      {ev.attendee_count ?? 0} Tamu Hadir
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-stone-900 group-hover:text-emerald-900 transition-colors leading-snug">
                    {ev.title}
                  </h3>

                  <p className="mt-2 text-xs text-stone-600 leading-relaxed line-clamp-3">
                    {ev.description || 'Kegiatan resmi SMP Alam Excellentia Pamekasan.'}
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-stone-600 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{ev.date} ({ev.time_start} - {ev.time_end} WIB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Penanggung Jawab: {ev.organizer_pic}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedQrEvent(ev)}
                    className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-stone-200/60 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Tampilkan QR Code Kegiatan"
                  >
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => onSelectEvent(ev.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Isi Buku Tamu Acara</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* QR Code Modal */}
      {selectedQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Scan QR Code Acara
              </span>
              <h3 className="font-heading font-bold text-base text-stone-900 mt-1">
                {selectedQrEvent.title}
              </h3>
            </div>

            {qrUrl && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block shadow-inner">
                <img src={qrUrl} alt="QR Code Acara" className="w-48 h-48 mx-auto object-contain" />
              </div>
            )}

            <p className="text-xs text-stone-500">
              Arahkan kamera smartphone ke kode QR di atas untuk membuka formulir presensi tamu kegiatan ini.
            </p>

            <button
              onClick={() => setSelectedQrEvent(null)}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
