export type UserRole = 'admin' | 'resepsionis' | 'kepsek';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  name: string;
  institution: string;
  phone: string;
  total_visits: number;
  last_visit_at: string;
  created_at: string;
}

export interface VisitEditLog {
  modified_at: string;
  modified_by: string;
  reason: string;
  previous_state: Partial<Visit>;
}

export interface Visit {
  id: string;
  visit_number: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // HH:mm
  check_out_time: string | null; // HH:mm
  duration_minutes: number | null;
  status: 'active' | 'completed';
  guest_name: string;
  institution: string;
  phone: string;
  category: string;
  purpose: string;
  purpose_detail?: string;
  person_to_meet: string;
  identity_number?: string;
  notes?: string;
  signature?: string | null;
  event_id?: string | null;
  created_at: string;
  updated_at: string;
  edit_history?: VisitEditLog[];
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  time_start: string;
  time_end: string;
  location: string;
  organizer_pic: string;
  description: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SchoolSettings {
  name: string;
  tagline: string;
  npsn: string;
  address: string;
  district: string;
  regency: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  principal_name: string;
  principal_nip: string;
  logo_url: string;
  terms_text: string;
}

export const GUEST_CATEGORIES = [
  'Orang tua/wali siswa',
  'Calon orang tua/wali siswa',
  'Tamu umum',
  'Tamu dinas atau instansi pemerintah',
  'Mitra kerja atau lembaga pendidikan',
  'Alumni',
  'Vendor atau penyedia jasa',
  'Tamu undangan kegiatan',
  'Lainnya',
] as const;

export const VISIT_PURPOSES = [
  'Keperluan administrasi',
  'Konsultasi dengan pihak sekolah',
  'Bertemu kepala sekolah',
  'Bertemu guru atau wali kelas',
  'Keperluan pembayaran',
  'Kerja sama atau kemitraan',
  'Observasi atau studi banding',
  'Keperluan penerimaan peserta didik baru',
  'Menghadiri kegiatan sekolah',
  'Keperluan lainnya',
] as const;

export const PERSON_TO_MEET_OPTIONS = [
  'Kepala Sekolah',
  'Wakil Kepala Sekolah (Kurikulum)',
  'Wakil Kepala Sekolah (Kesiswaan)',
  'Tata Usaha / Administrasi',
  'Guru / Wali Kelas',
  'Bendahara / Bagian Keuangan',
  'Panitia PPDB',
  'Koordinator Sekolah Alam & Outbound',
  'Lainnya',
] as const;
