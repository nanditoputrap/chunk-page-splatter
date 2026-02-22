import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type AnnouncementPopupProps = {
  open: boolean;
  onClose: () => void;
};

type AnnouncementItem = {
  day: string;
  month: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon?: string;
  tone: 'school' | 'event' | 'holiday';
};

const announcements: AnnouncementItem[] = [
  {
    day: '23',
    month: 'FEB',
    title: 'Pesantren Ramadhan',
    subtitle: '23 - 25 Feb 2026',
    badge: 'Sekolah',
    tone: 'school',
  },
  {
    day: '02',
    month: 'MAR',
    title: 'Sumatif Tengah Semester',
    subtitle: '02 - 05 Mar 2026',
    badge: 'Sekolah',
    tone: 'school',
  },
  {
    day: '06',
    month: 'MAR',
    title: 'Buka Puasa Bersama',
    subtitle: 'Mulai 15:00 WITA',
    icon: '🌙',
    tone: 'event',
  },
  {
    day: '09',
    month: 'MAR',
    title: 'Libur Ramadhan',
    subtitle: '09 - 21 Mar 2026',
    badge: 'Libur',
    tone: 'holiday',
  },
  {
    day: '22',
    month: 'MAR',
    title: 'Libur Idul Fitri',
    subtitle: '22 - 27 Mar 2026',
    badge: 'Libur',
    tone: 'holiday',
  },
];

const toneClass: Record<AnnouncementItem['tone'], string> = {
  school: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-900',
  event: 'border-orange-200/80 bg-orange-50/70 text-orange-900',
  holiday: 'border-rose-200/80 bg-rose-50/70 text-rose-900',
};

const badgeClass: Record<AnnouncementItem['tone'], string> = {
  school: 'border-emerald-300/80 text-emerald-700',
  event: 'border-orange-300/80 text-orange-700',
  holiday: 'border-rose-300/80 text-rose-600',
};

const tileClass: Record<AnnouncementItem['tone'], string> = {
  school: 'from-emerald-500 to-emerald-600',
  event: 'from-orange-500 to-orange-500',
  holiday: 'from-rose-500 to-rose-500',
};

const AnnouncementPopup = ({ open, onClose }: AnnouncementPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    const currentOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const enterTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 220);

    return () => {
      window.clearTimeout(enterTimer);
      setIsVisible(false);
      document.body.style.overflow = currentOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[280] p-3 sm:p-6 flex items-center justify-center transition-all duration-300 ${isVisible ? 'bg-slate-950/45 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'}`}>
      <div className={`w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[1.75rem] bg-slate-100 shadow-2xl border border-white/40 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}>
        <div className="relative px-5 sm:px-7 py-6 sm:py-8 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-t-[1.75rem]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-emerald-800/45 hover:bg-emerald-900/50 transition flex items-center justify-center"
            aria-label="Tutup pengumuman"
            title="Tutup pengumuman"
          >
            <X size={22} />
          </button>
          <p className="text-center tracking-[0.18em] font-extrabold text-xs sm:text-sm opacity-90">PENGUMUMAN SEKOLAH</p>
          <h2 className="mt-3 text-center text-3xl sm:text-5xl font-black leading-tight">Jadwal Ramadhan & Libur Sekolah</h2>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          {announcements.map((item) => (
            <div key={item.title} className={`rounded-2xl border p-3 sm:p-4 ${toneClass[item.tone]}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-gradient-to-b ${tileClass[item.tone]} text-white shadow-lg flex flex-col justify-center items-center leading-none`}>
                  <span className="text-2xl sm:text-3xl font-black">{item.day}</span>
                  <span className="text-sm sm:text-base font-bold mt-0.5">{item.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">{item.title}</h3>
                  <p className="text-base sm:text-lg mt-0.5 opacity-75">{item.subtitle}</p>
                </div>
                {item.badge && (
                  <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-xl border text-sm font-bold ${badgeClass[item.tone]}`}>
                    {item.badge}
                  </span>
                )}
                {item.icon && <span className="text-2xl sm:text-3xl">{item.icon}</span>}
              </div>
              {item.badge && (
                <span className={`sm:hidden inline-flex mt-2 px-3 py-1 rounded-lg border text-xs font-bold ${badgeClass[item.tone]}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}

          <button
            onClick={onClose}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xl sm:text-2xl font-extrabold shadow-lg transition"
          >
            Mengerti
          </button>

          <p className="text-center text-slate-400 font-extrabold tracking-[0.2em] text-xs sm:text-sm">TAHUN AJARAN 2025/2026</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
