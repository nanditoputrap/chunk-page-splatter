import { FormEvent, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const AIAssistantPage = () => {
  const { setSchoolData, setSubmissions, showNotif } = useAmaliyah();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: [
        'AI Assistant aktif (OpenAI).',
        'Contoh prompt:',
        '- tampilkan siswa kelas 8A2',
        '- cari siswa sulaiman',
        '- tampilkan data harian siswa Nadhifa',
        '- tambah siswa NAMA ke kelas 8A2',
        '- hapus siswa NAMA dari kelas 8A2',
        '- ganti nama siswa LAMA jadi BARU di kelas 8A2',
      ].join('\n'),
    },
  ]);

  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage('user', text);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10);
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `AI request gagal (${res.status})`);
      }

      if (Array.isArray(data.schoolData)) setSchoolData(data.schoolData);
      if (Array.isArray(data.submissions)) setSubmissions(data.submissions);

      addMessage('assistant', String(data.reply || 'Selesai.'));
    } catch (err: any) {
      const msg = err?.message || 'Terjadi kesalahan saat memanggil AI.';
      addMessage('assistant', `Gagal: ${msg}`);
      showNotif('AI error. Cek env GEMINI_API_KEY di Vercel.');
    } finally {
      setIsLoading(false);
    }
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
            <p className="text-xs text-muted-foreground">OpenAI + Aksi Data Sekolah</p>
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
        {isLoading && (
          <div className="max-w-[90%] rounded-xl px-3 py-2 text-sm bg-secondary text-foreground inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" />
            <span className="text-xs text-muted-foreground">AI sedang berpikir...</span>
          </div>
        )}
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
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-60"
          >
            <Send size={14} /> Kirim
          </button>
        </GlassCard>
      </form>
    </div>
  );
};

export default AIAssistantPage;
