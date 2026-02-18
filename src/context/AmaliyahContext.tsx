import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClassData, Submission, DEFAULT_CLASSES } from '@/lib/constants';

interface AmaliyahContextType {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  isHydrated: boolean;
  selectedClass: ClassData | null;
  setSelectedClass: (cls: ClassData | null) => void;
  selectedStudent: string | null;
  setSelectedStudent: (student: string | null) => void;
  submissions: Submission[];
  setSubmissions: (subs: Submission[]) => void;
  saveSubmission: (sub: Submission) => void;
  schoolData: ClassData[];
  setSchoolData: (data: ClassData[]) => void;
  notification: string | null;
  showNotif: (msg: string) => void;
  handleLogout: () => void;
}

const AmaliyahContext = createContext<AmaliyahContextType | null>(null);

const SUBMISSION_STORAGE_KEY = 'amaliyah_glass_data_v2';
const SCHOOL_STORAGE_KEY = 'amaliyah_school_data';
const MIGRATION_FLAG_KEY = 'amaliyah_migration_v1_done';
const LEGACY_SUBMISSION_KEYS = [
  'amaliyah_glass_data',
  'amaliyah_data',
  'submissions',
  'lovable_app_data',
];
const LEGACY_SCHOOL_KEYS = [
  'school_data',
  'amaliyah_classes',
  'lovable_school_data',
];

const parseStoredArray = <T,>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getSubmissionClassKey = (sub: Submission) => sub.classId || sub.className || '';

const normalizeSubmissions = (subs: Submission[], classes: ClassData[]) => {
  const classesByName = new Map(classes.map((c) => [c.name, c.id]));
  return subs.map((sub) => ({
    ...sub,
    classId: sub.classId || classesByName.get(sub.className),
  }));
};

const mergeSubmissions = (subs: Submission[]) => {
  const unique = new Map<string, Submission>();
  subs.forEach((sub) => {
    const key = `${getSubmissionClassKey(sub)}::${sub.studentName}::${sub.date}`;
    unique.set(key, sub);
  });
  return Array.from(unique.values());
};

const mergeSchoolData = (local: ClassData[], cloud: ClassData[]) => {
  const localMap = new Map(local.map((c) => [c.id, c]));
  const cloudMap = new Map(cloud.map((c) => [c.id, c]));
  const classIds = Array.from(new Set([...local.map((c) => c.id), ...cloud.map((c) => c.id)]));

  return classIds.map((id) => {
    const localClass = localMap.get(id);
    const cloudClass = cloudMap.get(id);
    const base = cloudClass || localClass!;
    const mergedStudents = Array.from(new Set([...(localClass?.students || []), ...(cloudClass?.students || [])])).sort();
    return {
      ...base,
      students: mergedStudents,
    };
  });
};

const writeLocalCache = (schoolData: ClassData[], submissions: Submission[]) => {
  localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(schoolData));
  localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(submissions));
};

const fetchCloudState = async () => {
  const res = await fetch('/api/state', { method: 'GET' });
  if (!res.ok) throw new Error(`Cloud read failed: ${res.status}`);
  const payload = await res.json();
  return payload?.data || null;
};

const saveCloudState = async (schoolData: ClassData[], submissions: Submission[]) => {
  const res = await fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolData, submissions }),
  });
  if (!res.ok) throw new Error(`Cloud save failed: ${res.status}`);
};

export const useAmaliyah = () => {
  const ctx = useContext(AmaliyahContext);
  if (!ctx) throw new Error('useAmaliyah must be used within AmaliyahProvider');
  return ctx;
};

export const AmaliyahProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem('amaliyah_user_role'));
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [schoolData, setSchoolData] = useState<ClassData[]>(DEFAULT_CLASSES);
  const [notification, setNotification] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const hasMigrated = localStorage.getItem(MIGRATION_FLAG_KEY) === '1';

      const rawCurrentSchool = localStorage.getItem(SCHOOL_STORAGE_KEY);
      const hasCurrentSchool = rawCurrentSchool !== null;
      const currentSchool = parseStoredArray<ClassData>(rawCurrentSchool);
      const legacySchool = hasMigrated
        ? []
        : LEGACY_SCHOOL_KEYS.flatMap((key) => parseStoredArray<ClassData>(localStorage.getItem(key)));
      const schoolToUse = hasCurrentSchool ? currentSchool : legacySchool;
      const normalizedSchool = hasCurrentSchool ? schoolToUse : (schoolToUse.length > 0 ? schoolToUse : DEFAULT_CLASSES);

      const rawCurrentSubs = localStorage.getItem(SUBMISSION_STORAGE_KEY);
      const hasCurrentSubs = rawCurrentSubs !== null;
      const currentSubs = parseStoredArray<Submission>(rawCurrentSubs);
      const legacySubs = hasMigrated
        ? []
        : LEGACY_SUBMISSION_KEYS.flatMap((key) => parseStoredArray<Submission>(localStorage.getItem(key)));
      const sourceSubs = hasCurrentSubs ? currentSubs : [...currentSubs, ...legacySubs];
      const normalizedSubs = mergeSubmissions(normalizeSubmissions(sourceSubs, normalizedSchool));

      setSchoolData(normalizedSchool);
      setSubmissions(normalizedSubs);
      writeLocalCache(normalizedSchool, normalizedSubs);

      if (!hasMigrated) {
        [...LEGACY_SUBMISSION_KEYS, ...LEGACY_SCHOOL_KEYS].forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(MIGRATION_FLAG_KEY, '1');
      }

      try {
        const cloud = await fetchCloudState();
        if (cloud) {
          const cloudSchool = Array.isArray(cloud.school_data) ? cloud.school_data as ClassData[] : [];
          const mergedSchool = mergeSchoolData(normalizedSchool, cloudSchool);
          const cloudClassSource = mergedSchool.length > 0 ? mergedSchool : DEFAULT_CLASSES;
          const cloudSubs = mergeSubmissions(normalizeSubmissions(
            Array.isArray(cloud.submissions) ? cloud.submissions as Submission[] : [],
            cloudClassSource,
          ));

          setSchoolData(mergedSchool);
          setSubmissions(cloudSubs);
          writeLocalCache(mergedSchool, cloudSubs);
          await saveCloudState(mergedSchool, cloudSubs);
        } else {
          await saveCloudState(normalizedSchool, normalizedSubs);
        }
      } catch (err) {
        // API may be unavailable in local Vite dev; local cache still works.
        console.error('Cloud sync unavailable, using local cache.', err);
      }

      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (userRole) localStorage.setItem('amaliyah_user_role', userRole);
    else localStorage.removeItem('amaliyah_user_role');
  }, [userRole]);

  useEffect(() => {
    if (!isHydrated) return;
    writeLocalCache(schoolData, submissions);

    const timeoutId = window.setTimeout(() => {
      void saveCloudState(schoolData, submissions).catch((err) => {
        console.error('Cloud save failed, local cache kept.', err);
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isHydrated, schoolData, submissions]);

  const saveSubmission = useCallback((sub: Submission) => {
    setSubmissions((prev) => {
      const filtered = prev.filter((s) => {
        const sameClass = getSubmissionClassKey(s) === getSubmissionClassKey(sub);
        return !(sameClass && s.studentName === sub.studentName && s.date === sub.date);
      });
      return [...filtered, sub];
    });
  }, []);

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setSelectedClass(null);
    setSelectedStudent(null);
    localStorage.removeItem('amaliyah_user_role');
  }, []);

  return (
    <AmaliyahContext.Provider value={{
      userRole, setUserRole,
      isHydrated,
      selectedClass, setSelectedClass,
      selectedStudent, setSelectedStudent,
      submissions, setSubmissions, saveSubmission,
      schoolData, setSchoolData,
      notification, showNotif,
      handleLogout,
    }}>
      {children}
    </AmaliyahContext.Provider>
  );
};
