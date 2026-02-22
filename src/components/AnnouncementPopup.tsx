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
  const ANIMATION_MS = 280;
  const ENTER_DELAY_MS = 120;
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    const currentOverflow = document.body.style.overflow;
    let enterTimer: number | null = null;
    let leaveTimer: number | null = null;

    if (open) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      enterTimer = window.setTimeout(() => {
        setIsVisible(true);
      }, ENTER_DELAY_MS);
    } else {
      setIsVisible(false);
      leaveTimer = window.setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = currentOverflow;
      }, ANIMATION_MS);
    }

    return () => {
      if (enterTimer) window.clearTimeout(enterTimer);
      if (leaveTimer) window.clearTimeout(leaveTimer);
      document.body.style.overflow = currentOverflow;
    };
  }, [open, ANIMATION_MS, ENTER_DELAY_MS]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[280] p-2 sm:p-4 flex items-center justify-center transition-all duration-300 ${isVisible ? 'bg-slate-950/45 backdrop-blur-sm' : 'bg-slate-950/0 backdrop-blur-none'}`}>
      <div className={`w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-2xl border border-white/40 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}>
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-t-[1.5rem]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-emerald-800/45 hover:bg-emerald-900/50 transition flex items-center justify-center"
            aria-label="Tutup pengumuman"
            title="Tutup pengumuman"
          >
            <X size={20} />
          </button>
          <p className="text-center tracking-[0.16em] font-extrabold text-[10px] sm:text-xs opacity-90">PENGUMUMAN SEKOLAH</p>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-black leading-tight">Jadwal Ramadhan & Libur Sekolah</h2>
        </div>

        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {announcements.map((item) => (
            <div key={item.title} className={`rounded-xl border p-2.5 sm:p-3 ${toneClass[item.tone]}`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b ${tileClass[item.tone]} text-white shadow-lg flex flex-col justify-center items-center leading-none`}>
                  <span className="text-lg sm:text-xl font-black">{item.day}</span>
                  <span className="text-[10px] sm:text-xs font-bold mt-0.5">{item.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-extrabold leading-tight">{item.title}</h3>
                  <p className="text-xs sm:text-sm mt-0.5 opacity-75 leading-tight">{item.subtitle}</p>
                </div>
                {item.badge && (
                  <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${badgeClass[item.tone]}`}>
                    {item.badge}
                  </span>
                )}
                {item.icon && <span className="text-xl sm:text-2xl">{item.icon}</span>}
              </div>
              {item.badge && (
                <span className={`sm:hidden inline-flex mt-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeClass[item.tone]}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}

          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-lg sm:text-xl font-extrabold shadow-lg transition"
          >
            Mengerti
          </button>

          <p className="text-center text-slate-400 font-extrabold tracking-[0.18em] text-[10px] sm:text-xs">TAHUN AJARAN 2025/2026</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
