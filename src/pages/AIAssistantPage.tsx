import { FormEvent, useMemo, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';
import { Submission } from '@/lib/constants';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const normalize = (text: string) => text.toLowerCase().trim();

const AIAssistantPage = () => {
  const { schoolData, setSchoolData, submissions } = useAmaliyah();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: [
        'Asisten aktif. Coba perintah:',
        '- cari siswa sulaiman',
        '- tampilkan siswa kelas 8A2',
        '- tampilkan data harian siswa Nadhifa',
        '- tambah siswa NAMA ke kelas 8A2',
        '- hapus siswa NAMA dari kelas 8A2',
        '- ganti nama siswa LAMA jadi BARU di kelas 8A2',
      ].join('\n'),
    },
  ]);

  const classMap = useMemo(() => {
    const map = new Map<string, typeof schoolData[number]>();
    schoolData.forEach((cls) => map.set(cls.id.toLowerCase(), cls));
    return map;
  }, [schoolData]);

  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const findStudentDaily = (studentName: string, date?: string) => {
    const filtered = submissions.filter((s) => normalize(s.studentName) === normalize(studentName));
    if (filtered.length === 0) return null;
    let pick: Submission | undefined;
    if (date) pick = filtered.find((s) => s.date === date);
    if (!pick) {
      pick = [...filtered].sort((a, b) => b.date.localeCompare(a.date))[0];
    }
    return pick || null;
  };

  const runCommand = (raw: string) => {
    const text = raw.trim();
    const lower = normalize(text);
    if (!text) return;

    addMessage('user', text);

    let match = lower.match(/^cari siswa (.+)$/i);
    if (match) {
      const query = normalize(match[1]);
      const hits: Array<{ classId: string; name: string }> = [];
      schoolData.forEach((cls) => {
        cls.students.forEach((std) => {
          if (normalize(std).includes(query)) hits.push({ classId: cls.id, name: std });
        });
      });
      if (hits.length === 0) {
        addMessage('assistant', `Tidak ada siswa cocok untuk "${match[1]}".`);
      } else {
        addMessage('assistant', hits.slice(0, 30).map((h) => `${h.name} (kelas ${h.classId})`).join('\n'));
      }
      return;
    }

    match = lower.match(/^tampilkan siswa kelas ([a-z0-9]+)$/i);
    if (match) {
      const classId = match[1].toLowerCase();
      const cls = classMap.get(classId);
      if (!cls) {
        addMessage('assistant', `Kelas ${match[1].toUpperCase()} tidak ditemukan.`);
      } else if (!cls.students.length) {
        addMessage('assistant', `Kelas ${cls.id} belum punya data siswa.`);
      } else {
        addMessage('assistant', [`Siswa kelas ${cls.id}:`, ...cls.students].join('\n'));
      }
      return;
    }

    match = text.match(/^tampilkan data harian siswa (.+?)(?: tanggal (\d{4}-\d{2}-\d{2}))?$/i);
    if (match) {
      const studentName = match[1].trim();
      const date = match[2];
      const sub = findStudentDaily(studentName, date);
      if (!sub) {
        addMessage('assistant', `Data harian untuk "${studentName}" tidak ditemukan.`);
        return;
      }
      const sholatCount = Object.values(sub.sholatWajib || {}).filter(Boolean).length;
      addMessage(
        'assistant',
        [
          `Data ${sub.studentName} - ${sub.classId || sub.className} (${sub.date})`,
          `Puasa: ${sub.puasa}`,
          `Sholat wajib: ${sholatCount}/5`,
          `Tarawih: ${sub.tarawih ? 'Ya' : 'Tidak'}`,
          `Rawatib: ${sub.rawatib}`,
          `Tilawah: ${sub.tilawahQuran ? "Qur'an" : sub.tilawahJilid ? 'Jilid' : '-'}`,
          `Dzikir: ${sub.dzikir ? 'Ya' : 'Tidak'}`,
          `Dhuha: ${sub.dhuha ? 'Ya' : 'Tidak'}`,
          `Tahajjud: ${sub.tahajjud ? 'Ya' : 'Tidak'}`,
          `Birrul: ${sub.birrul ? 'Ya' : 'Tidak'}`,
          `Ceramah: ${sub.ceramah ? 'Ya' : 'Tidak'}`,
          `Takjil: ${sub.takjil ? 'Ya' : 'Tidak'}`,
          `Sedekah: ${sub.sedekah ? 'Ya' : 'Tidak'}`,
          `Status haid: ${sub.isHaid ? 'Ya' : 'Tidak'}`,
        ].join('\n'),
      );
      return;
    }

    match = text.match(/^tambah siswa (.+) ke kelas ([A-Za-z0-9]+)$/i);
    if (match) {
      const studentName = match[1].trim();
      const classId = match[2].toLowerCase();
      const cls = classMap.get(classId);
      if (!cls) {
        addMessage('assistant', `Kelas ${match[2].toUpperCase()} tidak ditemukan.`);
        return;
      }
      if (cls.students.some((s) => normalize(s) === normalize(studentName))) {
        addMessage('assistant', `Siswa "${studentName}" sudah ada di kelas ${cls.id}.`);
        return;
      }
      const updated = schoolData.map((c) =>
        c.id === cls.id ? { ...c, students: [...c.students, studentName].sort() } : c,
      );
      setSchoolData(updated);
      addMessage('assistant', `Siswa "${studentName}" ditambahkan ke kelas ${cls.id}.`);
      return;
    }

    match = text.match(/^hapus siswa (.+) dari kelas ([A-Za-z0-9]+)$/i);
    if (match) {
      const studentName = match[1].trim();
      const classId = match[2].toLowerCase();
      const cls = classMap.get(classId);
      if (!cls) {
        addMessage('assistant', `Kelas ${match[2].toUpperCase()} tidak ditemukan.`);
        return;
      }
      const before = cls.students.length;
      const updated = schoolData.map((c) =>
        c.id === cls.id
          ? { ...c, students: c.students.filter((s) => normalize(s) !== normalize(studentName)) }
          : c,
      );
      if (before === updated.find((c) => c.id === cls.id)?.students.length) {
        addMessage('assistant', `Siswa "${studentName}" tidak ditemukan di kelas ${cls.id}.`);
        return;
      }
      setSchoolData(updated);
      addMessage('assistant', `Siswa "${studentName}" dihapus dari kelas ${cls.id}.`);
      return;
    }

    match = text.match(/^ganti nama siswa (.+) jadi (.+) di kelas ([A-Za-z0-9]+)$/i);
    if (match) {
      const oldName = match[1].trim();
      const newName = match[2].trim();
      const classId = match[3].toLowerCase();
      const cls = classMap.get(classId);
      if (!cls) {
        addMessage('assistant', `Kelas ${match[3].toUpperCase()} tidak ditemukan.`);
        return;
      }
      let found = false;
      const updated = schoolData.map((c) => {
        if (c.id !== cls.id) return c;
        const students = c.students.map((s) => {
          if (normalize(s) === normalize(oldName)) {
            found = true;
            return newName;
          }
          return s;
        });
        return { ...c, students };
      });
      if (!found) {
        addMessage('assistant', `Siswa "${oldName}" tidak ditemukan di kelas ${cls.id}.`);
        return;
      }
      setSchoolData(updated);
      addMessage('assistant', `Nama siswa "${oldName}" diganti menjadi "${newName}" di kelas ${cls.id}.`);
      return;
    }

    addMessage('assistant', 'Perintah belum dikenali. Ketik pola seperti contoh di atas.');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    runCommand(input);
    setInput('');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen">
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Asisten data guru/kesiswaan berbasis prompt</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 h-[65vh] overflow-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
            {m.text}
          </div>
        ))}
      </GlassCard>

      <form onSubmit={onSubmit} className="mt-4">
        <GlassCard className="p-2 flex items-center gap-2">
          <Sparkles size={16} className="text-muted-foreground ml-1" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contoh: tampilkan data harian siswa Nadhifa"
            className="flex-1 bg-transparent outline-none text-sm px-2"
          />
          <button type="submit" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
            <Send size={14} /> Kirim
          </button>
        </GlassCard>
      </form>
    </div>
  );
};

export default AIAssistantPage;

