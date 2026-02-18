export const RAMADHAN_START = new Date(2026, 1, 19);
export const RAMADHAN_END = new Date(2026, 2, 20);
export const KESISWAAN_NAME = "Amirah Risnawati, S.H., Gr";
export const KEPALA_SEKOLAH = "Masita Dasa, S.Sos., M.Pd.I., Gr";
export const PIN_GURU = "1234";
export const PIN_KESISWAAN = "5678";

export interface ClassData {
  id: string;
  name: string;
  teacher: string;
  students: string[];
}

export interface FormData {
  date: string;
  isHaid: boolean;
  puasa: string;
  sholatWajib: Record<string, boolean>;
  dzikir: boolean;
  tahajjud: boolean;
  takjil: boolean;
  sedekah: boolean;
  ceramah: boolean;
  tarawih: boolean;
  rawatib: number;
  silaturahim: boolean;
  tilawahQuran: boolean;
  tilawahJilid: boolean;
  birrul: boolean;
  dhuha: boolean;
}

export interface Submission extends FormData {
  id: number;
  studentName: string;
  classId?: string;
  className: string;
  timestamp: string;
}

export const DEFAULT_CLASSES: ClassData[] = [
  { id: '7A', name: '7 Al-Farabi', teacher: 'Ust. Abdullah', students: ['Ahmad', 'Budi', 'Citra', 'Doni'] },
  { id: '8A', name: '8 Al-Fatih', teacher: 'Usth. Siti Aminah', students: ['Fulan bin Fulan', 'Gita', 'Hadi', 'Indah'] },
  { id: '9A', name: '9 Al-Khawarizmi', teacher: 'Ust. Zulkifli', students: ['Kiki', 'Lina', 'Maman', 'Nina'] },
];

export const DEFAULT_FORM: Omit<FormData, 'date'> = {
  isHaid: false,
  puasa: 'Ya',
  sholatWajib: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
  dzikir: false,
  tahajjud: false,
  takjil: false,
  sedekah: false,
  ceramah: false,
  tarawih: false,
  rawatib: 0,
  silaturahim: false,
  tilawahQuran: false,
  tilawahJilid: false,
  birrul: false,
  dhuha: false,
};

export const generateDateRange = () => {
  const dates: Date[] = [];
  const currentDate = new Date(RAMADHAN_START);
  while (currentDate <= RAMADHAN_END) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};
