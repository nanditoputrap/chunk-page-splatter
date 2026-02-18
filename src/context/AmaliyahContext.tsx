import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClassData, Submission, DEFAULT_CLASSES } from '@/lib/constants';

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

  useEffect(() => {
    const currentSchool = parseStoredArray<ClassData>(localStorage.getItem(SCHOOL_STORAGE_KEY));
    const legacySchool = LEGACY_SCHOOL_KEYS.flatMap((key) => parseStoredArray<ClassData>(localStorage.getItem(key)));
    const schoolToUse = currentSchool.length > 0 ? currentSchool : legacySchool;
    const classSource = schoolToUse.length > 0 ? schoolToUse : DEFAULT_CLASSES;
    const classesByName = new Map(classSource.map((c) => [c.name, c.id]));
    if (schoolToUse.length > 0) {
      setSchoolData(schoolToUse);
      localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(schoolToUse));
    }

    const currentSubs = parseStoredArray<Submission>(localStorage.getItem(SUBMISSION_STORAGE_KEY));
    const legacySubs = LEGACY_SUBMISSION_KEYS.flatMap((key) => parseStoredArray<Submission>(localStorage.getItem(key)));
    const normalizedSubs = [...currentSubs, ...legacySubs].map((sub) => ({
      ...sub,
      classId: sub.classId || classesByName.get(sub.className),
    }));
    const mergedSubs = mergeSubmissions(normalizedSubs);
    if (mergedSubs.length > 0) {
      setSubmissions(mergedSubs);
      localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(mergedSubs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(schoolData));
  }, [schoolData]);

  const saveSubmission = useCallback((sub: Submission) => {
    setSubmissions(prev => {
      const filtered = prev.filter((s) => {
        const sameClass = getSubmissionClassKey(s) === getSubmissionClassKey(sub);
        return !(sameClass && s.studentName === sub.studentName && s.date === sub.date);
      });
      const updated = [...filtered, sub];
      localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(updated));
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
