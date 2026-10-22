import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Visit,
  SchoolEvent,
  SchoolSettings,
  ActivityLog,
  GUEST_CATEGORIES,
  VISIT_PURPOSES,
  PERSON_TO_MEET_OPTIONS,
} from '../types/guestbook';
import { api, DashboardStats } from '../services/api';
import QRCode from 'qrcode';
import {
  Shield,
  LayoutDashboard,
  Table,
  CalendarDays,
  FileSpreadsheet,
  History,
  Settings,
  LogOut,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User as UserIcon,
  Phone,
  Edit3,
  Trash2,
  Eye,
  QrCode,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onOpenEventForm: (eventId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onLogin,
  onLogout,
  settings,
  onUpdateSettings,
  onOpenEventForm,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'visits' | 'events' | 'reports' | 'logs' | 'settings'>('dashboard');

  // Login state (if not logged in)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Visits Filtering & Pagination
  const [visitSearch, setVisitSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<Visit | null>(null);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<SchoolEvent> | null>(null);
  const [selectedQrEvent, setSelectedQrEvent] = useState<SchoolEvent | null>(null);
  const [eventQrCodeUrl, setEventQrCodeUrl] = useState<string>('');

  // Report Period State
  const [reportType, setReportType] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'kategori' | 'tujuan'>('bulanan');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportCategory, setReportCategory] = useState<string>(GUEST_CATEGORIES[0]);
  const [reportPurpose, setReportPurpose] = useState<string>(VISIT_PURPOSES[0]);

  // Settings form state
  const [settingsFormData, setSettingsFormData] = useState<SchoolSettings>(settings);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Fetch all administrative data
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [statsData, visitsData, eventsData, logsData] = await Promise.all([
        api.getStats(),
        api.getVisits(),
        api.getEvents(),
        api.getLogs(),
      ]);
      setStats(statsData);
      setVisits(visitsData.visits || []);
      setEvents(eventsData);
      setLogs(logsData);
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    setSettingsFormData(settings);
  }, [settings]);

  // Generate event QR code
  useEffect(() => {
    if (selectedQrEvent) {
      const eventUrl = `${window.location.origin}/?event=${selectedQrEvent.id}`;
      QRCode.toDataURL(eventUrl, {
        width: 260,
        margin: 2,
        color: { dark: '#064e3b', light: '#ffffff' },
      }).then(setEventQrCodeUrl).catch(console.error);
    }
  }, [selectedQrEvent]);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const { user } = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Demo Account Switcher
  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoggingIn(true);
    setLoginError(null);
    api.login(demoEmail, demoPass)
      .then(({ user }) => onLogin(user))
      .catch((err) => setLoginError(err.message))
      .finally(() => setIsLoggingIn(false));
  };

  // Checkout Handler from table
  const handleCheckoutFromAdmin = async (visitId: string) => {
    try {
      await api.checkoutVisit(visitId, {
        user_name: currentUser?.name || 'Petugas',
        user_role: currentUser?.role || 'resepsionis',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal checkout');
    }
  };

  // Edit Visit Submit
  const handleSaveVisitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;
    if (!editReason.trim()) {
      alert('Alasan koreksi data wajib diisi untuk riwayat audit.');
      return;
    }

    try {
      await api.updateVisit(editingVisit.id, {
        ...editingVisit,
        reason: editReason,
        modified_by: currentUser?.name || 'Admin',
      });
      setEditingVisit(null);
      setEditReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data kunjungan.');
    }
  };

  // Delete Visit
  const handleConfirmDeleteVisit = async () => {
    if (!deleteVisitId) return;
    try {
      await api.deleteVisit(deleteVisitId, currentUser?.name || 'Admin');
      setDeleteVisitId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data kunjungan.');
    }
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title || !editingEvent.date || !editingEvent.location) {
      alert('Nama kegiatan, tanggal, dan lokasi wajib diisi.');
      return;
    }

    try {
      if (editingEvent.id) {
        await api.updateEvent(editingEvent.id, editingEvent, currentUser?.name || 'Admin');
      } else {
        await api.createEvent(editingEvent, currentUser?.name || 'Admin');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kegiatan.');
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus buku tamu kegiatan ini?')) return;
    try {
      await api.deleteEvent(id, currentUser?.name || 'Admin');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kegiatan.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(
        settingsFormData,
        currentUser?.name || 'Administrator',
        currentUser?.role || 'admin'
      );
      onUpdateSettings(updated);
      setSettingsSaveMsg('Pengaturan sekolah berhasil diperbarui.');
      setTimeout(() => setSettingsSaveMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui pengaturan.');
    }
  };

  // Restore Database Backup Handler
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreBackup(json, currentUser?.name || 'Admin');
        alert('Database berhasil dipulihkan!');
        loadData();
      } catch (err: any) {
        alert('Gagal memulihkan database: Berkas JSON tidak sesuai format.');
      }
    };
    reader.readAsText(file);
  };

  // Export Table Data to CSV
  const exportToCSV = (dataToExport: Visit[], filename = 'laporan_kunjungan_smp_alam.csv') => {
    const headers = [
      'Nomor Kunjungan',
      'Tanggal',
      'Jam Masuk',
      'Jam Keluar',
      'Durasi (Menit)',
      'Status',
      'Nama Tamu',
      'Instansi',
      'Nomor WhatsApp',
      'Kategori Tamu',
      'Tujuan Kunjungan',
      'Pihak yang Ditemui',
      'No. Identitas/Tugas',
      'Catatan',
    ];

    const rows = dataToExport.map((v) => [
      `"${v.visit_number}"`,
      `"${v.date}"`,
      `"${v.check_in_time}"`,
      `"${v.check_out_time || '-'}"`,
      `"${v.duration_minutes || '-'}"`,
      `"${v.status === 'completed' ? 'Selesai' : 'Masih Berkunjung'}"`,
      `"${v.guest_name.replace(/"/g, '""')}"`,
      `"${v.institution.replace(/"/g, '""')}"`,
      `"${v.phone}"`,
      `"${v.category}"`,
      `"${v.purpose}"`,
      `"${v.person_to_meet}"`,
      `"${v.identity_number || '-'}"`,
      `"${(v.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Visits for Table View
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const q = visitSearch.toLowerCase();
      const matchSearch =
        !q ||
        v.guest_name.toLowerCase().includes(q) ||
        v.institution.toLowerCase().includes(q) ||
        v.visit_number.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.person_to_meet.toLowerCase().includes(q);

      const matchCategory = filterCategory === 'Semua' || v.category === filterCategory;
      const matchStatus = filterStatus === 'Semua' || v.status === filterStatus;
      const matchDateFrom = !filterDateFrom || v.date >= filterDateFrom;
      const matchDateTo = !filterDateTo || v.date <= filterDateTo;

      return matchSearch && matchCategory && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [visits, visitSearch, filterCategory, filterStatus, filterDateFrom, filterDateTo]);

  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVisits.slice(start, start + pageSize);
  }, [filteredVisits, currentPage]);

  const totalPages = Math.ceil(filteredVisits.length / pageSize) || 1;

  // Filtered Visits for Official Report View
  const reportVisits = useMemo(() => {
    if (reportType === 'harian') {
      return visits.filter((v) => v.date === reportDate);
    }
    if (reportType === 'bulanan') {
      const monthPrefix = reportDate.slice(0, 7); // YYYY-MM
      return visits.filter((v) => v.date.startsWith(monthPrefix));
    }
    if (reportType === 'tahunan') {
      const yearPrefix = reportDate.slice(0, 4); // YYYY
      return visits.filter((v) => v.date.startsWith(yearPrefix));
    }
    if (reportType === 'mingguan') {
      // 7 days window ending at reportDate
      const target = new Date(reportDate);
      const start = new Date(target);
      start.setDate(target.getDate() - 6);
      const startStr = start.toISOString().split('T')[0];
      return visits.filter((v) => v.date >= startStr && v.date <= reportDate);
    }
    if (reportType === 'kategori') {
      return visits.filter((v) => v.category === reportCategory);
    }
    if (reportType === 'tujuan') {
      return visits.filter((v) => v.purpose === reportPurpose);
    }
    return visits;
  }, [visits, reportType, reportDate, reportCategory, reportPurpose]);

  // ================= NOT LOGGED IN STATE =================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-nature-pattern py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          
          <div className="bg-emerald-950 p-6 text-center text-white relative">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-400/30">
              <Shield className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="font-heading font-bold text-xl text-white">
              Portal Petugas & Administrator
            </h2>
            <p className="text-xs text-emerald-200 mt-1">
              SMP Alam Excellentia Pamekasan
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Email Petugas
              </label>
              <input
                type="email"
                required
                placeholder="nama@excellentia.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-heading font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>MASUK KE SISTEM</span>
                </>
              )}
            </button>

            {/* Quick Demo Login Preset Buttons for easy testing and evaluation */}
            <div className="pt-4 border-t border-stone-200 text-center">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2.5">
                Akses Demo Cepat Sesuai Hak Akses:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@excellentia.sch.id', 'admin123')}
                  className="px-2 py-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('resepsionis@excellentia.sch.id', 'resepsionis123')}
                  className="px-2 py-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors"
                >
                  Resepsionis
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('kepsek@excellentia.sch.id', 'kepsek123')}
                  className="px-2 py-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors"
                >
                  Kepsek
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // Role permissions
  const isAdmin = currentUser.role === 'admin';
  const isKepsek = currentUser.role === 'kepsek';
  const isReceptionist = currentUser.role === 'resepsionis';

  return (
    <div className="min-h-screen bg-stone-100/60 pb-16">
      
      {/* Admin Subheader & Profile Bar */}
      <div className="bg-white border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 flex items-center justify-center text-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base text-stone-900 leading-none">
                  Portal Administrasi Buku Tamu
                </h1>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'kepsek' ? 'Kepala Sekolah (Read-Only)' : 'Petugas Resepsionis'}
                </span>
              </div>
              <span className="text-xs text-stone-500">
                {currentUser.name} ({currentUser.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-stone-200 text-xs font-medium text-stone-600">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                : 'border-transparent hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-700" />
            <span>Dashboard Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'visits'
                ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                : 'border-transparent hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-700" />
            <span>Data Riwayat Tamu ({visits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'events'
                ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                : 'border-transparent hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-700" />
            <span>Buku Tamu Acara ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                : 'border-transparent hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Laporan & Cetak Resmi</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'logs'
                ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                : 'border-transparent hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <History className="w-4 h-4 text-emerald-700" />
            <span>Log Aktivitas & Audit</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'border-emerald-800 text-emerald-900 font-bold bg-emerald-50/50'
                  : 'border-transparent hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan & Cadangan</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* ================= TAB 1: DASHBOARD STATISTIK ================= */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                  Kunjungan Hari Ini
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
                    {stats.totalToday}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Hari Ini
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                  Sedang Berkunjung
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-amber-700">
                    {stats.activeNow}
                  </span>
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    Belum Check-Out
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                  Kunjungan Bulan Ini
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
                    {stats.totalMonth}
                  </span>
                  <span className="text-xs text-stone-600 font-semibold bg-stone-100 px-2 py-0.5 rounded">
                    Bulan Berjalan
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                  Total Tahun Ini
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-stone-900">
                    {stats.totalYear}
                  </span>
                  <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Akumulasi 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Graphs & Trends Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Trend (Last 7 Days) */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-stone-900">
                      Tren Kunjungan 7 Hari Terakhir
                    </h3>
                    <p className="text-xs text-stone-500">Statistik pengunjung harian</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>

                <div className="mt-6 flex items-end justify-between gap-2 h-44 pt-4 border-b border-stone-200">
                  {stats.dailyTrend.map((item, idx) => {
                    const max = Math.max(...stats.dailyTrend.map((d) => d.count), 1);
                    const heightPercent = Math.max((item.count / max) * 100, 8);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-mono font-bold text-stone-700 tabular-nums">
                          {item.count}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-emerald-800 hover:bg-emerald-700 rounded-t-lg transition-all"
                        />
                        <span className="text-[10px] font-medium text-stone-500 truncate w-full text-center">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Trend (Current Year) */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-stone-900">
                      Statistik Kunjungan Bulanan (Tahun 2026)
                    </h3>
                    <p className="text-xs text-stone-500">Persebaran tamu setiap bulan</p>
                  </div>
                  <CalendarDays className="w-4 h-4 text-emerald-700" />
                </div>

                <div className="mt-6 flex items-end justify-between gap-1.5 h-44 pt-4 border-b border-stone-200">
                  {stats.monthlyTrend.map((m, idx) => {
                    const max = Math.max(...stats.monthlyTrend.map((x) => x.count), 1);
                    const heightPercent = Math.max((m.count / max) * 100, 5);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] font-mono font-semibold text-stone-600 tabular-nums">
                          {m.count}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all ${
                            m.count > 0 ? 'bg-emerald-700' : 'bg-stone-200'
                          }`}
                        />
                        <span className="text-[9px] font-medium text-stone-500 truncate">
                          {m.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Category Breakdown & Frequent Visitors Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="font-heading font-bold text-base text-stone-900 mb-1">
                  Perbandingan Kategori Tamu
                </h3>
                <p className="text-xs text-stone-500 mb-4">Distribusi tamu berdasarkan kelompok pengunjung</p>

                <div className="space-y-3">
                  {Object.entries(stats.categoryCounts).map(([cat, count]) => {
                    const total = stats.totalAllTime || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-800">{cat}</span>
                          <span className="font-mono tabular-nums text-stone-600">
                            <strong>{count}</strong> ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="bg-emerald-800 h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frequent Visitors Ranking */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-stone-900">
                      Pengunjung Paling Sering Datang
                    </h3>
                    <p className="text-xs text-stone-500">Tamu dengan frekuensi kunjungan tertinggi</p>
                  </div>
                  <Award className="w-5 h-5 text-amber-600" />
                </div>

                <div className="divide-y divide-stone-100">
                  {stats.frequentVisitors.map((fv, index) => (
                    <div key={index} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-heading font-bold text-xs text-stone-900 block">
                            {fv.name}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {fv.institution}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-mono font-bold shrink-0">
                        {fv.count} Kali Kunjungan
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: DATA KUNJUNGAN LENGKAP ================= */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            
            {/* Header Controls & Filters */}
            <div className="p-5 border-b border-stone-200 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-stone-900">
                    Buku Tamu & Riwayat Kunjungan
                  </h2>
                  <p className="text-xs text-stone-500">
                    Total terdaftar: {filteredVisits.length} kunjungan
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToCSV(filteredVisits)}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Ekspor CSV / Excel</span>
                  </button>
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama, instansi, nomor..."
                    value={visitSearch}
                    onChange={(e) => {
                      setVisitSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Filter Category */}
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 bg-white"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {GUEST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 bg-white"
                  >
                    <option value="Semua">Semua Status (Aktif & Selesai)</option>
                    <option value="active">Masih Berkunjung</option>
                    <option value="completed">Selesai (Sudah Check-out)</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 bg-white font-mono"
                    title="Dari Tanggal"
                  />
                  <span className="text-stone-400 text-xs">-</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 bg-white font-mono"
                    title="Sampai Tanggal"
                  />
                </div>
              </div>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">No. Kunjungan</th>
                    <th className="py-3 px-3">Tanggal & Waktu</th>
                    <th className="py-3 px-3">Nama Tamu & Instansi</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Tujuan & Yang Ditemui</th>
                    <th className="py-3 px-3">Status & Durasi</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedVisits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        Tidak ada data kunjungan yang cocok dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedVisits.map((v, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      const isComplete = v.status === 'completed';
                      return (
                        <tr key={v.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3.5 px-3 text-center font-mono text-stone-400">
                            {rowNum}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-emerald-950 block">
                              {v.visit_number}
                            </span>
                            {v.phone && (
                              <a
                                href={`https://wa.me/${v.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-700 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{v.phone}</span>
                              </a>
                            )}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-mono font-medium text-stone-800 block">
                              {v.date}
                            </span>
                            <span className="text-[11px] text-stone-500 font-mono">
                              Masuk: {v.check_in_time} WIB
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-heading font-bold text-stone-900 block">
                              {v.guest_name}
                            </span>
                            <span className="text-[11px] text-stone-500 block truncate max-w-xs">
                              {v.institution}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="text-stone-700 block leading-tight">
                              {v.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-medium text-stone-800 block">
                              {v.purpose}
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              Bertemu: <strong className="text-emerald-950">{v.person_to_meet}</strong>
                            </span>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {isComplete ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Selesai ({v.check_out_time} WIB)</span>
                                </span>
                                {v.duration_minutes && (
                                  <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                                    Durasi: {v.duration_minutes} Menit
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <span>Masih Berkunjung</span>
                                </span>
                                {!isKepsek && (
                                  <button
                                    onClick={() => handleCheckoutFromAdmin(v.id)}
                                    className="text-[11px] text-emerald-800 font-semibold hover:underline block mt-1"
                                  >
                                    + Catat Keluar
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Detail Modal */}
                              <button
                                onClick={() => setSelectedVisitDetail(v)}
                                title="Lihat Rincian Lengkap"
                                className="p-1.5 text-stone-500 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit with reason */}
                              {!isKepsek && (
                                <button
                                  onClick={() => {
                                    setEditingVisit(v);
                                    setEditReason('');
                                  }}
                                  title="Edit & Koreksi Data"
                                  className="p-1.5 text-stone-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete (Admin only) */}
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteVisitId(v.id)}
                                  title="Hapus Kunjungan"
                                  className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
              <span>
                Menampilkan halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredVisits.length} data)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 hover:bg-stone-50 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40 hover:bg-stone-50 transition-colors flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: BUKU TAMU KHUSUS KEGIATAN ================= */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-lg text-stone-900">
                  Manajemen Buku Tamu Kegiatan Sekolah
                </h2>
                <p className="text-xs text-stone-500">
                  Buat formulir kehadiran khusus untuk pertemuan wali murid, seminar, studi banding, dan kegiatan alam.
                </p>
              </div>

              {!isKepsek && (
                <button
                  onClick={() => {
                    setEditingEvent({
                      title: '',
                      date: new Date().toISOString().split('T')[0],
                      time_start: '08:00',
                      time_end: '12:00',
                      location: 'Pendopo Utama SMP Alam Excellentia',
                      organizer_pic: 'Panitia Kegiatan',
                      description: '',
                      status: 'active',
                    });
                    setShowEventModal(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kegiatan Baru</span>
                </button>
              )}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev: any) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 flex flex-col justify-between hover:border-emerald-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        ev.status === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {ev.status === 'active' ? 'Sedang Berlangsung' : 'Selesai'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-950">
                        {ev.attendee_count ?? 0} Tamu Hadir
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-stone-900 mb-2 leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-stone-600 mb-4 line-clamp-3 leading-relaxed">
                      {ev.description || 'Tidak ada deskripsi tambahan.'}
                    </p>

                    <div className="space-y-1.5 text-xs text-stone-600 pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{ev.date} ({ev.time_start} - {ev.time_end} WIB)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>PJ: {ev.organizer_pic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    {/* QR Code generator button */}
                    <button
                      onClick={() => setSelectedQrEvent(ev)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Lihat QR Code</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Public form link */}
                      <button
                        onClick={() => onOpenEventForm(ev.id)}
                        title="Buka Formulir Tamu Kegiatan Ini"
                        className="p-1.5 text-stone-500 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Edit event */}
                      {!isKepsek && (
                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setShowEventModal(true);
                          }}
                          title="Edit Kegiatan"
                          className="p-1.5 text-stone-500 hover:text-blue-900 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete event */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          title="Hapus Kegiatan"
                          className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================= TAB 4: LAPORAN & CETAK RESMI ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* Filter & Export Controls */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-stone-900">
                    Laporan Kunjungan & Dokumen Resmi
                  </h2>
                  <p className="text-xs text-stone-500">
                    Cetak laporan berkop resmi atau unduh file rekapitulasi data tamu sekolah.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>CETAK LAPORAN (PRINT / PDF)</span>
                  </button>

                  <button
                    onClick={() => exportToCSV(reportVisits, `laporan_${reportType}_${reportDate}.csv`)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-800" />
                    <span>EKSPOR EXCEL / CSV</span>
                  </button>
                </div>
              </div>

              {/* Report Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jenis Periode Laporan
                  </label>
                  <select
                    value={reportType}
                    onChange={(e: any) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="harian">Laporan Harian</option>
                    <option value="mingguan">Laporan Mingguan (7 Hari)</option>
                    <option value="bulanan">Laporan Bulanan</option>
                    <option value="tahunan">Laporan Tahunan</option>
                    <option value="kategori">Berdasarkan Kategori Tamu</option>
                    <option value="tujuan">Berdasarkan Tujuan Kunjungan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pilih Tanggal / Acuan Periode
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono"
                  />
                </div>

                {reportType === 'kategori' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kategori Pilihan
                    </label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      {GUEST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportType === 'tujuan' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Tujuan Pilihan
                    </label>
                    <select
                      value={reportPurpose}
                      onChange={(e) => setReportPurpose(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      {VISIT_PURPOSES.map((purp) => (
                        <option key={purp} value={purp}>{purp}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Official Report Document Preview & Print Sheet */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-10 print-page text-black">
              
              {/* Kop Surat Resmi SMP Alam Excellentia Pamekasan */}
              <div className="border-b-4 border-double border-stone-900 pb-4 mb-6">
                <div className="flex items-center gap-5">
                  <img
                    src={settings.logo_url || '/assets/aistudio/1713909500616_5b14171f.png'}
                    alt="Logo Sekolah"
                    className="w-20 h-20 object-contain shrink-0"
                  />
                  <div className="text-center flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      YAYASAN PENDIDIKAN ALAM EXCELLENTIA
                    </span>
                    <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-stone-900 tracking-tight">
                      {settings.name}
                    </h1>
                    <p className="text-xs text-stone-700 leading-tight mt-0.5">
                      NPSN: {settings.npsn} · {settings.address}, {settings.district}, {settings.regency}, {settings.province} {settings.postal_code}
                    </p>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Telepon: {settings.phone} | Pos-el: {settings.email} | Laman: {settings.website}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Title & Metadata */}
              <div className="text-center mb-6">
                <h2 className="font-heading font-bold text-base uppercase underline tracking-wide">
                  LAPORAN REKAPITULASI BUKU TAMU DIGITAL
                </h2>
                <p className="text-xs text-stone-700 mt-1">
                  Periode: <strong className="uppercase">{reportType}</strong> ({reportDate})
                  {reportType === 'kategori' && ` — Kategori: ${reportCategory}`}
                  {reportType === 'tujuan' && ` — Tujuan: ${reportPurpose}`}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Total Tercatat: <strong>{reportVisits.length}</strong> Kunjungan
                </p>
              </div>

              {/* Report Table */}
              <table className="w-full border-collapse border border-stone-400 text-xs mb-8">
                <thead className="bg-stone-100 font-semibold text-stone-900">
                  <tr>
                    <th className="border border-stone-400 p-2 text-center w-8">No</th>
                    <th className="border border-stone-400 p-2">No. Kunjungan</th>
                    <th className="border border-stone-400 p-2">Tanggal / Jam</th>
                    <th className="border border-stone-400 p-2">Nama Tamu & Instansi</th>
                    <th className="border border-stone-400 p-2">Kategori</th>
                    <th className="border border-stone-400 p-2">Tujuan Kunjungan</th>
                    <th className="border border-stone-400 p-2">Yang Ditemui</th>
                    <th className="border border-stone-400 p-2 text-center">Durasi</th>
                  </tr>
                </thead>
                <tbody>
                  {reportVisits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-stone-400 p-6 text-center text-stone-400 italic">
                        Tidak ada data kunjungan pada periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    reportVisits.map((v, i) => (
                      <tr key={v.id}>
                        <td className="border border-stone-400 p-2 text-center font-mono">{i + 1}</td>
                        <td className="border border-stone-400 p-2 font-mono font-semibold">{v.visit_number}</td>
                        <td className="border border-stone-400 p-2 whitespace-nowrap">
                          {v.date} <br />
                          <span className="text-[10px] text-stone-600">
                            {v.check_in_time} - {v.check_out_time || 'Selesai'}
                          </span>
                        </td>
                        <td className="border border-stone-400 p-2">
                          <strong>{v.guest_name}</strong>
                          <br />
                          <span className="text-[10px] text-stone-600">{v.institution}</span>
                        </td>
                        <td className="border border-stone-400 p-2">{v.category}</td>
                        <td className="border border-stone-400 p-2">{v.purpose}</td>
                        <td className="border border-stone-400 p-2">{v.person_to_meet}</td>
                        <td className="border border-stone-400 p-2 text-center font-mono">
                          {v.duration_minutes ? `${v.duration_minutes}m` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Official Signature Area */}
              <div className="pt-8 grid grid-cols-2 text-xs text-stone-800">
                <div className="text-center">
                  <p>Petugas Front Office / Resepsionis,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">Siti Nur Aisyah</p>
                  <p className="text-[11px] text-stone-500">Staf Administrasi Sekolah</p>
                </div>

                <div className="text-center">
                  <p>Pamekasan, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p>Mengetahui, Kepala Sekolah</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{settings.principal_name}</p>
                  <p className="text-[11px] text-stone-500">NIP. {settings.principal_nip}</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 5: LOG AKTIVITAS & AUDIT ================= */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200">
              <h2 className="font-heading font-bold text-lg text-stone-900">
                Riwayat Aktivitas & Jejak Audit Sistem
              </h2>
              <p className="text-xs text-stone-500">
                Mencatat seluruh aksi login, penambahan kunjungan, pencatatan jam keluar, dan koreksi data.
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  Belum ada log aktivitas.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-stone-50 transition-colors flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {log.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-stone-900">
                          {log.action}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-stone-600 leading-relaxed">
                        {log.details}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-400">
                        <span>Oleh: <strong className="text-stone-700">{log.user_name}</strong></span>
                        <span>·</span>
                        <span className="uppercase">{log.user_role}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: PENGATURAN SEKOLAH & CADANGAN ================= */}
        {activeTab === 'settings' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* School Profile Settings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
              <div>
                <h2 className="font-heading font-bold text-lg text-stone-900">
                  Identitas & Profil Resmi Sekolah
                </h2>
                <p className="text-xs text-stone-500">
                  Informasi ini digunakan pada kepala surat (kop), header, dan dokumen cetak resmi.
                </p>
              </div>

              {settingsSaveMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{settingsSaveMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Resmi Sekolah
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsFormData.name}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Motto / Slogan Sekolah
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.tagline}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, tagline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      NPSN
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.npsn}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, npsn: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.phone}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Alamat Lengkap
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.address}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.principal_name}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, principal_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.principal_nip}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, principal_nip: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Teks Pernyataan Persetujuan Privasi Tamu
                    </label>
                    <textarea
                      rows={2}
                      value={settingsFormData.terms_text}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, terms_text: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-heading font-semibold transition-colors shadow-xs"
                  >
                    Simpan Perubahan Identitas
                  </button>
                </div>
              </form>
            </div>

            {/* Database Backup & Restore */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
              <div>
                <h3 className="font-heading font-bold text-base text-stone-900">
                  Cadangan & Pemulihan Basis Data
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Amankan data riwayat kunjungan dan pengaturan sekolah secara berkala.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="text-xs font-semibold text-stone-800 block">
                  1. Unduh Cadangan Penuh (Backup JSON)
                </span>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Menghasilkan berkas arsip lengkap seluruh tabel kunjungan, pengguna, acara, dan profil sekolah.
                </p>
                <a
                  href={api.getExportBackupUrl()}
                  download
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File Backup Sekarang</span>
                </a>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="text-xs font-semibold text-stone-800 block">
                  2. Pulihkan Basis Data (Restore JSON)
                </span>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Pilih berkas cadangan JSON yang telah diunduh sebelumnya untuk mengembalikan kondisi sistem.
                </p>
                <label className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <History className="w-3.5 h-3.5" />
                  <span>Pilih Berkas JSON untuk Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ================= MODAL: DETAIL KUNJUNGAN ================= */}
      {selectedVisitDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 font-bold block">
                  {selectedVisitDetail.visit_number}
                </span>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  Rincian Tamu Kunjungan
                </h3>
              </div>
              <button
                onClick={() => setSelectedVisitDetail(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 block">Nama Tamu</span>
                  <strong className="text-stone-900 text-sm">{selectedVisitDetail.guest_name}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Instansi</span>
                  <strong className="text-stone-900 text-sm">{selectedVisitDetail.institution}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <div>
                  <span className="text-stone-400 block">No. WhatsApp / HP</span>
                  <strong className="text-stone-900 font-mono">{selectedVisitDetail.phone}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Kategori</span>
                  <strong className="text-stone-900">{selectedVisitDetail.category}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="text-stone-400 block">Tujuan Kunjungan</span>
                <strong className="text-stone-900">{selectedVisitDetail.purpose}</strong>
                {selectedVisitDetail.purpose_detail && (
                  <p className="mt-1 text-stone-600 italic">“{selectedVisitDetail.purpose_detail}”</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <div>
                  <span className="text-stone-400 block">Pihak yang Ditemui</span>
                  <strong className="text-stone-900">{selectedVisitDetail.person_to_meet}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block">No. Identitas / Surat Tugas</span>
                  <strong className="text-stone-900">{selectedVisitDetail.identity_number || '-'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 font-mono">
                <div>
                  <span className="text-stone-400 block font-sans">Tanggal</span>
                  <span>{selectedVisitDetail.date}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-sans">Jam Datang</span>
                  <span className="text-emerald-800 font-bold">{selectedVisitDetail.check_in_time} WIB</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-sans">Jam Keluar</span>
                  <span>{selectedVisitDetail.check_out_time ? `${selectedVisitDetail.check_out_time} WIB` : 'Masih Berkunjung'}</span>
                </div>
              </div>

              {selectedVisitDetail.notes && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block">Catatan Tambahan</span>
                  <p className="text-stone-700">{selectedVisitDetail.notes}</p>
                </div>
              )}

              {/* Tanda Tangan Digital jika ada */}
              {selectedVisitDetail.signature && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block mb-1">Tanda Tangan Digital Pengunjung</span>
                  <img
                    src={selectedVisitDetail.signature}
                    alt="Tanda Tangan"
                    className="h-16 border border-stone-200 rounded-lg p-1 bg-stone-50"
                  />
                </div>
              )}

              {/* Riwayat Koreksi Audit jika ada */}
              {selectedVisitDetail.edit_history && selectedVisitDetail.edit_history.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block mb-1 font-semibold">Riwayat Koreksi Data:</span>
                  <div className="space-y-1 bg-stone-50 p-2 rounded-lg text-[11px]">
                    {selectedVisitDetail.edit_history.map((h, i) => (
                      <div key={i} className="text-stone-600">
                        • {new Date(h.modified_at).toLocaleString('id-ID')} oleh <strong>{h.modified_by}</strong>: “{h.reason}”
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedVisitDetail(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DATA DENGAN ALASAN AUDIT ================= */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 max-w-md w-full p-6 animate-in fade-in">
            <h3 className="font-heading font-bold text-base text-stone-900 mb-1">
              Koreksi Data Kunjungan ({editingVisit.visit_number})
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Setiap perubahan akan dicatat dalam riwayat audit sistem sekolah.
            </p>

            <form onSubmit={handleSaveVisitEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nama Tamu</label>
                <input
                  type="text"
                  required
                  value={editingVisit.guest_name}
                  onChange={(e) => setEditingVisit({ ...editingVisit, guest_name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Asal Instansi</label>
                <input
                  type="text"
                  required
                  value={editingVisit.institution}
                  onChange={(e) => setEditingVisit({ ...editingVisit, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={editingVisit.phone}
                  onChange={(e) => setEditingVisit({ ...editingVisit, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Pihak yang Ditemui</label>
                <select
                  value={editingVisit.person_to_meet}
                  onChange={(e) => setEditingVisit({ ...editingVisit, person_to_meet: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                >
                  {PERSON_TO_MEET_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Alasan Koreksi / Perbaikan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ralat penulisan nama / salah ketik instansi"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:border-emerald-600 bg-amber-50/40"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HAPUS KUNJUNGAN KONFIRMASI ================= */}
      {deleteVisitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-stone-900">
              Konfirmasi Hapus Data
            </h3>
            <p className="text-xs text-stone-600">
              Apakah Anda yakin ingin menghapus data kunjungan ini? Tindakan ini akan dicatat dalam log audit.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteVisitId(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteVisit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EVENT QR CODE ================= */}
      {selectedQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4">
            <div className="text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                QR Code Buku Tamu Kegiatan
              </span>
              <h3 className="font-heading font-bold text-lg text-stone-900 mt-1">
                {selectedQrEvent.title}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedQrEvent.date} · {selectedQrEvent.location}
              </p>
            </div>

            {eventQrCodeUrl && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block mx-auto shadow-inner">
                <img
                  src={eventQrCodeUrl}
                  alt="QR Code Kegiatan"
                  className="w-48 h-48 object-contain mx-auto"
                />
                <span className="text-[11px] font-mono text-stone-600 block mt-2">
                  Scan dengan Kamera HP untuk Isi Buku Tamu
                </span>
              </div>
            )}

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Cetak atau tampilkan QR code ini di meja registrasi / pintu masuk acara agar pengunjung dapat langsung mengisi data kehadiran secara mandiri tanpa antre.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Standee QR</span>
              </button>
              <button
                onClick={() => setSelectedQrEvent(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT KEGIATAN ================= */}
      {showEventModal && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-heading font-bold text-base text-stone-900">
              {editingEvent.id ? 'Perbarui Rincian Kegiatan' : 'Buat Buku Tamu Khusus Kegiatan Baru'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno Komite & Wali Murid"
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editingEvent.date || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={editingEvent.time_start || '08:00'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time_start: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={editingEvent.time_end || '12:00'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time_end: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pendopo Utama & Joglo Alam"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Penanggung Jawab (PJ)</label>
                <input
                  type="text"
                  placeholder="Contoh: Waka Kesiswaan / Tim PPDB"
                  value={editingEvent.organizer_pic || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, organizer_pic: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Keterangan Kegiatan</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat kegiatan"
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
