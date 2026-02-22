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
  const [activeTab, setActiveTab] = useState<'changes' | 'sync'>('changes');

  const handleRoleSelect = (role: string) => {
    setUserRole(role);
    navigate('/classes');
  };

  const openLogPanel = async () => {
    setPinError('');
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/state', {
        method: 'GET',
        headers: {
          'x-log-mode': '1',
          'x-log-pin': pinInput,
          'x-log-limit': '500',
        },
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }
      setLogs(Array.isArray(payload.logs) ? payload.logs : []);
      setPinError('');
    } catch {
      setPinError('PIN salah atau gagal memuat log.');
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

  const syncLogs = filteredLogs.filter((log) => log.event_type === 'state_sync');
  const changeLogs = filteredLogs.filter((log) => log.event_type !== 'state_sync');

  const isDataPokokEvent = (log: ActivityLogItem) =>
    ['class_added', 'class_updated', 'class_removed', 'student_added', 'student_removed', 'backup_restore'].includes(log.event_type) ||
    log.actor_role === 'kesiswaan';

  const getLogCardClass = (log: ActivityLogItem) => {
    if (isDataPokokEvent(log)) {
      return 'border-orange-200 bg-orange-50/70';
    }
    if (log.actor_role === 'student') {
      return 'border-blue-200 bg-blue-50/70';
    }
    if (log.actor_role === 'teacher') {
      return 'border-emerald-200 bg-emerald-50/70';
    }
    return 'border-border bg-card/60';
  };

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
                    setActiveTab('changes');
                  }}
                  className="p-2 bg-secondary rounded-full text-muted-foreground hover:bg-secondary/80"
                >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-border space-y-3">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN log"
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

            <div className="px-4 pt-3 border-b border-border flex items-center gap-2">
              <button
                onClick={() => setActiveTab('changes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'changes'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                Log Perubahan ({changeLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('sync')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'sync'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                Log Sinkronisasi ({syncLogs.length})
              </button>
            </div>

            <div className="h-[calc(85vh-215px)] overflow-auto custom-scrollbar p-4 space-y-2">
              {loadingLogs && <p className="text-sm text-muted-foreground">Memuat log...</p>}
              {!loadingLogs && (activeTab === 'changes' ? changeLogs.length === 0 : syncLogs.length === 0) && (
                <p className="text-sm text-muted-foreground">Belum ada log atau belum dibuka dengan kunci.</p>
              )}
              {!loadingLogs && (activeTab === 'changes' ? changeLogs : syncLogs).map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border ${getLogCardClass(log)}`}>
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
