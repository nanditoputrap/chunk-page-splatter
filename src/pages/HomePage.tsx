import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight, Lock, UserCheck } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import PinModal from '@/components/PinModal';
import { useAmaliyah } from '@/context/AmaliyahContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { setUserRole } = useAmaliyah();
  const [pinModal, setPinModal] = useState<{ show: boolean; role: string | null }>({ show: false, role: null });

  const handleRoleSelect = (role: string) => {
    if (role === 'student') {
      setUserRole('student');
      navigate('/classes');
    } else {
      setPinModal({ show: true, role });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700 p-6 relative">
      <div className="absolute top-6 right-6 flex gap-3 z-10">
        <button onClick={() => handleRoleSelect('teacher')}
          className="flex items-center gap-2 px-3 py-1.5 glass-card text-emerald-700 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all">
          <Lock size={14} /> Guru
        </button>
        <button onClick={() => handleRoleSelect('kesiswaan')}
          className="flex items-center gap-2 px-3 py-1.5 glass-card text-purple-700 text-xs font-bold hover:bg-purple-500 hover:text-white transition-all">
          <UserCheck size={14} /> Kesiswaan
        </button>
      </div>

      <div className="text-center mb-8 relative">
        <div className="w-24 h-24 glass-card rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
          <BookOpen size={48} className="text-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Amaliyah Ramadhan</h1>
        <p className="text-muted-foreground font-medium tracking-wide opacity-80">SMPIT IKHTIAR UNHAS</p>
      </div>

      <GlassCard
        onClick={() => handleRoleSelect('student')}
        className="w-full max-w-xs aspect-square flex flex-col items-center justify-center gap-6 cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95 transition-all group border-2 shadow-2xl"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner group-hover:rotate-12 transition-transform">
          <Users size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-3xl font-bold text-foreground mb-2">Siswa</h3>
          <p className="text-muted-foreground font-medium">Masuk & Isi Laporan</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-2">
          <ChevronRight size={24} />
        </div>
      </GlassCard>

      <p className="absolute bottom-6 text-xs text-muted-foreground font-medium">© 1447 H / 2026 M</p>

      {pinModal.show && pinModal.role && (
        <PinModal
          role={pinModal.role}
          onSuccess={() => {
            setUserRole(pinModal.role!);
            setPinModal({ show: false, role: null });
            navigate('/classes');
          }}
          onClose={() => setPinModal({ show: false, role: null })}
        />
      )}
    </div>
  );
};

export default HomePage;
