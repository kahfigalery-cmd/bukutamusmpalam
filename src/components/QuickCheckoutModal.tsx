import React, { useState, useEffect } from 'react';
import { Visit, User } from '../types/guestbook';
import { api } from '../services/api';
import {
  LogOut,
  Search,
  X,
  Clock,
  Building2,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';

interface QuickCheckoutModalProps {
  currentUser: User | null;
  onClose: () => void;
  onCheckoutComplete?: (updatedVisit: Visit) => void;
}

export const QuickCheckoutModal: React.FC<QuickCheckoutModalProps> = ({
  currentUser,
  onClose,
  onCheckoutComplete,
}) => {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutResult, setCheckoutResult] = useState<{ message: string; visit: Visit } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchActiveVisits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVisits({ status: 'active', search: searchQuery });
      setActiveVisits(res.visits || []);
    } catch (e) {
      console.error('Error fetching active visits', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVisits();
  }, [searchQuery]);

  const handleCheckout = async (visit: Visit) => {
    setProcessingId(visit.id);
    setCheckoutResult(null);
    try {
      const result = await api.checkoutVisit(visit.id, {
        user_name: currentUser?.name || 'Tamu Mandiri / Petugas Front Office',
        user_role: currentUser?.role || 'resepsionis',
      });
      setCheckoutResult(result);
      if (onCheckoutComplete) {
        onCheckoutComplete(result.visit);
      }
      fetchActiveVisits();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat jam keluar.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">
                Pencatatan Jam Keluar Tamu (Check-Out)
              </h2>
              <p className="text-xs text-emerald-200">
                Pencatatan waktu keluar tamu secara akurat menggunakan waktu server (WIB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          
          {/* Checkout Notification */}
          {checkoutResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-stone-800 flex items-start gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900 block text-sm mb-1">
                  Check-Out Berhasil!
                </span>
                <p>{checkoutResult.message}</p>
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-stone-600">
                  <span>Nomor: <strong>{checkoutResult.visit.visit_number}</strong></span>
                  <span>Jam Masuk: {checkoutResult.visit.check_in_time} WIB</span>
                  <span>Jam Keluar: <strong className="text-emerald-800">{checkoutResult.visit.check_out_time} WIB</strong></span>
                  <span>Durasi: <strong className="text-emerald-800">{checkoutResult.visit.duration_minutes} Menit</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama tamu, instansi, atau nomor kunjungan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
            />
          </div>

          {/* Active Guest List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Daftar Tamu Masih Berkunjung ({activeVisits.length})</span>
              </span>
              <span>Waktu Server Real-Time</span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Memuat daftar tamu aktif...
              </div>
            ) : activeVisits.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-stone-200 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-stone-700">Tidak ada tamu yang sedang aktif saat ini.</p>
                <p className="text-xs text-stone-500 mt-1">
                  Semua kunjungan telah selesai atau data tidak ditemukan pada pencarian.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-4 bg-stone-50 border border-stone-200 rounded-2xl hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">
                          {visit.visit_number}
                        </span>
                        <span className="font-heading font-bold text-sm text-stone-900">
                          {visit.guest_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          <span>{visit.institution}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-emerald-800 font-mono font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Masuk: {visit.check_in_time} WIB</span>
                        </span>
                        <span>·</span>
                        <span className="text-stone-500">
                          Bertemu: {visit.person_to_meet}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckout(visit)}
                      disabled={processingId === visit.id}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 disabled:opacity-50"
                    >
                      {processingId === visit.id ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mencatat...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3.5 h-3.5" />
                          <span>CATAT JAM KELUAR</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
