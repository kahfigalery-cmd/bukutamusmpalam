import React, { useState, useEffect, useRef } from 'react';
import {
  GUEST_CATEGORIES,
  VISIT_PURPOSES,
  PERSON_TO_MEET_OPTIONS,
  SchoolEvent,
  SchoolSettings,
  Visit,
} from '../types/guestbook';
import { api, ServerTime } from '../services/api';
import {
  BookOpen,
  User,
  Building2,
  Phone,
  Tag,
  HelpCircle,
  Users2,
  Calendar,
  Clock,
  FileText,
  FileCheck,
  Check,
  RotateCcw,
  AlertCircle,
  ArrowLeft,
  PenTool,
} from 'lucide-react';

interface VisitorFormProps {
  settings: SchoolSettings;
  selectedEventId?: string | null;
  onSuccess: (visit: Visit) => void;
  onCancel: () => void;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({
  settings,
  selectedEventId,
  onSuccess,
  onCancel,
}) => {
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<string>(GUEST_CATEGORIES[0]);
  const [purpose, setPurpose] = useState<string>(VISIT_PURPOSES[0]);
  const [purposeDetail, setPurposeDetail] = useState('');
  const [personToMeet, setPersonToMeet] = useState<string>(PERSON_TO_MEET_OPTIONS[0]);
  const [identityNumber, setIdentityNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [eventId, setEventId] = useState<string>(selectedEventId || '');
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Signature Pad Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    api.getServerTime().then(setServerTime);
    api.getEvents().then((evs) => setEvents(evs.filter((e) => e.status === 'active')));
  }, []);

  // Update canvas size and settings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 130;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!guestName.trim()) {
      setErrorMessage('Nama lengkap tamu wajib diisi.');
      return;
    }
    if (!institution.trim()) {
      setErrorMessage('Asal instansi atau organisasi wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Nomor telepon/WhatsApp wajib diisi.');
      return;
    }
    if (purpose === 'Keperluan lainnya' && !purposeDetail.trim()) {
      setErrorMessage('Mohon jelaskan keperluan kunjungan Anda pada kolom keterangan.');
      return;
    }
    if (!consentAgreed) {
      setErrorMessage('Anda harus mencentang persetujuan data kunjungan sebelum mengirim formulir.');
      return;
    }

    setIsSubmitting(true);
    try {
      let signatureDataUrl: string | null = null;
      if (hasSignature && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      const result = await api.createVisit({
        guest_name: guestName,
        institution,
        phone,
        category,
        purpose,
        purpose_detail: purpose === 'Keperluan lainnya' ? purposeDetail : purposeDetail || undefined,
        person_to_meet: personToMeet,
        identity_number: identityNumber || undefined,
        notes: notes || undefined,
        signature: signatureDataUrl,
        event_id: eventId || null,
      });

      onSuccess(result.visit);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan data kunjungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-pattern py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={onCancel}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-900 hover:text-emerald-700 bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-stone-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl shadow-md border border-stone-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-emerald-900 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-300 border border-white/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider">
                  Formulir Kunjungan Tamu
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-white leading-tight">
                  {settings.name}
                </h2>
              </div>
            </div>

            {/* Server Timestamp Bar */}
            <div className="mt-4 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between text-xs text-emerald-200 gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal: <strong className="text-white font-mono">{serverTime?.dateStr || '...'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jam Masuk Otomatis: <strong className="text-white font-mono">{serverTime?.timeStr || '...'} WIB</strong></span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Event Selector (if multiple events active) */}
            {events.length > 0 && (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80">
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wide mb-1.5">
                  Kunjungan Terkait Kegiatan Khusus (Opsional)
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">-- Kunjungan Reguler / Bukan Kegiatan Tertentu --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section 1: Data Pengunjung */}
            <div className="space-y-4">
              <h3 className="text-sm font-heading font-bold text-stone-900 border-b border-stone-200 pb-2">
                Identitas Pengunjung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Lengkap Tamu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Drs. H. Ahmad Munir, M.Pd"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                    />
                  </div>
                </div>

                {/* 2. Asal Instansi / Organisasi */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Asal Instansi / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Dinas Pendidikan / Wali Murid Kelas 7"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                    />
                  </div>
                </div>

                {/* 3. Nomor Telepon / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nomor WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* 4. Kategori Tamu */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kategori Tamu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm bg-white"
                    >
                      {GUEST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tujuan Kunjungan & Bagian yang Ditemui */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-heading font-bold text-stone-900 border-b border-stone-200 pb-2">
                Keperluan & Pihak yang Ditemui
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. Tujuan Kunjungan */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tujuan Kunjungan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HelpCircle className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm bg-white"
                    >
                      {VISIT_PURPOSES.map((purp) => (
                        <option key={purp} value={purp}>
                          {purp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Orang atau Bagian yang Ingin Ditemui */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Orang / Bagian yang Ingin Ditemui <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <select
                      value={personToMeet}
                      onChange={(e) => setPersonToMeet(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm bg-white"
                    >
                      {PERSON_TO_MEET_OPTIONS.map((person) => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Penjelasan Tujuan jika "Keperluan lainnya" */}
                {purpose === 'Keperluan lainnya' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-900 mb-1">
                      Jelaskan Keperluan Kunjungan Singkat <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jelaskan secara singkat urusan atau keperluan Anda"
                      value={purposeDetail}
                      onChange={(e) => setPurposeDetail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                    />
                  </div>
                )}

                {/* Kolom Opsional: Nomor Identitas atau Nomor Surat Tugas */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    No. Identitas / No. Surat Tugas <span className="text-stone-400 font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <FileCheck className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="No. KTP/SIM atau No. Surat Tugas jika ada"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                    />
                  </div>
                </div>

                {/* Kolom Opsional: Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Catatan Tambahan <span className="text-stone-400 font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Contoh: Sudah janjian sebelumnya / berkas titipan"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Signature Pad (Touch-friendly & Clean) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tanda Tangan Digital Pengunjung (Opsional)</span>
                </label>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus / Ulangi</span>
                  </button>
                )}
              </div>
              <div className="border border-stone-300 rounded-2xl p-2 bg-stone-50/50 hover:border-emerald-400 transition-colors">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-28 bg-white rounded-xl touch-none cursor-crosshair border border-dashed border-stone-200"
                />
                <p className="text-[11px] text-stone-400 text-center mt-1">
                  Goreskan tanda tangan Anda dengan jari atau mouse di atas bidang putih.
                </p>
              </div>
            </div>

            {/* Checkbox Persetujuan Sesuai Ketentuan Prompt */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs text-stone-700 leading-relaxed">
                  “Saya menyatakan bahwa data yang saya isi benar dan bersedia data kunjungan ini digunakan untuk keperluan administrasi SMP Alam Excellentia Pamekasan sesuai kebijakan privasi sekolah.”
                </span>
              </label>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-sm font-medium transition-colors"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-heading font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>KIRIM & SIMPAN KUNJUNGAN</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
