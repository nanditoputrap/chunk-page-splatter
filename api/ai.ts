import OpenAI from 'openai';
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

function executeTool(name: string, args: any, state: AppState) {
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
    if (!item) {
      item = [...studentSubs].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];
    }
    return { ok: true, submission: item };
  }

  if (name === 'add_student') {
    const classId = normalize(String(args?.classId || ''));
    const studentName = String(args?.studentName || '').trim();
    if (!classId || !studentName) return { ok: false, message: 'classId/studentName wajib' };
    const next = state.school_data.map((cls) => {
      if (normalize(cls.id) !== classId) return cls;
      if ((cls.students || []).some((s) => normalize(s) === normalize(studentName))) return cls;
      return { ...cls, students: [...(cls.students || []), studentName].sort() };
    });
    state.school_data = next;
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

  return { ok: false, message: `tool ${name} tidak dikenali` };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY belum diset di Vercel' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const prompt = String(body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'message wajib diisi' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const state = await loadState();

    const messages: any[] = [
      {
        role: 'system',
        content: [
          'Kamu adalah asisten data sekolah.',
          'Jawab dalam Bahasa Indonesia.',
          'Gunakan tools untuk baca/update data jika dibutuhkan.',
          'Jika user minta aksi data, lakukan dengan tool yang sesuai lalu konfirmasi hasil.',
          'Jangan mengarang data yang tidak ada.',
        ].join(' '),
      },
      ...history.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text || '') })),
      { role: 'user', content: prompt },
    ];

    const tools: any[] = [
      {
        type: 'function',
        function: {
          name: 'find_students',
          description: 'Cari siswa berdasarkan potongan nama di semua kelas',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_class_students',
          description: 'Tampilkan daftar siswa dalam satu kelas berdasarkan classId (contoh: 8A2)',
          parameters: {
            type: 'object',
            properties: { classId: { type: 'string' } },
            required: ['classId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_student_daily',
          description: 'Ambil data harian siswa terbaru atau pada tanggal tertentu (YYYY-MM-DD)',
          parameters: {
            type: 'object',
            properties: {
              studentName: { type: 'string' },
              date: { type: 'string' },
            },
            required: ['studentName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'add_student',
          description: 'Tambah siswa ke kelas',
          parameters: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              studentName: { type: 'string' },
            },
            required: ['classId', 'studentName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'remove_student',
          description: 'Hapus siswa dari kelas',
          parameters: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              studentName: { type: 'string' },
            },
            required: ['classId', 'studentName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'rename_student',
          description: 'Ganti nama siswa dalam kelas',
          parameters: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              oldName: { type: 'string' },
              newName: { type: 'string' },
            },
            required: ['classId', 'oldName', 'newName'],
          },
        },
      },
    ];

    let shouldPersist = false;
    let finalAnswer = 'Maaf, saya belum bisa memproses permintaan ini.';

    for (let i = 0; i < 4; i++) {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.2,
      });

      const msg = completion.choices[0]?.message;
      if (!msg) break;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);

        for (const toolCall of msg.tool_calls) {
          const toolName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            args = {};
          }

          const result = executeTool(toolName, args, state);
          if (['add_student', 'remove_student', 'rename_student'].includes(toolName) && result.ok) {
            shouldPersist = true;
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      finalAnswer = String(msg.content || finalAnswer);
      break;
    }

    if (shouldPersist) {
      await saveState(state);
    }

    return res.status(200).json({
      ok: true,
      reply: finalAnswer,
      schoolData: state.school_data,
      submissions: state.submissions,
    });
  } catch (error: any) {
    console.error('API /ai error', error);
    return res.status(500).json({ ok: false, error: error?.message || 'Internal Server Error' });
  }
}
