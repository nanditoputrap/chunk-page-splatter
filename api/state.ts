import { sql } from '@vercel/postgres';

const STATE_ID = 'main';

if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

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

type SchoolClass = {
  id: string;
  name: string;
  teacher: string;
  students?: string[];
};

type SubmissionItem = {
  classId?: string;
  className?: string;
  studentName?: string;
  date?: string;
  [key: string]: any;
};

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

const mergeSchoolData = (existing: SchoolClass[], incoming: SchoolClass[]) => {
  const exMap = new Map(existing.map((c) => [c.id, c]));
  // Incoming list is authoritative for class existence.
  // This allows class deletion to persist across refresh.
  return incoming.map((inc) => {
    const ex = exMap.get(inc.id);
    const base = inc;
    const students = Array.from(new Set([...(ex?.students || []), ...(inc?.students || [])]));
    return {
      ...base,
      students,
    };
  });
};

const mergeSubmissions = (existing: SubmissionItem[], incoming: SubmissionItem[]) => {
  const map = new Map<string, SubmissionItem>();
  [...existing, ...incoming].forEach((sub) => {
    const classKey = sub.classId || sub.className || '';
    const studentKey = sub.studentName || '';
    const dateKey = sub.date || '';
    const key = `${classKey}::${studentKey}::${dateKey}`;
    map.set(key, sub);
  });
  return Array.from(map.values());
};

export default async function handler(req: any, res: any) {
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const result = await sql`select id, school_data, submissions, updated_at from app_state where id = ${STATE_ID} limit 1`;
      const row = result.rows[0] || null;
      return res.status(200).json({ ok: true, data: row });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const incomingSchool = parseArray<SchoolClass>(body.schoolData);
      const incomingSubs = parseArray<SubmissionItem>(body.submissions);

      const existingRow = await sql`select school_data, submissions from app_state where id = ${STATE_ID} limit 1`;
      const existing = existingRow.rows[0];
      const existingSchool = parseArray<SchoolClass>(existing?.school_data);
      const existingSubs = parseArray<SubmissionItem>(existing?.submissions);

      const mergedSchool = mergeSchoolData(existingSchool, incomingSchool);
      const mergedSubs = mergeSubmissions(existingSubs, incomingSubs);

      await sql`
        insert into app_state (id, school_data, submissions, updated_at)
        values (${STATE_ID}, ${JSON.stringify(mergedSchool)}::jsonb, ${JSON.stringify(mergedSubs)}::jsonb, now())
        on conflict (id)
        do update set
          school_data = excluded.school_data,
          submissions = excluded.submissions,
          updated_at = now()
      `;

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API /state error', error);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
