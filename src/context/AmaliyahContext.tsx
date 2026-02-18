import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClassData, Submission, DEFAULT_CLASSES } from '@/lib/constants';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AmaliyahContextType {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
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
const CLOUD_STATE_ID = 'main';
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

const normalizeSubmissions = (submissions: Submission[], classes: ClassData[]) => {
  const classesByName = new Map(classes.map((c) => [c.name, c.id]));
  return submissions.map((sub) => ({
    ...sub,
    classId: sub.classId || classesByName.get(sub.className),
  }));
};

const mergeSubmissions = (submissions: Submission[]) => {
  const unique = new Map<string, Submission>();
  submissions.forEach((sub) => {
    const key = `${getSubmissionClassKey(sub)}::${sub.studentName}::${sub.date}`;
    unique.set(key, sub);
  });
  return Array.from(unique.values());
};

export const useAmaliyah = () => {
  const ctx = useContext(AmaliyahContext);
  if (!ctx) throw new Error('useAmaliyah must be used within AmaliyahProvider');
  return ctx;
};

export const AmaliyahProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
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
      const classSource = normalizedSchool.length > 0 ? normalizedSchool : DEFAULT_CLASSES;

      const rawCurrentSubs = localStorage.getItem(SUBMISSION_STORAGE_KEY);
      const hasCurrentSubs = rawCurrentSubs !== null;
      const currentSubs = parseStoredArray<Submission>(rawCurrentSubs);
      const legacySubs = hasMigrated
        ? []
        : LEGACY_SUBMISSION_KEYS.flatMap((key) => parseStoredArray<Submission>(localStorage.getItem(key)));
      const sourceSubs = hasCurrentSubs ? currentSubs : [...currentSubs, ...legacySubs];
      const normalizedSubs = mergeSubmissions(normalizeSubmissions(sourceSubs, classSource));

      setSchoolData(normalizedSchool);
      setSubmissions(normalizedSubs);
      localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(normalizedSchool));
      localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(normalizedSubs));

      if (!hasMigrated) {
        [...LEGACY_SUBMISSION_KEYS, ...LEGACY_SCHOOL_KEYS].forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(MIGRATION_FLAG_KEY, '1');
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('app_state')
            .select('id, school_data, submissions')
            .eq('id', CLOUD_STATE_ID)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            const cloudSchool = Array.isArray(data.school_data) ? (data.school_data as ClassData[]) : [];
            const cloudClassSource = cloudSchool.length > 0 ? cloudSchool : DEFAULT_CLASSES;
            const cloudSubsRaw = Array.isArray(data.submissions) ? (data.submissions as Submission[]) : [];
            const cloudSubs = mergeSubmissions(normalizeSubmissions(cloudSubsRaw, cloudClassSource));
            setSchoolData(cloudSchool);
            setSubmissions(cloudSubs);
            localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(cloudSchool));
            localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(cloudSubs));
          } else {
            await supabase.from('app_state').upsert({
              id: CLOUD_STATE_ID,
              school_data: normalizedSchool,
              submissions: normalizedSubs,
            });
          }
        } catch (err) {
          console.error('Supabase hydration failed. Falling back to local cache.', err);
        }
      }

      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(schoolData));
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(submissions));

    if (!isSupabaseConfigured || !supabase) return;
    const timeoutId = window.setTimeout(() => {
      void supabase
        .from('app_state')
        .upsert({
          id: CLOUD_STATE_ID,
          school_data: schoolData,
          submissions,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase sync failed', error);
          }
        });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isHydrated, schoolData, submissions]);

  const saveSubmission = useCallback((sub: Submission) => {
    setSubmissions(prev => {
      const filtered = prev.filter((s) => {
        const sameClass = getSubmissionClassKey(s) === getSubmissionClassKey(sub);
        return !(sameClass && s.studentName === sub.studentName && s.date === sub.date);
      });
      const updated = [...filtered, sub];
      return updated;
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
  }, []);

  return (
    <AmaliyahContext.Provider value={{
      userRole, setUserRole,
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
