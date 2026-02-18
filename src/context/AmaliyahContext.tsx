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
    const savedSubs = localStorage.getItem('amaliyah_glass_data_v2');
    if (savedSubs) setSubmissions(JSON.parse(savedSubs));
    const savedSchool = localStorage.getItem('amaliyah_school_data');
    if (savedSchool) setSchoolData(JSON.parse(savedSchool));
  }, []);

  useEffect(() => {
    localStorage.setItem('amaliyah_school_data', JSON.stringify(schoolData));
  }, [schoolData]);

  const saveSubmission = useCallback((sub: Submission) => {
    setSubmissions(prev => {
      const filtered = prev.filter(s => !(s.studentName === sub.studentName && s.date === sub.date));
      const updated = [...filtered, sub];
      localStorage.setItem('amaliyah_glass_data_v2', JSON.stringify(updated));
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
