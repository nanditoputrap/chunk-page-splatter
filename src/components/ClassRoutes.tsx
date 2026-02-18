import { useEffect, useState } from 'react';
import { useParams, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAmaliyah } from '@/context/AmaliyahContext';
import StudentSelectPage from '@/pages/StudentSelectPage';
import FormPage from '@/pages/FormPage';
import TeacherDashboardPage from '@/pages/TeacherDashboardPage';
import NotFound from '@/pages/NotFound';
import PinModal from '@/components/PinModal';

const LoadingDots = ({ text }: { text: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-2.5 h-2.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
      <span className="w-2.5 h-2.5 rounded-full bg-primary/70 animate-bounce" />
    </div>
    <p className="text-sm">{text}</p>
  </div>
);

const ClassRoutes = () => {
  const { classId } = useParams<{ classId: string }>();
  const { schoolData, setSelectedClass, userRole, setUserRole, selectedClass, isHydrated } = useAmaliyah();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isHydrated) return;
    if (classId) {
      const cls = schoolData.find(c => c.id === classId);
      if (cls) {
        setSelectedClass(cls);
      } else {
        // if the class id does not exist we clear selection
        setSelectedClass(null);
      }
    }
  }, [classId, schoolData, setSelectedClass, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!userRole && (location.pathname.endsWith('/students') || location.pathname.endsWith('/form'))) {
      setUserRole('student');
    }
  }, [isHydrated, location.pathname, userRole, setUserRole]);

  if (!classId) {
    return <Navigate to="/classes" replace />;
  }

  if (!isHydrated) {
    return <LoadingDots text="Memuat data kelas..." />;
  }

  const resolvedClass = schoolData.find((c) => c.id === classId) || null;
  if (!resolvedClass) {
    return <NotFound />;
  }

  if (!selectedClass || selectedClass.id !== classId) {
    return <LoadingDots text="Memuat data kelas..." />;
  }

  // landing page when hitting /classes/:classId
  const ClassHome = () => {
    const [pinModal, setPinModal] = useState<{ show: boolean; role: string | null }>({ show: false, role: null });

    useEffect(() => {
      if (!selectedClass) return;
      // auto-redirect based on role; assume 'student' for visitors
      if (userRole === 'student') {
        navigate(`/classes/${selectedClass.id}/students`);
      } else if (userRole === 'teacher' || userRole === 'kesiswaan') {
        navigate(`/classes/${selectedClass.id}/dashboard`);
      } else {
        setUserRole('student');
        navigate(`/classes/${selectedClass.id}/students`);
      }
    }, [userRole, selectedClass, navigate, setUserRole]);

    const handleRole = (role: string) => {
      if (role === 'student') {
        setUserRole('student');
        navigate(`/classes/${selectedClass?.id}/students`);
      } else {
        setPinModal({ show: true, role });
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-4xl font-bold mb-6">Amaliyah Ramadhan</h1>
        <p className="text-muted-foreground mb-6">Open the link — you will be routed based on your role.</p>
        {!userRole && (
          <div className="flex gap-4">
            <button onClick={() => handleRole('student')} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold">Siswa</button>
            <button onClick={() => handleRole('teacher')} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold">Guru</button>
            <button onClick={() => handleRole('kesiswaan')} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold">Kesiswaan</button>
          </div>
        )}

        {pinModal.show && pinModal.role && (
          <PinModal
            role={pinModal.role}
            onSuccess={() => {
              setUserRole(pinModal.role!);
              setPinModal({ show: false, role: null });
              if (pinModal.role === 'teacher' || pinModal.role === 'kesiswaan') {
                navigate(`/classes/${selectedClass?.id}/dashboard`);
              }
            }}
            onClose={() => setPinModal({ show: false, role: null })}
          />
        )}
      </div>
    );
  };

  // If neither student nor teacher, show a login prompt when accessing dashboard
  const DashboardLogin = () => {
    const [pinModal, setPinModal] = useState<{ show: boolean; role: string | null }>({ show: false, role: null });
    const navigate = useNavigate();

    const chooseRole = (role: string) => {
      setPinModal({ show: true, role });
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-3xl font-bold mb-4">Masuk Guru / Kesiswaan</h1>
        <div className="flex gap-4">
          <button
            onClick={() => chooseRole('teacher')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold"
          >
            Guru
          </button>
          <button
            onClick={() => chooseRole('kesiswaan')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold"
          >
            Kesiswaan
          </button>
        </div>
        {pinModal.show && pinModal.role && (
          <PinModal
            role={pinModal.role}
            onSuccess={() => {
              setUserRole(pinModal.role!);
              setPinModal({ show: false, role: null });
              navigate(`/classes/${selectedClass?.id}/dashboard`);
            }}
            onClose={() => navigate(`/classes`)}
          />
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route index element={<ClassHome />} />
      <Route
        path="students"
        element={
          userRole === 'teacher' || userRole === 'kesiswaan' ? (
            <Navigate to="/classes" replace />
          ) : (
            <StudentSelectPage />
          )
        }
      />
      <Route
        path="form"
        element={
          userRole === 'teacher' || userRole === 'kesiswaan' ? (
            <Navigate to="/classes" replace />
          ) : (
            <FormPage />
          )
        }
      />
      <Route
        path="dashboard"
        element={
          userRole === 'student' ? (
            <Navigate to="/classes" replace />
          ) : userRole ? (
            <TeacherDashboardPage />
          ) : (
            <DashboardLogin />
          )
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ClassRoutes;
