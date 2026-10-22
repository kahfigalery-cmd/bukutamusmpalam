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
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    guestName?: string;
    institution?: string;
    phone?: string;
    purposeDetail?: string;
    customPersonToMeet?: string;
    customCategory?: string;
    consent?: string;
  }>({});

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<string>(GUEST_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [purpose, setPurpose] = useState<string>(VISIT_PURPOSES[0]);
  const [purposeDetail, setPurposeDetail] = useState('');
  const [personToMeet, setPersonToMeet] = useState<string>(PERSON_TO_MEET_OPTIONS[0]);
  const [customPersonToMeet, setCustomPersonToMeet] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [eventId, setEventId] = useState<string>(selectedEventId || '');
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Signature Pad Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.getServerTime().then(setServerTime);
    api.getEvents().then((evs) => setEvents(evs.filter((e) => e.status === 'active')));
  }, []);

  // Update canvas size and settings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const getCanvasPos = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);

    ctx.lineTo(pos.x, pos.y);
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
    setGeneralError(null);
    const errors: typeof fieldErrors = {};

    // 1. Nama Lengkap Tamu
    if (!guestName.trim()) {
      errors.guestName = 'Nama lengkap tamu wajib diisi.';
    }

    // 2. Asal Instansi / Organisasi
    if (!institution.trim()) {
      errors.institution = 'Asal instansi atau organisasi tamu wajib diisi.';
    }

    // 3. Nomor Telepon / WhatsApp
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!phone.trim()) {
      errors.phone = 'Nomor telepon/WhatsApp wajib diisi.';
    } else if (cleanPhone.length < 8) {
      errors.phone = 'Nomor telepon minimal 8 digit angka.';
    }

    // 4. Kategori Lainnya jika dipilih
    if (category === 'Lainnya' && !customCategory.trim()) {
      errors.customCategory = 'Mohon sebutkan kategori Anda.';
    }

    // 5. Penjelasan Keperluan jika Keperluan Lainnya
    if (purpose === 'Keperluan lainnya' && !purposeDetail.trim()) {
      errors.purposeDetail = 'Mohon jelaskan secara singkat keperluan kunjungan Anda.';
    }

    // 6. Pihak yang ditemui Lainnya jika dipilih
    if (personToMeet === 'Lainnya' && !customPersonToMeet.trim()) {
      errors.customPersonToMeet = 'Mohon sebutkan nama atau bagian yang ingin Anda temui.';
    }

    // 7. Persetujuan
    if (!consentAgreed) {
      errors.consent = 'Anda harus menyetujui pernyataan penggunaan data kunjungan untuk keperluan administrasi sekolah.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('Mohon lengkapi dan periksa kembali data pada formulir yang ditandai merah di bawah ini.');
      // Scroll to top of form smoothly so visitor sees the issues
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setIsSubmitting(true);
    try {
      let signatureDataUrl: string | null = null;
      if (hasSignature && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      const finalCategory = category === 'Lainnya' ? (customCategory.trim() || 'Lainnya') : category;
      const finalPersonToMeet = personToMeet === 'Lainnya' ? (customPersonToMeet.trim() || 'Lainnya') : personToMeet;

      const result = await api.createVisit({
        guest_name: guestName.trim(),
        institution: institution.trim(),
        phone: phone.trim(),
        category: finalCategory,
        purpose,
        purpose_detail: purposeDetail.trim() || undefined,
        person_to_meet: finalPersonToMeet,
        identity_number: identityNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        signature: signatureDataUrl,
        event_id: eventId || null,
      });

      // Notify and trigger success confirmation pass
      onSuccess(result.visit);
    } catch (err: any) {
      console.error('Failed to create visit:', err);
      setGeneralError(err.message || 'Terjadi gangguan saat menyimpan data. Silakan coba lagi.');
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={formTopRef} className="min-h-screen bg-nature-pattern py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button
          type="button"
          onClick={onCancel}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-950 hover:text-emerald-800 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-stone-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          <span>Kembali ke Beranda</span>
        </button>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl shadow-md border border-stone-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-emerald-950 text-white p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs border border-white/20 overflow-hidden">
                <img
                  src={settings.logo_url || '/assets/aistudio/1713909500616_5b14171f.png'}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] uppercase font-semibold text-emerald-300 tracking-widest block">
                  Buku Tamu Digital Resmi
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-tight">
                  {settings.name}
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Formulir Pencatatan Kehadiran Tamu & Pengunjung Sekolah Alam
                </p>
              </div>
            </div>

            {/* Server Timestamp Bar */}
            <div className="mt-5 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between text-xs text-emerald-200 gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal: <strong className="text-white font-mono">{serverTime?.dateStr || '...'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Waktu Kedatangan Otomatis: <strong className="text-white font-mono font-bold">{serverTime?.timeStr || '...'} WIB</strong></span>
              </div>
            </div>
          </div>

          {/* Form Fields with noValidate to prevent native browser bubbles */}
          <form noValidate onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Top Error Alert Banner */}
            {generalError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Periksa Kelengkapan Data:</strong>
                  <p>{generalError}</p>
                </div>
              </div>
            )}

            {/* Event Selector (if active events exist) */}
            {events.length > 0 && (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80">
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wide mb-1.5">
                  Kunjungan Terkait Kegiatan Khusus (Opsional)
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
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

            {/* Section 1: Identitas Pengunjung */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-sm font-heading font-bold text-stone-900">
                  1. Identitas Pengunjung
                </h3>
                <span className="text-[11px] text-stone-500">
                  <span className="text-red-500 font-bold">*</span> Wajib diisi
                </span>
              </div>

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
                      placeholder="Contoh: Drs. H. Ahmad Munir, M.Pd"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (fieldErrors.guestName) {
                          setFieldErrors({ ...fieldErrors, guestName: undefined });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        fieldErrors.guestName
                          ? 'border-red-400 bg-red-50/20 focus:ring-red-200'
                          : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                      }`}
                    />
                  </div>
                  {fieldErrors.guestName && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.guestName}</span>
                    </p>
                  )}
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
                      placeholder="Contoh: Dinas Pendidikan / Wali Murid Kelas 7"
                      value={institution}
                      onChange={(e) => {
                        setInstitution(e.target.value);
                        if (fieldErrors.institution) {
                          setFieldErrors({ ...fieldErrors, institution: undefined });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        fieldErrors.institution
                          ? 'border-red-400 bg-red-50/20 focus:ring-red-200'
                          : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                      }`}
                    />
                  </div>
                  {fieldErrors.institution && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.institution}</span>
                    </p>
                  )}
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
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) {
                          setFieldErrors({ ...fieldErrors, phone: undefined });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono transition-colors ${
                        fieldErrors.phone
                          ? 'border-red-400 bg-red-50/20 focus:ring-red-200'
                          : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
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

                  {category === 'Lainnya' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Sebutkan kategori Anda..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border ${
                          fieldErrors.customCategory ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                        }`}
                      />
                      {fieldErrors.customCategory && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.customCategory}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Keperluan & Pihak yang Ditemui */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-sm font-heading font-bold text-stone-900">
                  2. Keperluan Kunjungan & Pihak yang Ditemui
                </h3>
              </div>

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

                  {personToMeet === 'Lainnya' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Sebutkan nama atau bagian yang ingin ditemui..."
                        value={customPersonToMeet}
                        onChange={(e) => setCustomPersonToMeet(e.target.value)}
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border ${
                          fieldErrors.customPersonToMeet ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                        }`}
                      />
                      {fieldErrors.customPersonToMeet && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.customPersonToMeet}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Penjelasan Tujuan jika "Keperluan lainnya" */}
                {purpose === 'Keperluan lainnya' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">
                      Jelaskan Keperluan Kunjungan Singkat <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Jelaskan secara singkat urusan atau keperluan Anda"
                      value={purposeDetail}
                      onChange={(e) => {
                        setPurposeDetail(e.target.value);
                        if (fieldErrors.purposeDetail) {
                          setFieldErrors({ ...fieldErrors, purposeDetail: undefined });
                        }
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        fieldErrors.purposeDetail
                          ? 'border-red-400 bg-red-50/20'
                          : 'border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                      }`}
                    />
                    {fieldErrors.purposeDetail && (
                      <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fieldErrors.purposeDetail}</span>
                      </p>
                    )}
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
                      placeholder="Contoh: Sudah janjian sebelumnya / titipan berkas"
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
                  <span>Tanda Tangan Digital Pengunjung <span className="text-stone-400 font-normal">(Opsional)</span></span>
                </label>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus Tanda Tangan</span>
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
            <div className={`p-4 rounded-2xl border transition-colors ${
              fieldErrors.consent
                ? 'bg-red-50/80 border-red-300'
                : 'bg-emerald-50/70 border-emerald-200/90'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => {
                    setConsentAgreed(e.target.checked);
                    if (e.target.checked && fieldErrors.consent) {
                      setFieldErrors({ ...fieldErrors, consent: undefined });
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs text-stone-700 leading-relaxed">
                  “Saya menyatakan bahwa data yang saya isi benar dan bersedia data kunjungan ini digunakan untuk keperluan administrasi SMP Alam Excellentia Pamekasan sesuai kebijakan privasi sekolah.”
                </span>
              </label>

              {fieldErrors.consent && (
                <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.consent}</span>
                </p>
              )}
            </div>

            {/* Bottom Error Notification directly above button for small screens */}
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

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
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-heading font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan Data Kunjungan...</span>
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
