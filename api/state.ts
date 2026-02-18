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
      const schoolData = Array.isArray(body.schoolData) ? body.schoolData : [];
      const submissions = Array.isArray(body.submissions) ? body.submissions : [];

      await sql`
        insert into app_state (id, school_data, submissions, updated_at)
        values (${STATE_ID}, ${JSON.stringify(schoolData)}::jsonb, ${JSON.stringify(submissions)}::jsonb, now())
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
