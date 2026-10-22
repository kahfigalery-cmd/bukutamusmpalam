import React, { useEffect, useState } from 'react';
import { Visit, SchoolSettings } from '../types/guestbook';
import QRCode from 'qrcode';
import {
  CheckCircle,
  Printer,
  Home,
  UserPlus,
  Clock,
  Calendar,
  Building2,
  User,
  HelpCircle,
  Share2,
} from 'lucide-react';

interface VisitConfirmationModalProps {
  visit: Visit;
  settings: SchoolSettings;
  onClose: () => void;
  onNewVisit: () => void;
}

export const VisitConfirmationModal: React.FC<VisitConfirmationModalProps> = ({
  visit,
  settings,
  onClose,
  onNewVisit,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(visit.visit_number, {
      width: 180,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR', err));
  }, [visit.visit_number]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Printable Pass Container */}
        <div id="printable-visitor-pass" className="p-6 sm:p-8">
          
          {/* Success Icon & Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800 mb-3 shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>

            <span className="text-xs font-semibold text-emerald-700 tracking-wider uppercase">
              Kunjungan Berhasil Dicatat
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-stone-900 mt-1">
              {settings.name}
            </h2>

            {/* Official Confirmation Greeting */}
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-stone-800 text-sm leading-relaxed text-center">
              <p className="font-semibold text-emerald-900">
                “Terima kasih telah berkunjung ke SMP Alam Excellentia Pamekasan. Data kunjungan Anda berhasil dicatat. Semoga urusan Anda berjalan dengan lancar.”
              </p>
            </div>
          </div>

          {/* Digital Visitor Badge Card */}
          <div className="mt-6 border border-stone-200 rounded-2xl p-5 bg-stone-50/60 shadow-xs">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="text-center sm:text-left">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Nomor Kunjungan Unik
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-900 tracking-tight block">
                  {visit.visit_number}
                </span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-xs text-amber-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Status: Masih Berkunjung
                </span>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-xs shrink-0 text-center">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${visit.visit_number}`}
                    className="w-24 h-24 object-contain mx-auto"
                  />
                  <span className="text-[10px] font-mono text-stone-500 block mt-0.5">
                    Scan saat Check-Out
                  </span>
                </div>
              )}
            </div>

            {/* Summary Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 text-stone-700">
                <User className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-stone-400 block">Nama Tamu</span>
                  <span className="font-semibold text-stone-900">{visit.guest_name}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-stone-700">
                <Building2 className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-stone-400 block">Asal Instansi</span>
                  <span className="font-semibold text-stone-900">{visit.institution}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-stone-700">
                <Calendar className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-stone-400 block">Tanggal Kunjungan</span>
                  <span className="font-mono font-semibold text-stone-900">{visit.date}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-stone-400 block">Jam Masuk (Server WIB)</span>
                  <span className="font-mono font-semibold text-emerald-900">{visit.check_in_time} WIB</span>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-2 text-stone-700 pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-stone-400 block">Tujuan & Pihak yang Ditemui</span>
                  <span className="font-medium text-stone-900">
                    {visit.purpose} — Bertemu: <strong className="font-semibold text-emerald-950">{visit.person_to_meet}</strong>
                    {visit.purpose_detail ? ` (${visit.purpose_detail})` : ''}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <p className="mt-4 text-[11px] text-stone-500 text-center leading-relaxed">
            Harap simpan nomor kunjungan Anda. Jangan lupa melapor ke meja resepsionis untuk mencatat jam keluar saat kunjungan telah selesai.
          </p>

        </div>

        {/* Action Buttons (Excluded from print) */}
        <div className="no-print bg-stone-100 p-4 sm:p-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-800" />
            <span>Cetak Kartu Kunjungan</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onNewVisit}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Isi Tamu Lainnya</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-heading font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Halaman Utama</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
