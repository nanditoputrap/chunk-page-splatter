import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Lock, UserCheck } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { setUserRole } = useAmaliyah();

  const handleRoleSelect = (role: string) => {
    setUserRole(role);
    navigate('/classes');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700 p-6 relative">
      <div className="text-center mb-8 relative">
        <div className="w-24 h-24 glass-card rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
          <BookOpen size={48} className="text-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Amaliyah Ramadhan</h1>
        <p className="text-muted-foreground font-medium tracking-wide opacity-80">SMPIT IKHTIAR UNHAS</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        <GlassCard
          onClick={() => handleRoleSelect('student')}
          className="w-64 h-40 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 shadow-2xl"
        >
          <Users size={36} className="text-primary" />
          <span className="text-xl font-bold text-primary">Siswa</span>
        </GlassCard>
        <GlassCard
          onClick={() => handleRoleSelect('teacher')}
          className="w-64 h-40 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 shadow-2xl"
        >
          <Lock size={36} className="text-emerald-700" />
          <span className="text-xl font-bold text-emerald-700">Guru</span>
        </GlassCard>
        <GlassCard
          onClick={() => handleRoleSelect('kesiswaan')}
          className="w-64 h-40 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 shadow-2xl"
        >
          <UserCheck size={36} className="text-purple-700" />
          <span className="text-xl font-bold text-purple-700">Kesiswaan</span>
        </GlassCard>
      </div>
      <p className="absolute bottom-6 text-xs text-muted-foreground font-medium">Created by dito</p>
    </div>
  );
};

export default HomeDashboard;
