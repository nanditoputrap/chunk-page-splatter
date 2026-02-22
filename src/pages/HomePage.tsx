import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Lock, UserCheck, History, X, Search } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';

type ActivityLogItem = {
  id: number;
  event_type: string;
  message: string;
  actor_role: string | null;
  class_id: string | null;
  student_name: string | null;
  event_date: string | null;
  device_type: string | null;
  browser: string | null;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
};

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { setUserRole } = useAmaliyah();
  const [showLogModal, setShowLogModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [logFilter, setLogFilter] = useState('');

  const handleRoleSelect = (role: string) => {
    setUserRole(role);
    navigate('/classes');
  };

  const openLogPanel = async () => {
    setPinError('');
    if (pinInput !== '2167') {
      setPinError('Kunci salah.');
      return;
    }
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-log-pin': pinInput },
        body: JSON.stringify({ adminAction: 'getLogs', pin: pinInput, limit: 500 }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
      setLogs(Array.isArray(payload.logs) ? payload.logs : []);
      setPinError('');
    } catch {
      setPinError('Gagal memuat log.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = logFilter.trim().toLowerCase();
    if (!q) return true;
    return [
      log.message,
      log.actor_role || '',
      log.class_id || '',
      log.student_name || '',
      log.device_type || '',
      log.browser || '',
    ].join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700 p-6 relative">
      <button
        onClick={() => setShowLogModal(true)}
        className="absolute top-6 right-8 w-12 h-12 rounded-full bg-card border border-border text-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center justify-center"
        title="Lihat Log Aktivitas"
        aria-label="Lihat Log Aktivitas"
      >
        <History size={18} />
      </button>

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

      {showLogModal && (
        <div className="fixed inset-0 z-[300] bg-card/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <GlassCard className="w-full max-w-5xl h-[85vh] p-0 overflow-hidden border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Log Aktivitas Sistem</h3>
                <p className="text-xs text-muted-foreground">Semua perubahan pengisian/data siswa-guru.</p>
              </div>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setPinInput('');
                  setPinError('');
                  setLogFilter('');
                }}
                className="p-2 bg-secondary rounded-full text-muted-foreground hover:bg-secondary/80"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-border space-y-3">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan kunci log (2167)"
                  className="w-full md:w-64 bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => void openLogPanel()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition"
                >
                  Buka Log
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <Search size={14} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Cari log..."
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              {pinError && <p className="text-xs text-destructive font-semibold">{pinError}</p>}
            </div>

            <div className="h-[calc(85vh-170px)] overflow-auto custom-scrollbar p-4 space-y-2">
              {loadingLogs && <p className="text-sm text-muted-foreground">Memuat log...</p>}
              {!loadingLogs && filteredLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada log atau belum dibuka dengan kunci.</p>
              )}
              {!loadingLogs && filteredLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-border bg-card/60">
                  <p className="text-sm font-semibold text-foreground">{log.message}</p>
                  <div className="mt-1 text-[11px] text-muted-foreground grid md:grid-cols-3 gap-x-3 gap-y-1">
                    <span>Waktu: {new Date(log.created_at).toLocaleString('id-ID')}</span>
                    <span>Role: {log.actor_role || '-'}</span>
                    <span>Aksi: {log.event_type}</span>
                    <span>Kelas: {log.class_id || '-'}</span>
                    <span>Siswa: {log.student_name || '-'}</span>
                    <span>Tanggal data: {log.event_date || '-'}</span>
                    <span>Perangkat: {log.device_type || '-'}</span>
                    <span>Browser: {log.browser || '-'}</span>
                    <span>IP: {log.ip || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
