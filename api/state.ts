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

async function ensureLogTable() {
  await sql`
    create table if not exists app_activity_log (
      id bigserial primary key,
      event_type text not null,
      message text not null,
      actor_role text,
      class_id text,
      student_name text,
      event_date text,
      device_type text,
      browser text,
      user_agent text,
      ip text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
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

const isIsoDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const LOG_PIN = process.env.LOG_VIEW_PIN || '2167';

const getQueryParam = (req: any, key: string) => {
  if (req?.query && typeof req.query[key] !== 'undefined') {
    return String(req.query[key]);
  }
  try {
    const url = new URL(req.url || '', 'http://localhost');
    const value = url.searchParams.get(key);
    return value ?? '';
  } catch {
    return '';
  }
};

const getAdminToken = (req: any) =>
  String(req.headers?.['x-admin-token'] || getQueryParam(req, 'token') || '');

const getLogPin = (req: any) =>
  String(req.headers?.['x-log-pin'] || getQueryParam(req, 'pin') || '');

const isAdminAuthorized = (req: any) => {
  const expected = process.env.STATE_ADMIN_TOKEN;
  if (!expected) return false;
  return getAdminToken(req) === expected;
};

const isLogAuthorized = (req: any) => getLogPin(req) === LOG_PIN;

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

type ActivityLog = {
  eventType: string;
  message: string;
  actorRole?: string;
  classId?: string;
  studentName?: string;
  eventDate?: string;
  metadata?: Record<string, any>;
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

const detectDeviceType = (ua: string) => {
  if (/Mobile|Android|iPhone|Windows Phone|Opera Mini/i.test(ua)) return 'HP';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  return 'Laptop/Desktop';
};

const detectBrowser = (ua: string) => {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  return 'Unknown';
};

const getClientMeta = (req: any) => {
  const userAgent = String(req.headers?.['user-agent'] || '');
  const forwarded = String(req.headers?.['x-forwarded-for'] || '');
  const ip = forwarded.split(',')[0]?.trim() || String(req.headers?.['x-real-ip'] || '');
  return {
    userAgent,
    ip,
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
  };
};

const submissionKey = (sub: SubmissionItem) => {
  const classKey = sub.classId || sub.className || '';
  const studentKey = sub.studentName || '';
  const dateKey = sub.date || '';
  return `${classKey}::${studentKey}::${dateKey}`;
};

const summarizeStateChanges = (
  beforeSchool: SchoolClass[],
  afterSchool: SchoolClass[],
  beforeSubs: SubmissionItem[],
  afterSubs: SubmissionItem[],
  actorRole: string,
) => {
  const logs: ActivityLog[] = [];

  const beforeClassMap = new Map(beforeSchool.map((c) => [c.id, c]));
  const afterClassMap = new Map(afterSchool.map((c) => [c.id, c]));

  afterClassMap.forEach((afterClass, classId) => {
    const beforeClass = beforeClassMap.get(classId);
    if (!beforeClass) {
      logs.push({
        eventType: 'class_added',
        message: `Kelas ditambahkan: ${afterClass.id} - ${afterClass.name}`,
        actorRole,
        classId: afterClass.id,
      });
      return;
    }

    if (beforeClass.name !== afterClass.name || beforeClass.teacher !== afterClass.teacher) {
      logs.push({
        eventType: 'class_updated',
        message: `Data kelas diperbarui: ${afterClass.id}`,
        actorRole,
        classId: afterClass.id,
      });
    }

    const beforeStudents = new Set((beforeClass.students || []).map((s) => s.trim()));
    const afterStudents = new Set((afterClass.students || []).map((s) => s.trim()));
    afterStudents.forEach((s) => {
      if (!beforeStudents.has(s)) {
        logs.push({
          eventType: 'student_added',
          message: `Siswa ditambahkan: ${s} (${afterClass.id})`,
          actorRole,
          classId: afterClass.id,
          studentName: s,
        });
      }
    });
    beforeStudents.forEach((s) => {
      if (!afterStudents.has(s)) {
        logs.push({
          eventType: 'student_removed',
          message: `Siswa dihapus: ${s} (${afterClass.id})`,
          actorRole,
          classId: afterClass.id,
          studentName: s,
        });
      }
    });
  });

  beforeClassMap.forEach((beforeClass, classId) => {
    if (!afterClassMap.has(classId)) {
      logs.push({
        eventType: 'class_removed',
        message: `Kelas dihapus: ${beforeClass.id} - ${beforeClass.name}`,
        actorRole,
        classId: beforeClass.id,
      });
    }
  });

  const beforeSubMap = new Map(beforeSubs.map((s) => [submissionKey(s), s]));
  const afterSubMap = new Map(afterSubs.map((s) => [submissionKey(s), s]));

  afterSubMap.forEach((afterSub, key) => {
    const beforeSub = beforeSubMap.get(key);
    if (!beforeSub) {
      logs.push({
        eventType: 'submission_added',
        message: `Pengisian ditambahkan: ${afterSub.studentName || '-'} (${afterSub.classId || afterSub.className || '-'}) ${afterSub.date || ''}`,
        actorRole,
        classId: String(afterSub.classId || ''),
        studentName: String(afterSub.studentName || ''),
        eventDate: String(afterSub.date || ''),
      });
      return;
    }
    if (JSON.stringify(beforeSub) !== JSON.stringify(afterSub)) {
      logs.push({
        eventType: 'submission_updated',
        message: `Pengisian diperbarui: ${afterSub.studentName || '-'} (${afterSub.classId || afterSub.className || '-'}) ${afterSub.date || ''}`,
        actorRole,
        classId: String(afterSub.classId || ''),
        studentName: String(afterSub.studentName || ''),
        eventDate: String(afterSub.date || ''),
      });
    }
  });

  return logs;
};

async function saveActivityLogs(req: any, logs: ActivityLog[]) {
  if (!logs.length) return;
  const client = getClientMeta(req);
  const limited = logs.slice(0, 200);
  for (const log of limited) {
    await sql`
      insert into app_activity_log (
        event_type, message, actor_role, class_id, student_name, event_date,
        device_type, browser, user_agent, ip, metadata
      )
      values (
        ${log.eventType},
        ${log.message},
        ${log.actorRole || null},
        ${log.classId || null},
        ${log.studentName || null},
        ${log.eventDate || null},
        ${client.deviceType},
        ${client.browser},
        ${client.userAgent},
        ${client.ip},
        ${JSON.stringify(log.metadata || {})}::jsonb
      )
    `;
  }
}

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

const ensureClassesFromSubmissions = (classes: SchoolClass[], submissions: SubmissionItem[]) => {
  const byId = new Map<string, SchoolClass>();

  classes.forEach((cls) => {
    const id = String(cls.id || cls.name || '').trim();
    if (!id) return;
    byId.set(id, {
      id,
      name: cls.name || id,
      teacher: cls.teacher || '',
      students: Array.isArray(cls.students) ? [...new Set(cls.students.filter(Boolean))] : [],
    });
  });

  submissions.forEach((sub) => {
    const id = String(sub.classId || sub.className || '').trim();
    if (!id) return;
    const className = String(sub.className || id).trim() || id;
    const studentName = String(sub.studentName || '').trim();

    if (!byId.has(id)) {
      byId.set(id, { id, name: className, teacher: '', students: [] });
    }
    const cls = byId.get(id)!;
    if (!cls.name && className) cls.name = className;
    if (studentName && !cls.students?.includes(studentName)) {
      cls.students = [...(cls.students || []), studentName];
    }
  });

  return Array.from(byId.values());
};

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    await ensureTable();
    await ensureBackupTable();
    await ensureLogTable();

    if (req.method === 'GET') {
      if (getQueryParam(req, 'admin') === 'logs') {
        if (!isLogAuthorized(req)) {
          return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
        const limitParam = Number(getQueryParam(req, 'limit') || 200);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(1000, limitParam)) : 200;
        const result = await sql`
          select
            id, event_type, message, actor_role, class_id, student_name, event_date,
            device_type, browser, user_agent, ip, metadata, created_at
          from app_activity_log
          order by id desc
          limit ${limit}
        `;
        return res.status(200).json({ ok: true, logs: result.rows });
      }

      if (getQueryParam(req, 'admin') === 'backups') {
        if (!process.env.STATE_ADMIN_TOKEN) {
          return res.status(503).json({ ok: false, error: 'STATE_ADMIN_TOKEN is not configured' });
        }
        if (!isAdminAuthorized(req)) {
          return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
        const limitParam = Number(getQueryParam(req, 'limit') || 30);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(365, limitParam)) : 30;
        const backups = await sql`
          select
            day,
            captured_at,
            jsonb_array_length(school_data) as class_count,
            jsonb_array_length(submissions) as submission_count
          from app_state_daily_backup
          order by day desc
          limit ${limit}
        `;
        return res.status(200).json({ ok: true, backups: backups.rows });
      }

      const result = await sql`select id, school_data, submissions, updated_at from app_state where id = ${STATE_ID} limit 1`;
      const row = result.rows[0] || null;
      if (!row) return res.status(200).json({ ok: true, data: null });

      const school = parseArray<SchoolClass>(row.school_data);
      const subs = parseArray<SubmissionItem>(row.submissions);
      const healedSchool = ensureClassesFromSubmissions(school, subs);

      if (healedSchool.length !== school.length) {
        await sql`
          update app_state
          set school_data = ${JSON.stringify(healedSchool)}::jsonb,
              updated_at = now()
          where id = ${STATE_ID}
        `;
        await saveDailyBackup(healedSchool, subs);
      }

      return res.status(200).json({
        ok: true,
        data: {
          id: row.id,
          school_data: healedSchool,
          submissions: subs,
          updated_at: row.updated_at,
        },
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const actorRole = String(body.actorRole || body.role || 'unknown');

      if (body.adminAction === 'getLogs') {
        const bodyPin = String(body.pin || '');
        const headerPin = getLogPin(req);
        if (bodyPin !== LOG_PIN && headerPin !== LOG_PIN) {
          return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
        const limitParam = Number(body.limit || 200);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(1000, limitParam)) : 200;
        const result = await sql`
          select
            id, event_type, message, actor_role, class_id, student_name, event_date,
            device_type, browser, user_agent, ip, metadata, created_at
          from app_activity_log
          order by id desc
          limit ${limit}
        `;
        return res.status(200).json({ ok: true, logs: result.rows });
      }

      if (body.adminAction === 'restoreBackup') {
        if (!process.env.STATE_ADMIN_TOKEN) {
          return res.status(503).json({ ok: false, error: 'STATE_ADMIN_TOKEN is not configured' });
        }
        if (!isAdminAuthorized(req)) {
          return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        const day = String(body.day || '').trim();
        if (!isIsoDay(day)) {
          return res.status(400).json({ ok: false, error: 'Invalid day format. Use YYYY-MM-DD' });
        }

        const backupRow = await sql`
          select school_data, submissions
          from app_state_daily_backup
          where day = ${day}::date
          limit 1
        `;
        const backup = backupRow.rows[0];
        if (!backup) {
          return res.status(404).json({ ok: false, error: 'Backup not found' });
        }

        const backupSchool = parseArray<SchoolClass>(backup.school_data);
        const backupSubs = parseArray<SubmissionItem>(backup.submissions);
        await sql`
          insert into app_state (id, school_data, submissions, updated_at)
          values (${STATE_ID}, ${JSON.stringify(backupSchool)}::jsonb, ${JSON.stringify(backupSubs)}::jsonb, now())
          on conflict (id)
          do update set
            school_data = excluded.school_data,
            submissions = excluded.submissions,
            updated_at = now()
        `;
        await saveActivityLogs(req, [{
          eventType: 'backup_restore',
          message: `Restore backup harian: ${day}`,
          actorRole: 'admin',
          metadata: { day, classCount: backupSchool.length, submissionCount: backupSubs.length },
        }]);

        return res.status(200).json({
          ok: true,
          restoredDay: day,
          classCount: backupSchool.length,
          submissionCount: backupSubs.length,
        });
      }

      const incomingSchool = parseArray<SchoolClass>(body.schoolData);
      const incomingSubs = parseArray<SubmissionItem>(body.submissions);

      const existingRow = await sql`select school_data, submissions from app_state where id = ${STATE_ID} limit 1`;
      const existing = existingRow.rows[0];
      const existingSchool = parseArray<SchoolClass>(existing?.school_data);
      const existingSubs = parseArray<SubmissionItem>(existing?.submissions);

      const forceOverwrite = String(getQueryParam(req, 'force') || req.headers?.['x-force-overwrite'] || '') === '1';
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

      const mergedSubs = mergeSubmissions(existingSubs, incomingSubs);
      const mergedSchool = ensureClassesFromSubmissions(
        mergeSchoolData(existingSchool, incomingSchool),
        mergedSubs,
      );
      const activityLogs = summarizeStateChanges(
        existingSchool,
        mergedSchool,
        existingSubs,
        mergedSubs,
        actorRole,
      );

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
      await saveActivityLogs(req, activityLogs);

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API /state error', error);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
