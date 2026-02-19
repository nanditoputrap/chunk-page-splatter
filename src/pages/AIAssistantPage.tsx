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
const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

const AIAssistantPage = () => {
  const { schoolData, setSchoolData, submissions, showNotif } = useAmaliyah();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: [
        'AI Assistant (mode gratis) aktif.',
        'Coba variasi prompt bebas, contoh:',
        '- carikan siswa sulaiman',
        '- lihat siswa kelas 8A2',
        '- data harian nadhifa',
        '- tambah siswa Aisyah ke kelas 8A2',
        '- hapus siswa Aisyah dari kelas 8A2',
        '- ganti nama siswa Aisyah jadi Aisyah Putri di kelas 8A2',
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

  const resolveClassIdFromText = (text: string) => {
    const found = schoolData.find((cls) => text.includes(cls.id.toLowerCase()));
    return found?.id;
  };

  const findStudentDaily = (studentName: string, date?: string): Submission | null => {
    const filtered = submissions.filter((s) => normalize(s.studentName) === normalize(studentName));
    if (!filtered.length) return null;
    if (date) {
      const dated = filtered.find((s) => s.date === date);
      if (dated) return dated as Submission;
    }
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date))[0] as Submission;
  };

  const replyUnknown = () => {
    addMessage(
      'assistant',
      [
        'Saya belum paham maksudnya. Coba salah satu pola ini:',
        '- cari siswa [nama]',
        '- tampilkan siswa kelas [id_kelas]',
        '- data harian [nama siswa] [opsional: tanggal YYYY-MM-DD]',
        '- tambah/hapus siswa [nama] ke/dari kelas [id_kelas]',
        '- ganti nama siswa [lama] jadi [baru] di kelas [id_kelas]',
      ].join('\n'),
    );
  };

  const runHybridAI = (raw: string) => {
    const text = raw.trim();
    const lower = normalize(text);
    if (!text) return;

    addMessage('user', text);

    // 1) Rename student
    let m = text.match(/ganti\s+nama\s+siswa\s+(.+?)\s+jadi\s+(.+?)\s+(?:di|dalam)\s+kelas\s+([A-Za-z0-9]+)/i);
    if (m) {
      const oldName = m[1].trim();
      const newName = m[2].trim();
      const classId = m[3].toUpperCase();
      const cls = classMap.get(classId.toLowerCase());
      if (!cls) return addMessage('assistant', `Kelas ${classId} tidak ditemukan.`);

      let found = false;
      const updated = schoolData.map((c) => {
        if (c.id !== cls.id) return c;
        return {
          ...c,
          students: c.students.map((s) => {
            if (normalize(s) === normalize(oldName)) {
              found = true;
              return newName;
            }
            return s;
          }),
        };
      });

      if (!found) return addMessage('assistant', `Siswa "${oldName}" tidak ditemukan di kelas ${classId}.`);
      setSchoolData(updated);
      showNotif('Perubahan data siswa tersimpan');
      return addMessage('assistant', `Nama siswa "${oldName}" berhasil diganti menjadi "${newName}" di kelas ${classId}.`);
    }

    // 2) Add student
    m = text.match(/tambah(?:kan)?\s+siswa\s+(.+?)\s+(?:ke|kpd|kedalam|dalam)\s+kelas\s+([A-Za-z0-9]+)/i);
    if (m) {
      const studentName = m[1].trim();
      const classId = m[2].toUpperCase();
      const cls = classMap.get(classId.toLowerCase());
      if (!cls) return addMessage('assistant', `Kelas ${classId} tidak ditemukan.`);
      if (cls.students.some((s) => normalize(s) === normalize(studentName))) {
        return addMessage('assistant', `Siswa "${studentName}" sudah ada di kelas ${classId}.`);
      }
      const updated = schoolData.map((c) =>
        c.id === cls.id ? { ...c, students: [...c.students, studentName].sort() } : c,
      );
      setSchoolData(updated);
      showNotif('Siswa ditambahkan');
      return addMessage('assistant', `Siswa "${studentName}" ditambahkan ke kelas ${classId}.`);
    }

    // 3) Remove student
    m = text.match(/hapus\s+siswa\s+(.+?)\s+(?:dari|dr|di)\s+kelas\s+([A-Za-z0-9]+)/i);
    if (m) {
      const studentName = m[1].trim();
      const classId = m[2].toUpperCase();
      const cls = classMap.get(classId.toLowerCase());
      if (!cls) return addMessage('assistant', `Kelas ${classId} tidak ditemukan.`);

      const before = cls.students.length;
      const updated = schoolData.map((c) =>
        c.id === cls.id
          ? { ...c, students: c.students.filter((s) => normalize(s) !== normalize(studentName)) }
          : c,
      );
      const after = updated.find((c) => c.id === cls.id)?.students.length ?? 0;
      if (before === after) return addMessage('assistant', `Siswa "${studentName}" tidak ada di kelas ${classId}.`);

      setSchoolData(updated);
      showNotif('Siswa dihapus');
      return addMessage('assistant', `Siswa "${studentName}" dihapus dari kelas ${classId}.`);
    }

    // 4) List students in class (more flexible)
    if (
      hasAny(lower, ['siswa kelas', 'daftar siswa', 'lihat kelas', 'tampilkan kelas']) &&
      hasAny(lower, ['kelas', 'class'])
    ) {
      const classId = resolveClassIdFromText(lower);
      if (!classId) return addMessage('assistant', 'Saya tidak menemukan ID kelas di prompt Anda. Contoh: kelas 8A2');
      const cls = classMap.get(classId.toLowerCase());
      if (!cls) return addMessage('assistant', `Kelas ${classId} tidak ditemukan.`);
      if (!cls.students.length) return addMessage('assistant', `Kelas ${classId} belum punya data siswa.`);
      return addMessage('assistant', [`Siswa kelas ${classId}:`, ...cls.students].join('\n'));
    }

    // 5) Find students by name
    if (hasAny(lower, ['cari', 'carikan', 'temukan', 'search']) && hasAny(lower, ['siswa', 'murid'])) {
      const q = lower
        .replace(/cari(kan)?/g, '')
        .replace(/temukan/g, '')
        .replace(/search/g, '')
        .replace(/siswa|murid/g, '')
        .trim();
      const query = q || lower;
      const hits: Array<{ classId: string; name: string }> = [];
      schoolData.forEach((cls) => {
        cls.students.forEach((s) => {
          if (normalize(s).includes(query)) hits.push({ classId: cls.id, name: s });
        });
      });
      if (!hits.length) return addMessage('assistant', `Tidak ada siswa yang cocok untuk "${query}".`);
      return addMessage('assistant', hits.slice(0, 50).map((h) => `${h.name} (kelas ${h.classId})`).join('\n'));
    }

    // 6) Daily data lookup
    if (hasAny(lower, ['data harian', 'rekap harian', 'laporan harian', 'data siswa'])) {
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch?.[1];

      // try explicit pattern first
      let name = text.replace(/.*(?:siswa|murid)\s+/i, '').replace(/\s+tanggal\s+\d{4}-\d{2}-\d{2}.*/i, '').trim();
      if (!name || name.toLowerCase() === text.toLowerCase()) {
        // fallback heuristic: remove common words
        name = text
          .replace(/data harian|rekap harian|laporan harian|tampilkan|lihat|data siswa|siswa|murid|tanggal/gi, '')
          .replace(/\d{4}-\d{2}-\d{2}/g, '')
          .trim();
      }
      if (!name) return addMessage('assistant', 'Sebutkan nama siswa. Contoh: data harian Nadhifa');

      const sub = findStudentDaily(name, date);
      if (!sub) return addMessage('assistant', `Data harian untuk "${name}" tidak ditemukan.`);

      const sholatCount = Object.values(sub.sholatWajib || {}).filter(Boolean).length;
      return addMessage(
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
    }

    replyUnknown();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    runHybridAI(input);
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
            <p className="text-xs text-muted-foreground">Mode Gratis Hybrid (tanpa quota API)</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 h-[65vh] overflow-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
          >
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
            placeholder="Contoh: carikan siswa sulaiman"
            className="flex-1 bg-transparent outline-none text-sm px-2"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1"
          >
            <Send size={14} /> Kirim
          </button>
        </GlassCard>
      </form>
    </div>
  );
};

export default AIAssistantPage;
