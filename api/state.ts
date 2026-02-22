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

async function ensureBackupTable() {
  await sql`
    create table if not exists app_state_daily_backup (
      day date primary key,
      school_data jsonb not null default '[]'::jsonb,
      submissions jsonb not null default '[]'::jsonb,
      captured_at timestamptz not null default now()
    )
  `;
}

async function saveDailyBackup(schoolData: unknown, submissions: unknown) {
  await sql`
    insert into app_state_daily_backup (day, school_data, submissions, captured_at)
    values (
      timezone('UTC', now())::date,
      ${JSON.stringify(schoolData)}::jsonb,
      ${JSON.stringify(submissions)}::jsonb,
      now()
    )
    on conflict (day) do nothing
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
  const getKey = (c: SchoolClass) => c.id || c.name;
  const merged = new Map<string, SchoolClass>();

  existing.forEach((cls) => {
    merged.set(getKey(cls), {
      ...cls,
      students: Array.isArray(cls.students) ? cls.students : [],
    });
  });

  incoming.forEach((inc) => {
    const key = getKey(inc);
    const ex = merged.get(key);
    merged.set(key, {
      ...(ex || {}),
      ...inc,
      // If incoming omits students, keep existing students.
      students: Array.isArray(inc.students) ? inc.students : (ex?.students || []),
    });
  });

  return Array.from(merged.values());
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
    await ensureBackupTable();

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

      const forceOverwrite = String(req.query?.force || req.headers?.['x-force-overwrite'] || '') === '1';
      const suspiciousShrink =
        existingSchool.length >= 8 &&
        incomingSchool.length > 0 &&
        incomingSchool.length <= Math.max(3, Math.floor(existingSchool.length * 0.4));
      if (suspiciousShrink && !forceOverwrite) {
        return res.status(409).json({
          ok: false,
          error: 'Suspicious schoolData shrink blocked',
          details: {
            existingClasses: existingSchool.length,
            incomingClasses: incomingSchool.length,
          },
        });
      }

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
      await saveDailyBackup(mergedSchool, mergedSubs);

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API /state error', error);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
