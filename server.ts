import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

// Database file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Server-side Asia/Jakarta time helper
export function getJakartaDate(): { dateStr: string; timeStr: string; isoStr: string; fullDateId: string } {
  const now = new Date();
  // Format into Asia/Jakarta timezone
  const formatterDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatterDate.format(now); // YYYY-MM-DD

  const formatterTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeStr = formatterTime.format(now); // HH:mm

  const formatterFull = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return {
    dateStr,
    timeStr,
    isoStr: now.toISOString(),
    fullDateId: formatterFull.format(now),
  };
}

// Initial Database Seeding
function initializeDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (data && data.visits && data.users) {
        return data;
      }
    } catch (e) {
      console.error('Error reading existing database, recreating...', e);
    }
  }

  const { dateStr, timeStr } = getJakartaDate();

  const initialData = {
    settings: {
      name: 'SMP ALAM EXCELLENTIA PAMEKASAN',
      tagline: 'Membina Generasi Unggul Berkarakter, Cinta Al-Qur\'an, & Berwawasan Lingkungan',
      npsn: '69987654',
      address: 'Jl. Raya Nyalaran No. 45, Desa Kolpajung, Kec. Pamekasan',
      district: 'Pamekasan',
      regency: 'Kabupaten Pamekasan',
      province: 'Jawa Timur',
      postal_code: '69317',
      phone: '0812-3456-7890',
      email: 'smpalam.excellentia@gmail.com',
      website: 'https://smpalamexcellentia.sch.id',
      principal_name: 'Ust. Ahmad Fauzi, S.Pd., M.Pd.',
      principal_nip: '19820514 200801 1 012',
      logo_url: '/assets/aistudio/1713909500616_5b14171f.png',
      terms_text: 'Saya menyatakan bahwa data yang saya isi benar dan bersedia data kunjungan ini digunakan untuk keperluan administrasi SMP Alam Excellentia Pamekasan sesuai kebijakan privasi sekolah.',
    },
    users: [
      {
        id: 'usr_admin',
        name: 'Ust. Rahmat Hidayat, S.Kom',
        email: 'admin@excellentia.sch.id',
        password_hash: hashPassword('admin123'),
        role: 'admin',
        phone: '081234567801',
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr_resepsionis',
        name: 'Siti Nur Aisyah (Petugas Front Office)',
        email: 'resepsionis@excellentia.sch.id',
        password_hash: hashPassword('resepsionis123'),
        role: 'resepsionis',
        phone: '081234567802',
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr_kepsek',
        name: 'Ust. Ahmad Fauzi, S.Pd., M.Pd.',
        email: 'kepsek@excellentia.sch.id',
        password_hash: hashPassword('kepsek123'),
        role: 'kepsek',
        phone: '081234567803',
        created_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'evt_1',
        title: 'Parenting Day & Pameran Hasil Karya Siswa Sekolah Alam',
        date: dateStr,
        time_start: '08:00',
        time_end: '12:00',
        location: 'Pendopo Utama & Gazebo SMP Alam Excellentia',
        organizer_pic: 'Waka Kesiswaan & Komite Sekolah',
        description: 'Pertemuan rutin orang tua wali murid, sharing parenting islami, dan apresiasi karya proyek alam siswa.',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'evt_2',
        title: 'Open House & Kunjungan Edukasi Lingkungan (PPDB 2026/2027)',
        date: '2026-10-25',
        time_start: '07:30',
        time_end: '14:00',
        location: 'Area Kebun Organik & Kelas Terbuka Bambu',
        organizer_pic: 'Tim Panitia PPDB',
        description: 'Kunjungan pengenalan lingkungan sekolah alam bagi calon peserta didik baru dan orang tua.',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'evt_3',
        title: 'Studi Banding Pengelolaan Kurikulum Merdeka Sekolah Berbasis Alam',
        date: '2026-10-18',
        time_start: '09:00',
        time_end: '13:00',
        location: 'Ruang Multimedia & Joglo Edukasi',
        organizer_pic: 'Waka Kurikulum',
        description: 'Kunjungan kehormatan dari MGMP IPA & Pengurus Forum Sekolah Islam Terpadu Madura.',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ],
    visitors: [
      {
        id: 'vis_1',
        name: 'Drs. H. Mulyadi, M.Si',
        institution: 'Dinas Pendidikan Kabupaten Pamekasan',
        phone: '081330129841',
        total_visits: 3,
        last_visit_at: dateStr,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vis_2',
        name: 'Hj. Anis Wardani, S.Pd',
        institution: 'Wali Murid Kelas 8 Excellentia',
        phone: '082143987112',
        total_visits: 4,
        last_visit_at: dateStr,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vis_3',
        name: 'Dr. Ir. Bambang Suprayitno',
        institution: 'Universitas Madura (Fakultas Pertanian)',
        phone: '081798234123',
        total_visits: 2,
        last_visit_at: dateStr,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vis_4',
        name: 'Zainal Arifin, S.Ag',
        institution: 'Kementerian Agama Kab. Pamekasan',
        phone: '085231908477',
        total_visits: 1,
        last_visit_at: dateStr,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vis_5',
        name: 'Dewi Sartika Putri',
        institution: 'Calon Wali Murid (SD Plus Nurul Hikmah)',
        phone: '087856432109',
        total_visits: 1,
        last_visit_at: dateStr,
        created_at: new Date().toISOString(),
      },
    ],
    visits: [
      {
        id: 'v_1',
        visit_number: `EXC-${dateStr.replace(/-/g, '')}-001`,
        date: dateStr,
        check_in_time: '08:15',
        check_out_time: null,
        duration_minutes: null,
        status: 'active',
        guest_name: 'Drs. H. Mulyadi, M.Si',
        institution: 'Dinas Pendidikan Kabupaten Pamekasan',
        phone: '081330129841',
        category: 'Tamu dinas atau instansi pemerintah',
        purpose: 'Bertemu kepala sekolah',
        purpose_detail: 'Koordinasi program Sekolah Penggerak dan Asesmen Nasional',
        person_to_meet: 'Kepala Sekolah',
        identity_number: 'ST-Disdik/104/X/2026',
        notes: 'Membawa berkas supervisi akademik sekolah alam',
        signature: null,
        event_id: null,
        created_at: `${dateStr}T08:15:00.000Z`,
        updated_at: `${dateStr}T08:15:00.000Z`,
      },
      {
        id: 'v_2',
        visit_number: `EXC-${dateStr.replace(/-/g, '')}-002`,
        date: dateStr,
        check_in_time: '08:45',
        check_out_time: null,
        duration_minutes: null,
        status: 'active',
        guest_name: 'Hj. Anis Wardani, S.Pd',
        institution: 'Wali Murid Kelas 8 Excellentia',
        phone: '082143987112',
        category: 'Orang tua/wali siswa',
        purpose: 'Konsultasi dengan pihak sekolah',
        purpose_detail: 'Konsultasi perkembangan program outbound dan tahfidz ananda Azzam',
        person_to_meet: 'Guru / Wali Kelas',
        identity_number: '',
        notes: 'Sudah membuat janji dengan Ustazah Fatimah',
        signature: null,
        event_id: 'evt_1',
        created_at: `${dateStr}T08:45:00.000Z`,
        updated_at: `${dateStr}T08:45:00.000Z`,
      },
      {
        id: 'v_3',
        visit_number: `EXC-${dateStr.replace(/-/g, '')}-003`,
        date: dateStr,
        check_in_time: '09:10',
        check_out_time: '10:30',
        duration_minutes: 80,
        status: 'completed',
        guest_name: 'Dr. Ir. Bambang Suprayitno',
        institution: 'Universitas Madura (Fakultas Pertanian)',
        phone: '081798234123',
        category: 'Mitra kerja atau lembaga pendidikan',
        purpose: 'Kerja sama atau kemitraan',
        purpose_detail: 'Pendampingan greenhouse hidroponik dan pupuk organik siswa',
        person_to_meet: 'Koordinator Sekolah Alam & Outbound',
        identity_number: 'NIDN-0714087501',
        notes: 'MoU kerjasama pengayaan kurikulum alam',
        signature: null,
        event_id: null,
        created_at: `${dateStr}T09:10:00.000Z`,
        updated_at: `${dateStr}T10:30:00.000Z`,
      },
      {
        id: 'v_4',
        visit_number: `EXC-${dateStr.replace(/-/g, '')}-004`,
        date: dateStr,
        check_in_time: '09:30',
        check_out_time: null,
        duration_minutes: null,
        status: 'active',
        guest_name: 'Dewi Sartika Putri',
        institution: 'Calon Wali Murid (SD Plus Nurul Hikmah)',
        phone: '087856432109',
        category: 'Calon orang tua/wali siswa',
        purpose: 'Keperluan penerimaan peserta didik baru',
        purpose_detail: 'Pengambilan formulir dan observasi sarana prasarana sekolah',
        person_to_meet: 'Panitia PPDB',
        identity_number: '',
        notes: 'Tertarik kurikulum bilingual & tahfidz Quran outdoor',
        signature: null,
        event_id: null,
        created_at: `${dateStr}T09:30:00.000Z`,
        updated_at: `${dateStr}T09:30:00.000Z`,
      },
      {
        id: 'v_5',
        visit_number: `EXC-${dateStr.replace(/-/g, '')}-005`,
        date: dateStr,
        check_in_time: '10:00',
        check_out_time: '11:15',
        duration_minutes: 75,
        status: 'completed',
        guest_name: 'Zainal Arifin, S.Ag',
        institution: 'Kementerian Agama Kab. Pamekasan',
        phone: '085231908477',
        category: 'Tamu dinas atau instansi pemerintah',
        purpose: 'Observasi atau studi banding',
        purpose_detail: 'Monitoring pembelajaran PAI tematik berbasis alam',
        person_to_meet: 'Wakil Kepala Sekolah (Kurikulum)',
        identity_number: '197906152003121004',
        notes: 'Apresiasi integrasi adab dan tadabbur alam',
        signature: null,
        event_id: null,
        created_at: `${dateStr}T10:00:00.000Z`,
        updated_at: `${dateStr}T11:15:00.000Z`,
      },
      {
        id: 'v_6',
        visit_number: `EXC-20261021-001`,
        date: '2026-10-21',
        check_in_time: '08:30',
        check_out_time: '10:00',
        duration_minutes: 90,
        status: 'completed',
        guest_name: 'Hj. Anis Wardani, S.Pd',
        institution: 'Wali Murid Kelas 8 Excellentia',
        phone: '082143987112',
        category: 'Orang tua/wali siswa',
        purpose: 'Keperluan pembayaran',
        purpose_detail: 'Pelunasan SPP dan biaya kegiatan berkemah alam',
        person_to_meet: 'Bendahara / Bagian Keuangan',
        identity_number: '',
        notes: 'Dilayani oleh kasir sekolah',
        signature: null,
        event_id: null,
        created_at: '2026-10-21T08:30:00.000Z',
        updated_at: '2026-10-21T10:00:00.000Z',
      },
      {
        id: 'v_7',
        visit_number: `EXC-20261021-002`,
        date: '2026-10-21',
        check_in_time: '11:00',
        check_out_time: '12:45',
        duration_minutes: 105,
        status: 'completed',
        guest_name: 'Hendra Setiawan',
        institution: 'CV Surya Pratama Madura (Penyedia Bibit Tanaman)',
        phone: '081938472911',
        category: 'Vendor atau penyedia jasa',
        purpose: 'Keperluan administrasi',
        purpose_detail: 'Pengiriman bibit pohon buah dan perlengkapan hidroponik',
        person_to_meet: 'Tata Usaha / Administrasi',
        identity_number: 'SJ-SPM-8821',
        notes: 'Pemeriksaan surat jalan barang',
        signature: null,
        event_id: null,
        created_at: '2026-10-21T11:00:00.000Z',
        updated_at: '2026-10-21T12:45:00.000Z',
      },
      {
        id: 'v_8',
        visit_number: `EXC-20261020-001`,
        date: '2026-10-20',
        check_in_time: '09:00',
        check_out_time: '11:30',
        duration_minutes: 150,
        status: 'completed',
        guest_name: 'Muhammad Rifqi, S.Pd',
        institution: 'Ikatan Alumni Excellentia',
        phone: '085712398744',
        category: 'Alumni',
        purpose: 'Konsultasi dengan pihak sekolah',
        purpose_detail: 'Sinergi program alumni mengajar dan bakti sosial',
        person_to_meet: 'Wakil Kepala Sekolah (Kesiswaan)',
        identity_number: '',
        notes: 'Alumni angkatan 2020',
        signature: null,
        event_id: null,
        created_at: '2026-10-20T09:00:00.000Z',
        updated_at: '2026-10-20T11:30:00.000Z',
      },
    ],
    activity_logs: [
      {
        id: 'log_1',
        user_name: 'Sistem',
        user_role: 'system',
        action: 'Inisialisasi Sistem',
        details: 'Basis data Buku Tamu Digital SMP Alam Excellentia Pamekasan siap digunakan.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log_2',
        user_name: 'Siti Nur Aisyah',
        user_role: 'resepsionis',
        action: 'Check-out Tamu',
        details: 'Mencatat jam keluar Dr. Ir. Bambang Suprayitno (10:30, durasi 80 menit).',
        timestamp: `${dateStr}T10:30:00.000Z`,
      },
      {
        id: 'log_3',
        user_name: 'Ust. Rahmat Hidayat, S.Kom',
        user_role: 'admin',
        action: 'Pembaruan Data Kegiatan',
        details: 'Memperbarui rincian kegiatan Parenting Day & Pameran Hasil Karya.',
        timestamp: `${dateStr}T08:00:00.000Z`,
      },
    ],
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

// Password hashing helper (deterministic SHA-256 for secure local store)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`excellentia_${password}`).digest('hex');
}

// Helper to read and write database safely
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    return initializeDatabase();
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return initializeDatabase();
  }
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Add an audit log entry
function addAuditLog(userName: string, userRole: string, action: string, details: string) {
  const db = readDB();
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_name: userName || 'Petugas',
    user_role: userRole || 'resepsionis',
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  db.activity_logs = [newLog, ...(db.activity_logs || [])].slice(0, 500); // keep last 500
  writeDB(db);
}

// Initialize on start
initializeDatabase();

// ================= API ROUTES =================

// 1. Server time endpoint (Asia/Jakarta)
app.get('/api/time', (req, res) => {
  const timeData = getJakartaDate();
  res.json({ success: true, ...timeData });
});

// 2. School Settings
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json({ success: true, settings: db.settings });
});

app.put('/api/settings', (req, res) => {
  const db = readDB();
  const updated = { ...db.settings, ...req.body.settings };
  db.settings = updated;
  writeDB(db);

  addAuditLog(
    req.body.modified_by || 'Administrator',
    req.body.modified_role || 'admin',
    'Perbarui Profil Sekolah',
    'Memperbarui data identitas sekolah dan teks kebijakan.'
  );

  res.json({ success: true, settings: db.settings });
});

// 3. Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
  }

  const db = readDB();
  const hashed = hashPassword(password);
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password_hash === hashed
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak cocok.' });
  }

  const token = `token_${user.id}_${Date.now()}`;
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    created_at: user.created_at,
  };

  addAuditLog(user.name, user.role, 'Login Berhasil', `Pengguna ${user.name} masuk ke sistem sebagai ${user.role}.`);

  res.json({
    success: true,
    user: safeUser,
    token,
  });
});

// 4. Visitors & Visits
app.get('/api/visits', (req, res) => {
  const db = readDB();
  let visits = [...(db.visits || [])];

  const { search, category, status, date, date_from, date_to, event_id } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    visits = visits.filter(
      (v) =>
        v.guest_name.toLowerCase().includes(q) ||
        v.institution.toLowerCase().includes(q) ||
        v.visit_number.toLowerCase().includes(q) ||
        (v.phone && v.phone.includes(q)) ||
        (v.person_to_meet && v.person_to_meet.toLowerCase().includes(q))
    );
  }

  if (category && typeof category === 'string' && category !== 'Semua') {
    visits = visits.filter((v) => v.category === category);
  }

  if (status && typeof status === 'string' && status !== 'Semua') {
    visits = visits.filter((v) => v.status === status);
  }

  if (date && typeof date === 'string') {
    visits = visits.filter((v) => v.date === date);
  }

  if (date_from && typeof date_from === 'string') {
    visits = visits.filter((v) => v.date >= date_from);
  }

  if (date_to && typeof date_to === 'string') {
    visits = visits.filter((v) => v.date <= date_to);
  }

  if (event_id && typeof event_id === 'string' && event_id !== 'all') {
    visits = visits.filter((v) => v.event_id === event_id);
  }

  // Sort descending by date + check_in_time
  visits.sort((a, b) => {
    const timeA = `${a.date} ${a.check_in_time}`;
    const timeB = `${b.date} ${b.check_in_time}`;
    return timeB.localeCompare(timeA);
  });

  res.json({ success: true, visits, total: visits.length });
});

app.get('/api/visits/:id', (req, res) => {
  const db = readDB();
  const visit = db.visits.find((v: any) => v.id === req.params.id || v.visit_number === req.params.id);
  if (!visit) {
    return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' });
  }
  res.json({ success: true, visit });
});

// Self-service lookup for check-out by visitor
app.get('/api/visits/lookup/active', (req, res) => {
  const db = readDB();
  const q = String(req.query.query || '').trim().toLowerCase();
  if (!q) {
    return res.json({ success: true, visits: [] });
  }

  const activeVisits = (db.visits || []).filter(
    (v: any) =>
      v.status === 'active' &&
      (v.visit_number.toLowerCase().includes(q) ||
        v.guest_name.toLowerCase().includes(q) ||
        v.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')))
  );

  res.json({ success: true, visits: activeVisits });
});

// Record new visit
app.post('/api/visits', (req, res) => {
  const {
    guest_name,
    institution,
    phone,
    category,
    purpose,
    purpose_detail,
    person_to_meet,
    identity_number,
    notes,
    signature,
    event_id,
  } = req.body;

  if (!guest_name || !institution || !phone || !category || !purpose || !person_to_meet) {
    return res.status(400).json({
      success: false,
      message: 'Mohon lengkapi seluruh data wajib (Nama, Instansi, No HP, Kategori, Tujuan, Pihak yang Ditemui).',
    });
  }

  const db = readDB();
  const { dateStr, timeStr } = getJakartaDate();

  // Generate sequential unique visit number for the day
  const todayVisits = (db.visits || []).filter((v: any) => v.date === dateStr);
  const sequence = todayVisits.length + 1;
  const visitNumber = `EXC-${dateStr.replace(/-/g, '')}-${String(sequence).padStart(3, '0')}`;
  const visitId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const newVisit = {
    id: visitId,
    visit_number: visitNumber,
    date: dateStr,
    check_in_time: timeStr,
    check_out_time: null,
    duration_minutes: null,
    status: 'active',
    guest_name: guest_name.trim(),
    institution: institution.trim(),
    phone: phone.trim(),
    category,
    purpose,
    purpose_detail: purpose_detail ? purpose_detail.trim() : '',
    person_to_meet,
    identity_number: identity_number ? identity_number.trim() : '',
    notes: notes ? notes.trim() : '',
    signature: signature || null,
    event_id: event_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.visits = [newVisit, ...(db.visits || [])];

  // Update or insert visitor record
  const cleanPhone = phone.trim().replace(/\D/g, '');
  let visitor = (db.visitors || []).find(
    (v: any) => v.phone.replace(/\D/g, '') === cleanPhone || v.name.toLowerCase() === guest_name.trim().toLowerCase()
  );

  if (visitor) {
    visitor.total_visits = (visitor.total_visits || 1) + 1;
    visitor.last_visit_at = dateStr;
    visitor.institution = institution.trim();
  } else {
    visitor = {
      id: `vis_${Date.now()}`,
      name: guest_name.trim(),
      institution: institution.trim(),
      phone: phone.trim(),
      total_visits: 1,
      last_visit_at: dateStr,
      created_at: new Date().toISOString(),
    };
    db.visitors = [...(db.visitors || []), visitor];
  }

  writeDB(db);

  addAuditLog(
    'Pengunjung Mandiri / Resepsionis',
    'public',
    'Kunjungan Baru Dicatat',
    `Tamu ${newVisit.guest_name} (${newVisit.institution}) terdaftar dengan No: ${newVisit.visit_number}`
  );

  res.status(201).json({
    success: true,
    message: 'Data kunjungan berhasil dicatat. Selamat datang di SMP Alam Excellentia Pamekasan.',
    visit: newVisit,
  });
});

// Check-out visitor
app.post('/api/visits/:id/checkout', (req, res) => {
  const db = readDB();
  const visitIndex = db.visits.findIndex((v: any) => v.id === req.params.id || v.visit_number === req.params.id);

  if (visitIndex === -1) {
    return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' });
  }

  const visit = db.visits[visitIndex];
  if (visit.status === 'completed' && visit.check_out_time) {
    return res.json({
      success: true,
      message: `Tamu sudah check-out sebelumnya pada pukul ${visit.check_out_time}.`,
      visit,
    });
  }

  const { timeStr } = getJakartaDate();
  visit.check_out_time = timeStr;
  visit.status = 'completed';

  // Calculate duration
  try {
    const [inH, inM] = visit.check_in_time.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    let totalMinutes = outH * 60 + outM - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // overnight fallback
    visit.duration_minutes = Math.max(1, totalMinutes);
  } catch (e) {
    visit.duration_minutes = 1;
  }

  visit.updated_at = new Date().toISOString();
  db.visits[visitIndex] = visit;
  writeDB(db);

  addAuditLog(
    req.body.user_name || 'Petugas Resepsionis',
    req.body.user_role || 'resepsionis',
    'Pencatatan Jam Keluar',
    `Check-out tamu ${visit.guest_name} (${visit.visit_number}) pukul ${timeStr} (Durasi: ${visit.duration_minutes} menit).`
  );

  res.json({
    success: true,
    message: `Jam keluar tamu ${visit.guest_name} berhasil dicatat (${timeStr}).`,
    visit,
  });
});

// Update visit with audit reason
app.put('/api/visits/:id', (req, res) => {
  const db = readDB();
  const visitIndex = db.visits.findIndex((v: any) => v.id === req.params.id);

  if (visitIndex === -1) {
    return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' });
  }

  const existing = db.visits[visitIndex];
  const { reason, modified_by, ...updateFields } = req.body;

  const editLog = {
    modified_at: new Date().toISOString(),
    modified_by: modified_by || 'Admin',
    reason: reason || 'Koreksi data administratif',
    previous_state: { ...existing },
  };

  const updatedVisit = {
    ...existing,
    ...updateFields,
    updated_at: new Date().toISOString(),
    edit_history: [editLog, ...(existing.edit_history || [])],
  };

  db.visits[visitIndex] = updatedVisit;
  writeDB(db);

  addAuditLog(
    modified_by || 'Admin',
    'admin',
    'Koreksi Data Kunjungan',
    `Mengubah data kunjungan ${existing.visit_number} (${existing.guest_name}). Alasan: ${reason || 'Perbaikan input'}`
  );

  res.json({
    success: true,
    message: 'Data kunjungan berhasil diperbarui beserta catatan riwayat perubahan.',
    visit: updatedVisit,
  });
});

// Delete visit (admin only)
app.delete('/api/visits/:id', (req, res) => {
  const db = readDB();
  const visit = db.visits.find((v: any) => v.id === req.params.id);

  if (!visit) {
    return res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan.' });
  }

  db.visits = db.visits.filter((v: any) => v.id !== req.params.id);
  writeDB(db);

  addAuditLog(
    req.body.user_name || 'Admin',
    'admin',
    'Hapus Data Kunjungan',
    `Menghapus data kunjungan ${visit.visit_number} (${visit.guest_name} - ${visit.institution})`
  );

  res.json({ success: true, message: 'Data kunjungan berhasil dihapus.' });
});

// 5. Events & Dedicated Event Guestbooks
app.get('/api/events', (req, res) => {
  const db = readDB();
  const eventsWithCount = (db.events || []).map((ev: any) => {
    const attendeeCount = (db.visits || []).filter((v: any) => v.event_id === ev.id).length;
    return { ...ev, attendee_count: attendeeCount };
  });
  res.json({ success: true, events: eventsWithCount });
});

app.get('/api/events/:id', (req, res) => {
  const db = readDB();
  const event = (db.events || []).find((ev: any) => ev.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }
  const attendees = (db.visits || []).filter((v: any) => v.event_id === event.id);
  res.json({ success: true, event: { ...event, attendees, attendee_count: attendees.length } });
});

app.post('/api/events', (req, res) => {
  const { title, date, time_start, time_end, location, organizer_pic, description } = req.body;
  if (!title || !date || !location) {
    return res.status(400).json({ success: false, message: 'Nama kegiatan, tanggal, dan lokasi wajib diisi.' });
  }

  const db = readDB();
  const newEvent = {
    id: `evt_${Date.now()}`,
    title: title.trim(),
    date,
    time_start: time_start || '08:00',
    time_end: time_end || '12:00',
    location: location.trim(),
    organizer_pic: organizer_pic ? organizer_pic.trim() : 'Panitia Sekolah',
    description: description ? description.trim() : '',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  db.events = [newEvent, ...(db.events || [])];
  writeDB(db);

  addAuditLog(
    req.body.user_name || 'Admin',
    'admin',
    'Buat Kegiatan Baru',
    `Membuat buku tamu khusus kegiatan: "${newEvent.title}" (${newEvent.date})`
  );

  res.status(201).json({ success: true, message: 'Kegiatan berhasil ditambahkan.', event: newEvent });
});

app.put('/api/events/:id', (req, res) => {
  const db = readDB();
  const index = (db.events || []).findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }

  db.events[index] = { ...db.events[index], ...req.body, updated_at: new Date().toISOString() };
  writeDB(db);

  addAuditLog(
    req.body.user_name || 'Admin',
    'admin',
    'Perbarui Kegiatan',
    `Memperbarui rincian kegiatan: "${db.events[index].title}"`
  );

  res.json({ success: true, message: 'Kegiatan berhasil diperbarui.', event: db.events[index] });
});

app.delete('/api/events/:id', (req, res) => {
  const db = readDB();
  const event = (db.events || []).find((e: any) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }

  db.events = db.events.filter((e: any) => e.id !== req.params.id);
  writeDB(db);

  addAuditLog(
    req.body.user_name || 'Admin',
    'admin',
    'Hapus Kegiatan',
    `Menghapus kegiatan: "${event.title}"`
  );

  res.json({ success: true, message: 'Kegiatan berhasil dihapus.' });
});

// 6. Real-time Dashboard Statistics
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const { dateStr } = getJakartaDate();
  const [currentYear, currentMonth] = dateStr.split('-');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  const visits = db.visits || [];

  const visitsToday = visits.filter((v: any) => v.date === dateStr);
  const visitsMonth = visits.filter((v: any) => v.date.startsWith(monthPrefix));
  const visitsYear = visits.filter((v: any) => v.date.startsWith(currentYear));
  const activeNow = visits.filter((v: any) => v.status === 'active');

  // Breakdown by Category
  const categoryCounts: Record<string, number> = {};
  visits.forEach((v: any) => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  });

  // Breakdown by Purpose
  const purposeCounts: Record<string, number> = {};
  visits.forEach((v: any) => {
    purposeCounts[v.purpose] = (purposeCounts[v.purpose] || 0) + 1;
  });

  // Frequent visitors ranking
  const visitorCounts: Record<string, { name: string; institution: string; phone: string; count: number }> = {};
  visits.forEach((v: any) => {
    const key = `${v.guest_name.trim().toLowerCase()}_${v.institution.trim().toLowerCase()}`;
    if (!visitorCounts[key]) {
      visitorCounts[key] = {
        name: v.guest_name,
        institution: v.institution,
        phone: v.phone,
        count: 0,
      };
    }
    visitorCounts[key].count += 1;
  });

  const frequentVisitors = Object.values(visitorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // Daily Trend (Last 7 Days)
  const last7Days: { date: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateFormatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

    const dayName = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);

    const count = visits.filter((v: any) => v.date === dateFormatted).length;
    last7Days.push({ date: dateFormatted, label: dayName, count });
  }

  // Monthly Trend (Current Year)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyTrend = months.map((mName, idx) => {
    const mStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
    const count = visits.filter((v: any) => v.date.startsWith(mStr)).length;
    return { month: mName, code: mStr, count };
  });

  res.json({
    success: true,
    stats: {
      totalToday: visitsToday.length,
      totalMonth: visitsMonth.length,
      totalYear: visitsYear.length,
      activeNow: activeNow.length,
      totalAllTime: visits.length,
      categoryCounts,
      purposeCounts,
      frequentVisitors,
      dailyTrend: last7Days,
      monthlyTrend,
    },
  });
});

// 7. Activity Logs
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json({ success: true, logs: db.activity_logs || [] });
});

// 8. Database Backup & Restore
app.get('/api/backup/export', (req, res) => {
  const db = readDB();
  const { dateStr, timeStr } = getJakartaDate();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="backup_bukutamu_smpalam_${dateStr}_${timeStr.replace(':', '')}.json"`
  );
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/backup/restore', (req, res) => {
  const uploaded = req.body;
  if (!uploaded || !uploaded.visits || !uploaded.users) {
    return res.status(400).json({ success: false, message: 'Format berkas backup tidak valid.' });
  }

  writeDB(uploaded);
  addAuditLog(
    req.body.user_name || 'Admin',
    'admin',
    'Pulihkan Basis Data (Restore)',
    `Basis data berhasil dipulihkan dari backup. Total kunjungan: ${uploaded.visits.length}`
  );

  res.json({ success: true, message: 'Basis data berhasil dipulihkan secara menyeluruh.' });
});

// ================= FRONTEND MOUNTING =================
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Buku Tamu Digital SMP Alam Excellentia running on port ${PORT}`);
  });
}

startServer();
