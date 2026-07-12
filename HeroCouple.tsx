// src/components/admin/AdminPanel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, Shield, Save, Settings, Calendar, CreditCard, 
  Bell, Image as ImageIcon, Plus, Trash2, LogOut, Check, Info, AlertTriangle,
  Users, MessageSquare, Heart, Cloud, Thermometer, ShieldCheck, Send
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, deleteDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, SITE_ID } from '../../lib/firebase/client';
import { SiteConfig, Photo, GuestbookMessage } from '../../types/invitation';
import { Announcement } from '../sections/AnnouncementsModal';
import { Banner } from '../ui/NotificationBanner';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
}

const ALLOWED_ADMINS = [
  'saputraamanah999@gmail.com',
  'iwayanpastika147@gmail.com',
  'saputra.developer@gmail.com',
];

export function AdminPanel({ isOpen, onClose, config }: AdminPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isPasscodeAuthed, setIsPasscodeAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'events' | 'finance' | 'announcements' | 'gallery' | 'rsvp' | 'guestbook' | 'weather' | 'notifications' | 'verified'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Local editable state loaded from config
  const [formData, setFormData] = useState<SiteConfig>({ ...config });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [wishes, setWishes] = useState<GuestbookMessage[]>([]);

  // Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnSender, setNewAnnSender] = useState<'mempelai' | 'keluarga' | 'developer'>('mempelai');

  // Photo Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoOrientation, setNewPhotoOrientation] = useState<'left' | 'right' | 'row3' | 'row4'>('left');

  // Weather Form State
  const [weatherForm, setWeatherForm] = useState({
    date: '', condition: 'Cerah Berawan', temp: 28, humidity: 62, wind: '12 km/h',
    hourlyForecasts: [
      { time: '09:00 WITA', temp: 27, condition: 'Cerah Berawan' },
      { time: '13:00 WITA', temp: 31, condition: 'Cerah Hangat' },
      { time: '17:00 WITA', temp: 28, condition: 'Cerah Berawan' },
      { time: '21:00 WITA', temp: 25, condition: 'Malam Sejuk' },
    ]
  });

  // Banner / Notification State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerContent, setNewBannerContent] = useState('');
  const [newBannerType, setNewBannerType] = useState<'info' | 'warning' | 'success'>('info');

  // Verified Users State
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !ALLOWED_ADMINS.includes(currentUser.email || '')) {
        setAuthError(`Akses Ditolak: Email ${currentUser.email} tidak terdaftar sebagai Administrator.`);
      } else {
        setAuthError('');
      }
    });
    return () => unsub();
  }, []);

  // Listen to announcements and gallery when open and authorized
  const isAuthorized = (user && ALLOWED_ADMINS.includes(user.email || '')) || isPasscodeAuthed;

  useEffect(() => {
    if (!isOpen || !isAuthorized) return;

    // Load Announcements
    const qAnn = query(collection(db, `sites/${SITE_ID}/announcements`), orderBy('createdAt', 'desc'));
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      const list: Announcement[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(list);
    });

    // Load Gallery Photos
    const qGal = query(collection(db, `sites/${SITE_ID}/gallery`), orderBy('order', 'asc'));
    const unsubGal = onSnapshot(qGal, (snap) => {
      const list: Photo[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Photo);
      });
      setPhotos(list);
    });

    // Load RSVPs
    const qRsvp = query(collection(db, `sites/${SITE_ID}/rsvp`), orderBy('createdAt', 'desc'));
    const unsubRsvp = onSnapshot(qRsvp, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRsvps(list);
    });

    // Load Wishes
    const qWish = query(collection(db, `sites/${SITE_ID}/guestbook`), orderBy('createdAt', 'desc'));
    const unsubWish = onSnapshot(qWish, (snap) => {
      const list: GuestbookMessage[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.name || 'Anonim',
          message: data.message || '',
          attendance: data.attendance || 'hadir',
          signature: data.signature,
          likesCount: data.likesCount || 0,
          createdAt: data.createdAt,
        });
      });
      setWishes(list);
    });

    // Load Weather
    const weatherRef = doc(db, `sites/${SITE_ID}/weather/main`);
    const unsubWeather = onSnapshot(weatherRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setWeatherForm({
          date: d.date || '',
          condition: d.condition || 'Cerah Berawan',
          temp: d.temp ?? 28,
          humidity: d.humidity ?? 62,
          wind: d.wind || '12 km/h',
          hourlyForecasts: d.hourlyForecasts || weatherForm.hourlyForecasts,
        });
      }
    }, () => {});

    // Load Banners
    const qBanners = query(collection(db, `sites/${SITE_ID}/banners`), orderBy('createdAt', 'desc'));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      const list: Banner[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Banner));
      setBanners(list);
    }, () => {});

    // Load Verified Users
    const qVerified = collection(db, `sites/${SITE_ID}/verifiedUsers`);
    const unsubVerified = onSnapshot(qVerified, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setVerifiedUsers(list);
    }, () => {});

    return () => {
      unsubAnn();
      unsubGal();
      unsubRsvp();
      unsubWish();
      unsubWeather();
      unsubBanners();
      unsubVerified();
    };
  }, [isOpen, isAuthorized]);

  // Keep state updated if original config props change
  useEffect(() => {
    if (config) {
      setFormData({ ...config });
    }
  }, [config]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google auth failed:", err);
      setAuthError("Google Sign-In diblokir atau gagal di browser/iframe Anda. Silakan gunakan Kode PIN Administrator di bawah.");
    }
  };

  const handlePasscodeSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '147258') {
      setIsPasscodeAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Kode PIN salah. Silakan coba lagi atau gunakan akun Google.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsPasscodeAuthed(false);
    setUser(null);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await setDoc(doc(db, `sites/${SITE_ID}/config/main`), formData);
      setSaveMessage('Konfigurasi utama berhasil disimpan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error("Error saving config:", error);
      setSaveMessage(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Announcements CRUD
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;

    try {
      await addDoc(collection(db, `sites/${SITE_ID}/announcements`), {
        title: newAnnTitle,
        content: newAnnContent,
        senderType: newAnnSender,
        createdAt: new Date().toISOString()
      });
      setNewAnnTitle('');
      setNewAnnContent('');
      setSaveMessage('Pengumuman berhasil ditambahkan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      alert(`Gagal menambah pengumuman: ${error.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await deleteDoc(doc(db, `sites/${SITE_ID}/announcements`, id));
    } catch (error: any) {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  // Gallery CRUD
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl) return;

    const maxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.order)) : 0;
    const newId = `photo_${Date.now()}`;

    try {
      await setDoc(doc(db, `sites/${SITE_ID}/gallery/${newId}`), {
        id: newId,
        url: newPhotoUrl,
        order: maxOrder + 1,
        orientation: newPhotoOrientation
      });
      setNewPhotoUrl('');
      setSaveMessage('Foto berhasil ditambahkan ke galeri!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      alert(`Gagal menambah foto: ${error.message}`);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    try {
      await deleteDoc(doc(db, `sites/${SITE_ID}/gallery`, id));
    } catch (error: any) {
      alert(`Gagal menghapus foto: ${error.message}`);
    }
  };

  const handleDeleteRsvp = async (id: string) => {
    if (!confirm('Hapus data RSVP ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, `sites/${SITE_ID}/rsvp`, id));
    } catch (error: any) {
      alert(`Gagal menghapus RSVP: ${error.message}`);
    }
  };

  const handleDeleteWish = async (id: string) => {
    if (!confirm('Hapus ucapan/doa restu ini dari publik?')) return;
    try {
      await deleteDoc(doc(db, `sites/${SITE_ID}/guestbook`, id));
    } catch (error: any) {
      alert(`Gagal menghapus ucapan: ${error.message}`);
    }
  };

  // Weather CRUD
  const handleSaveWeather = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await setDoc(doc(db, `sites/${SITE_ID}/weather/main`), {
        ...weatherForm,
        updatedAt: new Date().toISOString()
      });
      setSaveMessage('Data cuaca berhasil disimpan! Semua pengunjung akan melihat pembaruan.');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error: any) {
      setSaveMessage(`Gagal menyimpan cuaca: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHourly = (idx: number, field: string, value: string | number) => {
    const updated = [...weatherForm.hourlyForecasts];
    (updated as any)[idx][field] = value;
    setWeatherForm({ ...weatherForm, hourlyForecasts: updated });
  };

  // Banner CRUD
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerContent) return;
    try {
      await addDoc(collection(db, `sites/${SITE_ID}/banners`), {
        title: newBannerTitle,
        content: newBannerContent,
        type: newBannerType,
        senderName: user?.email || 'Developer',
        senderType: 'developer',
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewBannerTitle('');
      setNewBannerContent('');
      setSaveMessage('Banner notifikasi berhasil ditambahkan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      alert(`Gagal menambah banner: ${error.message}`);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Hapus banner notifikasi ini?')) return;
    try {
      await deleteDoc(doc(db, `sites/${SITE_ID}/banners`, id));
    } catch (error: any) {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const handleToggleBannerActive = async (id: string, currentActive: boolean) => {
    try {
      await setDoc(doc(db, `sites/${SITE_ID}/banners`, id), { active: !currentActive }, { merge: true });
    } catch (error: any) {
      alert(`Gagal mengubah: ${error.message}`);
    }
  };

  // Verified Users CRUD
  const handleToggleVerified = async (name: string, isCurrentlyVerified: boolean) => {
    try {
      if (isCurrentlyVerified) {
        const existing = verifiedUsers.find(v => v.name === name);
        if (existing) await deleteDoc(doc(db, `sites/${SITE_ID}/verifiedUsers`, existing.id));
      } else {
        await setDoc(doc(db, `sites/${SITE_ID}/verifiedUsers/${name.replace(/[^a-zA-Z0-9]/g, '_')}`), {
          name,
          approvedBy: user?.email || 'admin',
          approvedAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      alert(`Gagal: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d0309] border-2 border-[#C9A24B]/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-white">
        
        {/* Balinese Top Accent */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#C9A24B]" />
            <h2 className="font-serif text-lg font-black uppercase tracking-tight">Admin Control Panel</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Barrier Screen */}
        {!isAuthorized ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
            <Lock className="w-12 h-12 text-[#C9A24B]/70 mb-4 animate-pulse" />
            <h3 className="font-serif text-lg font-bold uppercase tracking-tight text-white mb-2">Autentikasi Diperlukan</h3>
            <p className="text-xs text-[#FDF6E9]/75 mb-6 leading-relaxed max-w-sm">
              Untuk melakukan perubahan data undangan pernikahan (Full-Stack), silakan masuk menggunakan akun Administrator terdaftar atau PIN Developer.
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white text-black font-sans font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-all cursor-pointer mb-6 active:scale-95 shadow-lg"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 0 1 8 12.57c0-3.3 2.67-5.97 5.991-5.97 1.44 0 2.76.513 3.801 1.5l2.97-2.97C18.91 3.321 16.59 2.2 13.991 2.2a9.78 9.78 0 0 0-9.75 9.8 9.78 9.78 0 0 0 9.75 9.8c5.441 0 9.741-3.9 9.741-9.8a8.3 8.3 0 0 0-.153-1.714H12.24z"/>
              </svg>
              <span>Masuk Dengan Google</span>
            </button>

            <div className="w-full flex items-center gap-3 my-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Atau PIN Developer</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <form onSubmit={handlePasscodeSignIn} className="w-full flex gap-2">
              <input 
                type="password"
                placeholder="Masukkan 6 Digit PIN Admin..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#C9A24B] outline-none text-center font-sans tracking-widest text-sm text-white"
              />
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C9A24B] font-sans font-black text-xs tracking-wider uppercase text-white cursor-pointer active:scale-95"
              >
                Masuk
              </button>
            </form>

            {authError && (
              <div className="mt-5 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-[10px] font-sans font-bold text-red-300 flex items-start gap-2 max-w-sm text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Admin user bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-sans font-bold uppercase text-[#C9A24B] tracking-wider">
                  Admin: {user ? user.email : 'Developer Mode'}
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1 text-[9px] font-sans font-black text-red-400 uppercase tracking-wider hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>

            {/* Quick action save notifications */}
            {saveMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs font-sans font-bold text-emerald-300 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saveMessage}</span>
              </motion.div>
            )}

            {/* Dashboard Tabs bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-white/5 mb-4 scrollbar-thin">
              {[
                { id: 'general', label: 'Umum', icon: Settings },
                { id: 'events', label: 'Acara', icon: Calendar },
                { id: 'finance', label: 'Kado', icon: CreditCard },
                { id: 'announcements', label: 'Kabar', icon: Bell },
                { id: 'gallery', label: 'Galeri', icon: ImageIcon },
                { id: 'rsvp', label: 'RSVP', icon: Users },
                { id: 'guestbook', label: 'Doa Restu', icon: MessageSquare },
                { id: 'weather', label: 'Cuaca', icon: Cloud },
                { id: 'notifications', label: 'Notifikasi', icon: Send },
                { id: 'verified', label: 'Terverifikasi', icon: ShieldCheck },
              ].map((tab) => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-sans font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-[#C9A24B]/15 border-[#C9A24B] text-[#C9A24B]' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: GENERAL CONFIG */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {activeTab === 'general' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/15 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold uppercase text-white leading-tight">Nikah Massal</p>
                        <p className="text-[9px] text-[#FDF6E9]/50 mt-0.5">Aktifkan 2 pasang mempelai</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={formData.isJointWedding || false}
                        onChange={(e) => setFormData({ ...formData, isJointWedding: e.target.checked })}
                        className="w-4.5 h-4.5 accent-[#C9A24B]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/15 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold uppercase text-red-300 leading-tight">Maintenance</p>
                        <p className="text-[9px] text-[#FDF6E9]/50 mt-0.5">Kunci akses seluruh tamu</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={formData.maintenanceMode || false}
                        onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                        className="w-4.5 h-4.5 accent-red-500"
                      />
                    </label>
                  </div>

                  {/* Prewedding background link */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">URL Gambar Sampul (Prewedding)</span>
                    <input 
                      type="text"
                      value={formData.coverImageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-[#C9A24B] outline-none"
                    />
                  </div>

                  {/* Couple 1: Putu & Widya */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Data Mempelai 1</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Lengkap Pria</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.fullName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, fullName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Panggilan Pria</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.nickname}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, nickname: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Anak Ke- (Pria)</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.childInfo || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, childInfo: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Instagram Pria</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.instagram || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, instagram: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Ayah (Pria)</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.fatherName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, fatherName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Ibu (Pria)</span>
                        <input 
                          type="text"
                          value={formData.couple.groom.motherName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, groom: { ...formData.couple.groom, motherName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5 my-1" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Lengkap Wanita</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.fullName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, fullName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Panggilan Wanita</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.nickname}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, nickname: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Anak Ke- (Wanita)</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.childInfo || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, childInfo: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Instagram Wanita</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.instagram || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, instagram: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Ayah (Wanita)</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.fatherName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, fatherName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Ibu (Wanita)</span>
                        <input 
                          type="text"
                          value={formData.couple.bride.motherName}
                          onChange={(e) => setFormData({
                            ...formData,
                            couple: { ...formData.couple, bride: { ...formData.couple.bride, motherName: e.target.value } }
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Couple 2: Gede Julianto & Elyana */}
                  {formData.isJointWedding && formData.couple2 && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5">
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Data Mempelai 2</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Lengkap Pria</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.fullName}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, fullName: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Panggilan Pria</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.nickname}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, nickname: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Anak Ke- (Pria)</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.childInfo || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, childInfo: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Instagram Pria</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.instagram || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, instagram: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Ayah (Pria)</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.fatherName}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, fatherName: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Ibu (Pria)</span>
                          <input 
                            type="text"
                            value={formData.couple2.groom.motherName}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                groom: { ...formData.couple2!.groom, motherName: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="h-[1px] bg-white/5 my-1" />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Lengkap Wanita</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.fullName}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                bride: { ...formData.couple2!.bride, fullName: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Panggilan Wanita</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.nickname}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                bride: { ...formData.couple2!.bride, nickname: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Anak Ke- (Wanita)</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.childInfo || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                bride: { ...formData.couple2!.bride, childInfo: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Instagram Wanita</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.instagram || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                bride: { ...formData.couple2!.bride, instagram: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Ayah (Wanita)</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.fatherName}
                            onChange={(e) => setFormData({
                              ...formData,
                              couple2: {
                                ...formData.couple2!,
                                bride: { ...formData.couple2!.bride, fatherName: e.target.value }
                              }
                            })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/60">Nama Ibu (Wanita)</span>
                          <input 
                            type="text"
                            value={formData.couple2.bride.motherName || ''}
                            onChange={(e) => {
                              const mother = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                couple2: {
                                  ...prev.couple2!,
                                  bride: { ...prev.couple2!.bride, motherName: mother }
                                }
                              }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              )}

              {/* TAB CONTENT: EVENTS SCHEDULE */}
              {activeTab === 'events' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* Event 1 details */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">
                      {formData.isJointWedding ? "Acara Pawiwahan I" : "Upacara Pawiwahan"}
                    </h4>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Waktu Mulai (Format ISO)</span>
                      <input 
                        type="text"
                        value={formData.event.date}
                        onChange={(e) => setFormData({
                          ...formData,
                          event: { ...formData.event, date: e.target.value }
                        })}
                        placeholder="YYYY-MM-DDTHH:MM:SS+08:00"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none focus:border-[#C9A24B]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Teks Waktu (Tampil di Undangan)</span>
                      <input 
                        type="text"
                        value={formData.event.time}
                        onChange={(e) => setFormData({
                          ...formData,
                          event: { ...formData.event, time: e.target.value }
                        })}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none focus:border-[#C9A24B]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Nama Tempat</span>
                      <input 
                        type="text"
                        value={formData.event.locationName}
                        onChange={(e) => setFormData({
                          ...formData,
                          event: { ...formData.event, locationName: e.target.value }
                        })}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Alamat Lengkap</span>
                      <textarea 
                        rows={2}
                        value={formData.event.address}
                        onChange={(e) => setFormData({
                          ...formData,
                          event: { ...formData.event, address: e.target.value }
                        })}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Tautan Google Maps</span>
                      <input 
                        type="text"
                        value={formData.event.mapsExternalUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          event: { ...formData.event, mapsExternalUrl: e.target.value }
                        })}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Event 2 details (Joint wedding only) */}
                  {formData.isJointWedding && formData.event2 && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5">
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Acara Pawiwahan II</h4>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Waktu Mulai (Format ISO)</span>
                        <input 
                          type="text"
                          value={formData.event2.date}
                          onChange={(e) => setFormData({
                            ...formData,
                            event2: { ...formData.event2!, date: e.target.value }
                          })}
                          placeholder="YYYY-MM-DDTHH:MM:SS+08:00"
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Teks Waktu (Tampil di Undangan)</span>
                        <input 
                          type="text"
                          value={formData.event2.time}
                          onChange={(e) => setFormData({
                            ...formData,
                            event2: { ...formData.event2!, time: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Tempat</span>
                        <input 
                          type="text"
                          value={formData.event2.locationName}
                          onChange={(e) => setFormData({
                            ...formData,
                            event2: { ...formData.event2!, locationName: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Alamat Lengkap</span>
                        <textarea 
                          rows={2}
                          value={formData.event2.address}
                          onChange={(e) => setFormData({
                            ...formData,
                            event2: { ...formData.event2!, address: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Tautan Google Maps</span>
                        <input 
                          type="text"
                          value={formData.event2.mapsExternalUrl}
                          onChange={(e) => setFormData({
                            ...formData,
                            event2: { ...formData.event2!, mapsExternalUrl: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reception shared details */}
                  {formData.reception && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5">
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Acara Resepsi Pernikahan</h4>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Waktu Mulai (Format ISO)</span>
                        <input 
                          type="text"
                          value={formData.reception.date}
                          onChange={(e) => setFormData({
                            ...formData,
                            reception: { ...formData.reception!, date: e.target.value }
                          })}
                          placeholder="YYYY-MM-DDTHH:MM:SS+08:00"
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Teks Waktu (Tampil di Undangan)</span>
                        <input 
                          type="text"
                          value={formData.reception.time}
                          onChange={(e) => setFormData({
                            ...formData,
                            reception: { ...formData.reception!, time: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Nama Tempat</span>
                        <input 
                          type="text"
                          value={formData.reception.locationName}
                          onChange={(e) => setFormData({
                            ...formData,
                            reception: { ...formData.reception!, locationName: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Alamat Lengkap</span>
                        <textarea 
                          rows={2}
                          value={formData.reception.address}
                          onChange={(e) => setFormData({
                            ...formData,
                            reception: { ...formData.reception!, address: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Tautan Google Maps</span>
                        <input 
                          type="text"
                          value={formData.reception.mapsExternalUrl}
                          onChange={(e) => setFormData({
                            ...formData,
                            reception: { ...formData.reception!, mapsExternalUrl: e.target.value }
                          })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Waktu & Lokasi'}</span>
                  </button>
                </div>
              )}

              {/* TAB CONTENT: FINANCIALS & GIFT CARDS */}
              {activeTab === 'finance' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* QRIS Link */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">URL Gambar QRIS</span>
                    <input 
                      type="text"
                      value={formData.qrisImageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, qrisImageUrl: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-[#C9A24B] outline-none"
                    />
                  </div>

                  {/* Bank Accounts */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Rekening Bank Transfer</h4>
                    
                    {formData.bankAccounts.map((card, index) => (
                      <div key={index} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[10px] font-sans font-bold text-[#C9A24B] tracking-wider uppercase">
                          <span>Rekening #{index + 1}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-white/50">Nama Bank</span>
                            <input 
                              type="text"
                              value={card.bank}
                              onChange={(e) => {
                                const newAccounts = [...formData.bankAccounts];
                                newAccounts[index].bank = e.target.value;
                                setFormData({ ...formData, bankAccounts: newAccounts });
                              }}
                              className="px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-white/50">Nomor Rekening</span>
                            <input 
                              type="text"
                              value={card.number}
                              onChange={(e) => {
                                const newAccounts = [...formData.bankAccounts];
                                newAccounts[index].number = e.target.value;
                                setFormData({ ...formData, bankAccounts: newAccounts });
                              }}
                              className="px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-white/50">Pemilik Rekening</span>
                          <input 
                            type="text"
                            value={card.holder}
                            onChange={(e) => {
                              const newAccounts = [...formData.bankAccounts];
                              newAccounts[index].holder = e.target.value;
                              setFormData({ ...formData, bankAccounts: newAccounts });
                            }}
                            className="px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Rekening & QRIS'}</span>
                  </button>
                </div>
              )}

              {/* TAB CONTENT: ANNOUNCEMENTS MANAGER */}
              {activeTab === 'announcements' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  
                  {/* Add Announcement Form */}
                  <form onSubmit={handleAddAnnouncement} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Tambah Kabar/Pengumuman</h4>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Judul Kabar</span>
                      <input 
                        type="text"
                        placeholder="Contoh: Info Lokasi Parkir Tambahan"
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Isi Pengumuman</span>
                      <textarea 
                        rows={3}
                        placeholder="Tulis pengumuman penting di sini..."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Kategori Pengirim</span>
                        <select 
                          value={newAnnSender}
                          onChange={(e) => setNewAnnSender(e.target.value as any)}
                          className="px-2.5 py-2 rounded-lg bg-[#14020f] border border-white/10 text-xs outline-none text-white cursor-pointer"
                        >
                          <option value="mempelai">Dari Mempelai</option>
                          <option value="keluarga">Dari Keluarga</option>
                          <option value="developer">Saputra Developer (Verified)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-[10px] uppercase tracking-wider text-white cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Kirim Kabar</span>
                      </button>
                    </div>
                  </form>

                  {/* List of announcements */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Kabar Terkirim ({announcements.length})</span>
                    
                    {announcements.length === 0 ? (
                      <p className="text-xs text-white/50 py-4 text-center">Belum ada pengumuman.</p>
                    ) : (
                      announcements.map((ann) => (
                        <div key={ann.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                ann.senderType === 'developer' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-[#C9A24B]'
                              }`}>
                                {ann.senderType}
                              </span>
                              <h5 className="font-sans font-bold text-xs text-white truncate uppercase">{ann.title}</h5>
                            </div>
                            <p className="text-[10px] text-white/70 line-clamp-2 leading-relaxed">{ann.content}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer self-center"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GALLERY PHOTOS */}
              {activeTab === 'gallery' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* Add Photo URL */}
                  <form onSubmit={handleAddPhoto} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Tambah Foto Galeri</h4>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Tautan Gambar (URL)</span>
                      <input 
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Orientasi Tampilan</span>
                        <select 
                          value={newPhotoOrientation}
                          onChange={(e) => setNewPhotoOrientation(e.target.value as any)}
                          className="px-2.5 py-2 rounded-lg bg-[#14020f] border border-white/10 text-xs outline-none text-white cursor-pointer"
                        >
                          <option value="left">Baris 1 (Miring Kiri)</option>
                          <option value="right">Baris 2 (Miring Kanan)</option>
                          <option value="row3">Baris 3 (Miring Kiri)</option>
                          <option value="row4">Baris 4 (Miring Kanan)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-[10px] uppercase tracking-wider text-white cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sematkan Foto</span>
                      </button>
                    </div>
                  </form>

                  {/* List of photos */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Koleksi Foto ({photos.length})</span>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((ph) => (
                        <div key={ph.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black">
                          <img 
                            src={ph.url} 
                            alt="Gallery item" 
                            className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => handleDeletePhoto(ph.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-500/80 text-white cursor-pointer transition-all active:scale-90"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono text-[#C9A24B] font-bold uppercase">
                            Baris {ph.orientation === 'left' ? '1' : ph.orientation === 'right' ? '2' : ph.orientation === 'row3' ? '3' : '4'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: RSVP MANAGER */}
              {activeTab === 'rsvp' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* Summary card */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2.5">
                    <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Ringkasan Konfirmasi RSVP</h4>
                    <div className="grid grid-cols-2 gap-3.5 mt-1">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Total Pengirim</span>
                        <p className="text-xl font-serif font-black text-white mt-1">{rsvps.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#C9A24B]/10 border border-[#C9A24B]/15">
                        <span className="text-[9px] text-[#C9A24B]/70 uppercase tracking-wider font-semibold">Total Tamu Datang</span>
                        <p className="text-xl font-serif font-black text-[#C9A24B] mt-1">
                          {rsvps.filter(r => r.attendance === 'hadir').reduce((acc, r) => acc + (Number(r.totalGuest) || 1), 0)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-1 text-[10px]">
                      <div className="py-2.5 px-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold uppercase">
                        Hadir: {rsvps.filter(r => r.attendance === 'hadir').length}
                      </div>
                      <div className="py-2.5 px-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold uppercase">
                        Tidak: {rsvps.filter(r => r.attendance === 'tidak').length}
                      </div>
                      <div className="py-2.5 px-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-bold uppercase">
                        Ragu: {rsvps.filter(r => r.attendance === 'ragu').length}
                      </div>
                    </div>
                  </div>

                  {/* List of RSVPs */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Daftar Tamu RSVP ({rsvps.length})</span>
                    
                    <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {rsvps.length === 0 ? (
                        <div className="text-center py-8 text-white/45 text-xs font-medium font-sans">Belum ada RSVP masuk.</div>
                      ) : (
                        rsvps.map((r, idx) => (
                          <div key={r.id || idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-xs font-black text-white truncate max-w-[180px] uppercase tracking-wide">{r.guestName}</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-sans font-black uppercase px-2 py-0.5 rounded-full ${
                                  r.attendance === 'hadir' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                  r.attendance === 'tidak' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                                  'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {r.attendance === 'hadir' ? `Hadir (${r.totalGuest || 1} Tamu)` : r.attendance === 'tidak' ? 'Absen' : 'Ragu-ragu'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteRsvp(r.id)}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 cursor-pointer active:scale-95 transition-all"
                              title="Hapus RSVP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GUESTBOOK WISHES MANAGER */}
              {activeTab === 'guestbook' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  {/* List of Wishes */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Daftar Doa Restu ({wishes.length})</span>
                      <span className="text-[9px] font-sans font-bold text-white/50 uppercase">Total Suka: {wishes.reduce((acc, w) => acc + (w.likesCount || 0), 0)} ❤️</span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto pr-1">
                      {wishes.length === 0 ? (
                        <div className="text-center py-8 text-white/45 text-xs font-medium font-sans">Belum ada ucapan tertulis.</div>
                      ) : (
                        wishes.map((w, idx) => (
                          <div key={w.id || idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-2 relative">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-black text-amber-200 uppercase tracking-wide">{w.name}</span>
                                <span className="text-[8px] font-sans text-white/40 uppercase">Kehadiran: {w.attendance === 'hadir' ? 'Hadir' : w.attendance === 'tidak' ? 'Absen' : 'Ragu'}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteWish(w.id)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 cursor-pointer active:scale-95 transition-all"
                                title="Hapus ucapan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <p className="text-xs text-white/80 leading-relaxed font-sans line-clamp-3">{w.message}</p>
                            
                            {w.signature && (
                              <div className="bg-[#030003]/60 border border-white/5 rounded-lg p-1.5 flex items-center justify-center max-w-[80px] h-8 mt-1 overflow-hidden">
                                <img src={w.signature} alt="Sign" className="max-h-6 object-contain invert" />
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-[8px] text-white/40 font-semibold font-sans mt-1">
                              <Heart className="w-2.5 h-2.5 text-[#C9A24B] fill-[#C9A24B]/20" />
                              <span>{w.likesCount || 0} orang menyukai doa ini</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* TAB CONTENT: WEATHER MANAGEMENT */}
              {activeTab === 'weather' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3.5">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Atur Prakiraan Cuaca</h4>
                    </div>
                    <p className="text-[9px] text-white/50 leading-relaxed">Data cuaca akan ditampilkan secara realtime ke semua pengunjung website melalui Firebase.</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Tanggal</span>
                        <input type="date" value={weatherForm.date} onChange={(e) => setWeatherForm({ ...weatherForm, date: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none text-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Kondisi Utama</span>
                        <select value={weatherForm.condition} onChange={(e) => setWeatherForm({ ...weatherForm, condition: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-[#14020f] border border-white/10 text-xs outline-none text-white cursor-pointer">
                          <option value="Cerah Berawan">Cerah Berawan</option>
                          <option value="Cerah Hangat">Cerah Hangat</option>
                          <option value="Malam Sejuk">Malam Sejuk</option>
                          <option value="Hujan Ringan">Hujan Ringan</option>
                          <option value="Berawan Tebal">Berawan Tebal</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Suhu (°C)</span>
                        <input type="number" value={weatherForm.temp} onChange={(e) => setWeatherForm({ ...weatherForm, temp: Number(e.target.value) })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none text-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Kelembaban (%)</span>
                        <input type="number" value={weatherForm.humidity} onChange={(e) => setWeatherForm({ ...weatherForm, humidity: Number(e.target.value) })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none text-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Angin</span>
                        <input type="text" value={weatherForm.wind} onChange={(e) => setWeatherForm({ ...weatherForm, wind: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none text-white" />
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5 my-1" />
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Prakiraan Per Jam</span>

                    {weatherForm.hourlyForecasts.map((h, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-3 items-end p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-white/40 uppercase">Waktu</span>
                          <input type="text" value={h.time} onChange={(e) => updateHourly(idx, 'time', e.target.value)}
                            className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] outline-none text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-white/40 uppercase">Suhu</span>
                          <input type="number" value={h.temp} onChange={(e) => updateHourly(idx, 'temp', Number(e.target.value))}
                            className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] outline-none text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-white/40 uppercase">Kondisi</span>
                          <input type="text" value={h.condition} onChange={(e) => updateHourly(idx, 'condition', e.target.value)}
                            className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] outline-none text-white" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleSaveWeather} disabled={isSaving}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all cursor-pointer">
                    <Cloud className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan & Terapkan Cuaca'}</span>
                  </button>
                </div>
              )}

              {/* TAB CONTENT: NOTIFICATION BANNERS */}
              {activeTab === 'notifications' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  <form onSubmit={handleAddBanner} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-400" />
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Kirim Banner Notifikasi</h4>
                    </div>
                    <p className="text-[9px] text-white/50 leading-relaxed">Banner akan muncul di bagian atas website semua pengunjung secara realtime via Firebase.</p>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Judul Notifikasi</span>
                      <input type="text" placeholder="Contoh: Informasi Parkir Tambahan" value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/60">Isi Pesan</span>
                      <textarea rows={2} placeholder="Tulis isi notifikasi..." value={newBannerContent} onChange={(e) => setNewBannerContent(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/60">Tipe Banner</span>
                        <select value={newBannerType} onChange={(e) => setNewBannerType(e.target.value as any)}
                          className="px-2.5 py-2 rounded-lg bg-[#14020f] border border-white/10 text-xs outline-none text-white cursor-pointer">
                          <option value="info">Info (Biru)</option>
                          <option value="warning">Peringatan (Kuning)</option>
                          <option value="success">Berhasil (Hijau)</option>
                        </select>
                      </div>
                      <button type="submit"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#C9A24B] hover:bg-[#A37E33] font-sans font-black text-[10px] uppercase tracking-wider text-white cursor-pointer active:scale-95">
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Banner</span>
                      </button>
                    </div>
                  </form>

                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">Banner Aktif ({banners.filter(b => b.active).length})</span>
                    <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {banners.length === 0 ? (
                        <p className="text-xs text-white/50 py-4 text-center">Belum ada banner notifikasi.</p>
                      ) : (
                        banners.map((b) => (
                          <div key={b.id} className={`p-3.5 rounded-xl border flex justify-between items-start gap-3 ${b.active ? 'bg-white/[0.02] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-50'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  b.type === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                                  b.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>{b.type}</span>
                                <h5 className="font-sans font-bold text-xs text-white truncate uppercase">{b.title}</h5>
                                {!b.active && <span className="text-[8px] text-red-400 font-bold">NONAKTIF</span>}
                              </div>
                              <p className="text-[10px] text-white/70 line-clamp-2 leading-relaxed">{b.content}</p>
                              <p className="text-[8px] text-white/30 mt-1">dari {b.senderName || 'Admin'}</p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button onClick={() => handleToggleBannerActive(b.id, b.active)}
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-all text-[8px] font-bold uppercase"
                                title={b.active ? 'Nonaktifkan' : 'Aktifkan'}>
                                {b.active ? 'On' : 'Off'}
                              </button>
                              <button onClick={() => handleDeleteBanner(b.id)}
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/60 cursor-pointer transition-all"
                                title="Hapus">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: VERIFIED USERS */}
              {activeTab === 'verified' && (
                <div className="flex flex-col gap-5 text-left pb-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <h4 className="text-[11px] font-sans font-black uppercase text-amber-200 tracking-wider">Kelola Pengguna Terverifikasi</h4>
                    </div>
                    <p className="text-[9px] text-white/50 leading-relaxed">
                      Pengunjung yang terverifikasi akan mendapatkan lencana centang biru di Buku Tamu. Developer Saputra otomatis terverifikasi.
                    </p>
                  </div>

                  {/* Currently verified users */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 font-sans">
                      Terverifikasi ({verifiedUsers.length})
                    </span>
                    {verifiedUsers.length === 0 ? (
                      <p className="text-xs text-white/40 py-3 text-center">Belum ada pengguna terverifikasi.</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {verifiedUsers.map((v) => (
                          <div key={v.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 40 40" fill="#0095F6" className="shrink-0">
                                <path fillRule="evenodd" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"/>
                              </svg>
                              <span className="text-xs font-black text-blue-300 uppercase tracking-wide">{v.name}</span>
                            </div>
                            <button onClick={() => handleToggleVerified(v.name, true)}
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer transition-all text-[9px] font-bold uppercase"
                              title="Cabut verifikasi">
                              Cabut
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Guestbook names available for verification */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C9A24B] font-sans">
                      Daftar Tamu dari Buku Tamu ({wishes.length})
                    </span>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {wishes.length === 0 ? (
                        <p className="text-xs text-white/40 py-3 text-center">Belum ada tamu.</p>
                      ) : (
                        wishes.map((w) => {
                          const isVerified = verifiedUsers.some(v => v.name === w.name);
                          return (
                            <div key={w.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-black text-white/80 uppercase tracking-wide truncate">{w.name}</span>
                                {isVerified && (
                                  <svg width="12" height="12" viewBox="0 0 40 40" fill="#0095F6" className="shrink-0">
                                    <path fillRule="evenodd" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"/>
                                  </svg>
                                )}
                              </div>
                              <button onClick={() => handleToggleVerified(w.name, isVerified)}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-all text-[9px] font-bold uppercase shrink-0 ${
                                  isVerified
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:border-[#C9A24B]/40 hover:text-[#C9A24B]'
                                }`}>
                                {isVerified ? 'Terverifikasi' : 'Verifikasi'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
