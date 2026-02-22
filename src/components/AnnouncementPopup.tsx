import { useEffect } from 'react';
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
    subtitle: 'Mulai 17:00 WIB',
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
  useEffect(() => {
    if (!open) return;
    const currentOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = currentOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/45 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.25rem] bg-slate-100 shadow-2xl border border-white/40">
        <div className="relative px-6 sm:px-10 py-8 sm:py-12 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-t-[2.25rem]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-14 h-14 rounded-full bg-emerald-800/45 hover:bg-emerald-900/50 transition flex items-center justify-center"
            aria-label="Tutup pengumuman"
            title="Tutup pengumuman"
          >
            <X size={30} />
          </button>
          <p className="text-center tracking-[0.18em] font-extrabold text-lg sm:text-4xl/none opacity-90">PENGUMUMAN SEKOLAH</p>
          <h2 className="mt-4 text-center text-4xl sm:text-6xl font-black leading-tight">Jadwal Ramadhan & Libur Sekolah</h2>
        </div>

        <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          {announcements.map((item) => (
            <div key={item.title} className={`rounded-3xl border p-4 sm:p-5 ${toneClass[item.tone]}`}>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-b ${tileClass[item.tone]} text-white shadow-lg flex flex-col justify-center items-center leading-none`}>
                  <span className="text-5xl font-black">{item.day}</span>
                  <span className="text-2xl font-bold mt-1">{item.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-3xl sm:text-4xl font-extrabold leading-snug">{item.title}</h3>
                  <p className="text-2xl sm:text-3xl mt-1 opacity-75">{item.subtitle}</p>
                </div>
                {item.badge && (
                  <span className={`hidden sm:inline-flex px-5 py-3 rounded-2xl border text-2xl font-bold ${badgeClass[item.tone]}`}>
                    {item.badge}
                  </span>
                )}
                {item.icon && <span className="text-4xl sm:text-5xl">{item.icon}</span>}
              </div>
              {item.badge && (
                <span className={`sm:hidden inline-flex mt-3 px-4 py-2 rounded-xl border text-base font-bold ${badgeClass[item.tone]}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}

          <button
            onClick={onClose}
            className="w-full py-4 sm:py-5 rounded-3xl bg-emerald-700 hover:bg-emerald-800 text-white text-3xl sm:text-4xl font-extrabold shadow-lg transition"
          >
            Mengerti
          </button>

          <p className="text-center text-slate-400 font-extrabold tracking-[0.2em] text-lg sm:text-2xl">TAHUN AJARAN 2025/2026</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
