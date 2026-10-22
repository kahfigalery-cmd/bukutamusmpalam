import React, { useState, useEffect } from 'react';
import { User, Visit, SchoolSettings } from './types/guestbook';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { VisitorForm } from './components/VisitorForm';
import { VisitConfirmationModal } from './components/VisitConfirmationModal';
import { QuickCheckoutModal } from './components/QuickCheckoutModal';
import { AdminPortal } from './components/AdminPortal';
import { EventsView } from './components/EventsView';

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'form' | 'events' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getStoredUser());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmedVisit, setConfirmedVisit] = useState<Visit | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // School settings with nature defaults
  const [settings, setSettings] = useState<SchoolSettings>({
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
  });

  // Load school settings on start
  useEffect(() => {
    api.getSettings()
      .then((s) => {
        if (s) setSettings(s);
      })
      .catch((e) => console.warn('Using default settings fallback', e));

    // Check URL query parameters (e.g. ?event=evt_1 or ?form=true)
    const urlParams = new URLSearchParams(window.location.search);
    const eventParam = urlParams.get('event');
    if (eventParam) {
      setSelectedEventId(eventParam);
      setActiveView('form');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('admin');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveView('home');
  };

  const handleFormSuccess = (visit: Visit) => {
    setConfirmedVisit(visit);
    setActiveView('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          activeView={activeView}
          setActiveView={(view) => {
            if (view === 'checkout') {
              setIsCheckoutModalOpen(true);
            } else {
              if (view === 'form') setSelectedEventId(null);
              setActiveView(view);
            }
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenCheckoutModal={() => setIsCheckoutModalOpen(true)}
        />
      </div>

      {/* Main View Router */}
      <div className="flex-1">
        {activeView === 'home' && (
          <HomeHero
            settings={settings}
            onOpenForm={(eventId) => {
              setSelectedEventId(eventId || null);
              setActiveView('form');
            }}
            onOpenCheckout={() => setIsCheckoutModalOpen(true)}
            onOpenEventList={() => setActiveView('events')}
          />
        )}

        {activeView === 'form' && (
          <VisitorForm
            settings={settings}
            selectedEventId={selectedEventId}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setSelectedEventId(null);
              setActiveView('home');
            }}
          />
        )}

        {activeView === 'events' && (
          <EventsView
            settings={settings}
            onSelectEvent={(eventId) => {
              setSelectedEventId(eventId);
              setActiveView('form');
            }}
            onBack={() => setActiveView('home')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            settings={settings}
            onUpdateSettings={setSettings}
            onOpenEventForm={(eventId) => {
              setSelectedEventId(eventId);
              setActiveView('form');
            }}
          />
        )}
      </div>

      {/* Success Confirmation & Digital Badge Modal */}
      {confirmedVisit && (
        <VisitConfirmationModal
          visit={confirmedVisit}
          settings={settings}
          onClose={() => setConfirmedVisit(null)}
          onNewVisit={() => {
            setConfirmedVisit(null);
            setSelectedEventId(null);
            setActiveView('form');
          }}
        />
      )}

      {/* Quick Check-Out Modal */}
      {isCheckoutModalOpen && (
        <QuickCheckoutModal
          currentUser={currentUser}
          onClose={() => setIsCheckoutModalOpen(false)}
        />
      )}

    </div>
  );
}
