import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';

if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

type SchoolClass = {
  id: string;
  name: string;
  teacher: string;
  students: string[];
};

type SubmissionItem = {
  classId?: string;
  className?: string;
  studentName?: string;
  date?: string;
  [key: string]: any;
};

type AppState = {
  school_data: SchoolClass[];
  submissions: SubmissionItem[];
};

type AIPlan = {
  action: 'none' | 'find_students' | 'list_class_students' | 'get_student_daily' | 'add_student' | 'remove_student' | 'rename_student';
  args: Record<string, any>;
  reply: string;
};

const STATE_ID = 'main';

const normalize = (text: string) => text.toLowerCase().trim();

const parseArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const extractJsonObject = (text: string) => {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
  const candidate = codeBlock ? codeBlock[1].trim() : trimmed;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return candidate.slice(first, last + 1);
};

const isModelNotFoundError = (err: any) =>
  String(err?.message || '').includes('is not found') ||
  String(err?.message || '').includes('[404 Not Found]');

async function ensureTable() {
  await sql`
    create table if not exists app_state (
      id text primary key,
      school_data jsonb not null default '[]'::jsonb,
      submissions jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    )
  `;
}

async function loadState(): Promise<AppState> {
  await ensureTable();
  const result = await sql`select school_data, submissions from app_state where id = ${STATE_ID} limit 1`;
  const row = result.rows[0];
  if (!row) return { school_data: [], submissions: [] };
  return {
    school_data: parseArray<SchoolClass>(row.school_data),
    submissions: parseArray<SubmissionItem>(row.submissions),
  };
}

async function saveState(state: AppState) {
  await sql`
    insert into app_state (id, school_data, submissions, updated_at)
    values (${STATE_ID}, ${JSON.stringify(state.school_data)}::jsonb, ${JSON.stringify(state.submissions)}::jsonb, now())
    on conflict (id)
    do update set
      school_data = excluded.school_data,
      submissions = excluded.submissions,
      updated_at = now()
  `;
}

function executeTool(name: AIPlan['action'], args: any, state: AppState) {
  if (name === 'find_students') {
    const query = normalize(String(args?.query || ''));
    if (!query) return { ok: false, message: 'query kosong' };
    const hits: Array<{ classId: string; student: string }> = [];
    state.school_data.forEach((cls) => {
      (cls.students || []).forEach((s) => {
        if (normalize(s).includes(query)) hits.push({ classId: cls.id, student: s });
      });
    });
    return { ok: true, count: hits.length, results: hits.slice(0, 50) };
  }

  if (name === 'list_class_students') {
    const classId = normalize(String(args?.classId || ''));
    const cls = state.school_data.find((c) => normalize(c.id) === classId);
    if (!cls) return { ok: false, message: 'kelas tidak ditemukan' };
    return { ok: true, classId: cls.id, students: cls.students || [] };
  }

  if (name === 'get_student_daily') {
    const studentName = normalize(String(args?.studentName || ''));
    const date = args?.date ? String(args.date) : null;
    const studentSubs = state.submissions.filter((s) => normalize(String(s.studentName || '')) === studentName);
    if (!studentSubs.length) return { ok: false, message: 'data siswa tidak ditemukan' };
    let item = date ? studentSubs.find((s) => s.date === date) : undefined;
    if (!item) item = [...studentSubs].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];
    return { ok: true, submission: item };
  }

  if (name === 'add_student') {
    const classId = normalize(String(args?.classId || ''));
    const studentName = String(args?.studentName || '').trim();
    if (!classId || !studentName) return { ok: false, message: 'classId/studentName wajib' };
    state.school_data = state.school_data.map((cls) => {
      if (normalize(cls.id) !== classId) return cls;
      if ((cls.students || []).some((s) => normalize(s) === normalize(studentName))) return cls;
      return { ...cls, students: [...(cls.students || []), studentName].sort() };
    });
    return { ok: true, message: `siswa ${studentName} ditambah` };
  }

  if (name === 'remove_student') {
    const classId = normalize(String(args?.classId || ''));
    const studentName = String(args?.studentName || '').trim();
    if (!classId || !studentName) return { ok: false, message: 'classId/studentName wajib' };
    state.school_data = state.school_data.map((cls) => {
      if (normalize(cls.id) !== classId) return cls;
      return { ...cls, students: (cls.students || []).filter((s) => normalize(s) !== normalize(studentName)) };
    });
    return { ok: true, message: `siswa ${studentName} dihapus` };
  }

  if (name === 'rename_student') {
    const classId = normalize(String(args?.classId || ''));
    const oldName = String(args?.oldName || '').trim();
    const newName = String(args?.newName || '').trim();
    if (!classId || !oldName || !newName) return { ok: false, message: 'classId/oldName/newName wajib' };
    state.school_data = state.school_data.map((cls) => {
      if (normalize(cls.id) !== classId) return cls;
      return {
        ...cls,
        students: (cls.students || []).map((s) => (normalize(s) === normalize(oldName) ? newName : s)),
      };
    });
    return { ok: true, message: `nama siswa ${oldName} diganti ${newName}` };
  }

  return { ok: false, message: 'aksi tidak dikenali' };
}

function formatToolResult(result: any) {
  if (!result?.ok) return `Gagal: ${result?.message || 'aksi gagal'}`;
  if (result.results) {
    if (!result.results.length) return 'Tidak ada data yang cocok.';
    return result.results.map((r: any) => `${r.student} (kelas ${r.classId})`).join('\n');
  }
  if (result.students) {
    if (!result.students.length) return `Kelas ${result.classId} belum punya siswa.`;
    return [`Siswa kelas ${result.classId}:`, ...result.students].join('\n');
  }
  if (result.submission) {
    const s = result.submission;
    const sholat = Object.values(s.sholatWajib || {}).filter(Boolean).length;
    return [
      `Data ${s.studentName} (${s.date})`,
      `Kelas: ${s.classId || s.className}`,
      `Puasa: ${s.puasa}`,
      `Sholat wajib: ${sholat}/5`,
      `Tarawih: ${s.tarawih ? 'Ya' : 'Tidak'}`,
      `Rawatib: ${s.rawatib}`,
      `Dzikir: ${s.dzikir ? 'Ya' : 'Tidak'}`,
      `Dhuha: ${s.dhuha ? 'Ya' : 'Tidak'}`,
      `Tahajjud: ${s.tahajjud ? 'Ya' : 'Tidak'}`,
    ].join('\n');
  }
  return result.message || 'Selesai.';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY belum diset di Vercel' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const prompt = String(body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];
    if (!prompt) return res.status(400).json({ ok: false, error: 'message wajib diisi' });

    const state = await loadState();
    const classIds = state.school_data.map((c) => c.id).slice(0, 200).join(', ');
    const historyText = history
      .slice(-8)
      .map((m: any) => `${m.role === 'assistant' ? 'assistant' : 'user'}: ${String(m.text || '')}`)
      .join('\n');

    const instruction = [
      'Kamu adalah asisten data sekolah SMPIT.',
      'Balas HANYA JSON valid tanpa teks lain.',
      'Format JSON:',
      '{"action":"none|find_students|list_class_students|get_student_daily|add_student|remove_student|rename_student","args":{},"reply":"jawaban singkat"}',
      'Gunakan action "none" jika cukup jawab biasa.',
      'Jika user minta aksi data, pilih action yang tepat.',
      `Contoh classId tersedia: ${classIds || '-'}`,
      'Riwayat percakapan:',
      historyText || '-',
      `User: ${prompt}`,
    ].join('\n');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const requestedModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    const fallbackModels = [
      requestedModel,
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ];

    let raw = '';
    let lastErr: any = null;
    for (const modelName of Array.from(new Set(fallbackModels))) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(instruction);
        raw = result.response.text() || '';
        if (raw) break;
      } catch (err: any) {
        lastErr = err;
        if (!isModelNotFoundError(err)) throw err;
      }
    }
    if (!raw && lastErr) throw lastErr;

    const jsonText = extractJsonObject(raw);
    let plan: AIPlan | null = null;
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        plan = {
          action: parsed.action || 'none',
          args: parsed.args || {},
          reply: parsed.reply || '',
        };
      } catch {
        plan = null;
      }
    }

    let shouldPersist = false;
    let reply = 'Saya belum bisa memahami perintah. Coba tulis lebih spesifik.';

    if (plan) {
      if (plan.action !== 'none') {
        const toolResult = executeTool(plan.action, plan.args, state);
        if (['add_student', 'remove_student', 'rename_student'].includes(plan.action) && toolResult.ok) {
          shouldPersist = true;
        }
        reply = plan.reply?.trim() || formatToolResult(toolResult);
        if (plan.reply?.trim() && toolResult && toolResult.ok) {
          reply = `${plan.reply.trim()}\n\n${formatToolResult(toolResult)}`;
        }
      } else {
        reply = plan.reply?.trim() || raw || reply;
      }
    } else if (raw.trim()) {
      reply = raw.trim();
    }

    if (shouldPersist) await saveState(state);

    return res.status(200).json({
      ok: true,
      reply,
      schoolData: state.school_data,
      submissions: state.submissions,
    });
  } catch (error: any) {
    console.error('API /ai error', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Internal Server Error' });
  }
}
