import { useState } from 'react';
import { Eye, X, Check, Printer, FileText, BarChart2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import SimpleBarChart from '@/components/SimpleBarChart';
import { useAmaliyah } from '@/context/AmaliyahContext';
import { getStats } from '@/lib/stats';
import { generateDateRange, KEPALA_SEKOLAH, KESISWAAN_NAME } from '@/lib/constants';
import { formatLocalYmd } from '@/lib/date';

const TeacherDashboardPage = () => {
  const { selectedClass, submissions } = useAmaliyah();
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<string | null>(null);

  if (!selectedClass) return <div className="p-10 text-center">Silakan pilih kelas terlebih dahulu.</div>;

  const totalStudents = selectedClass.students.length || 1;
  const counts = { puasa: 0, sholat: 0, tarawih: 0, rawatib: 0, tilawah: 0, dzikir: 0, dhuha: 0, tahajjud: 0, birrul: 0, ceramah: 0, takjil: 0, sedekah: 0 };

  selectedClass.students.forEach(std => {
    const stats = getStats(std, selectedClass.name, submissions, selectedClass.id);
    if (stats.puasa >= 25) counts.puasa++;
    if (stats.sholat >= 25) counts.sholat++;
    if (stats.tarawih >= 20) counts.tarawih++;
    if (stats.rawatib >= 25) counts.rawatib++;
    if (stats.tilawah >= 15) counts.tilawah++;
    if (stats.dzikir >= 20) counts.dzikir++;
    if (stats.dhuha >= 15) counts.dhuha++;
    if (stats.tahajjud >= 5) counts.tahajjud++;
    if (stats.birrul >= 25) counts.birrul++;
    if (stats.ceramah >= 10) counts.ceramah++;
    if (stats.takjil >= 2) counts.takjil++;
    if (stats.sedekah >= 4) counts.sedekah++;
  });

  const chartData = [
    { label: 'Puasa', shortLabel: 'Puasa', value: counts.puasa, percentage: Math.round((counts.puasa / totalStudents) * 100), color: 'bg-emerald-500' },
    { label: 'Sholat 5 Wkt', shortLabel: 'Sholat', value: counts.sholat, percentage: Math.round((counts.sholat / totalStudents) * 100), color: 'bg-blue-500' },
    { label: 'Tarawih', shortLabel: 'Tarawih', value: counts.tarawih, percentage: Math.round((counts.tarawih / totalStudents) * 100), color: 'bg-purple-500' },
    { label: 'Rawatib', shortLabel: 'Rawatib', value: counts.rawatib, percentage: Math.round((counts.rawatib / totalStudents) * 100), color: 'bg-orange-500' },
    { label: 'Tilawah', shortLabel: 'Tilawah', value: counts.tilawah, percentage: Math.round((counts.tilawah / totalStudents) * 100), color: 'bg-amber-500' },
    { label: 'Dzikir', shortLabel: 'Dzikir', value: counts.dzikir, percentage: Math.round((counts.dzikir / totalStudents) * 100), color: 'bg-teal-400' },
    { label: 'Dhuha', shortLabel: 'Dhuha', value: counts.dhuha, percentage: Math.round((counts.dhuha / totalStudents) * 100), color: 'bg-yellow-400' },
    { label: 'Tahajjud', shortLabel: 'Tahajjud', value: counts.tahajjud, percentage: Math.round((counts.tahajjud / totalStudents) * 100), color: 'bg-indigo-400' },
    { label: 'Birrul', shortLabel: 'Birrul', value: counts.birrul, percentage: Math.round((counts.birrul / totalStudents) * 100), color: 'bg-rose-400' },
    { label: 'Ceramah', shortLabel: 'Ceramah', value: counts.ceramah, percentage: Math.round((counts.ceramah / totalStudents) * 100), color: 'bg-cyan-500' },
    { label: 'Takjil', shortLabel: 'Takjil', value: counts.takjil, percentage: Math.round((counts.takjil / totalStudents) * 100), color: 'bg-lime-500' },
    { label: 'Sedekah', shortLabel: 'Sedekah', value: counts.sedekah, percentage: Math.round((counts.sedekah / totalStudents) * 100), color: 'bg-green-600' },
  ];

  const handlePrint = (mode: string) => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <GlassCard className="mb-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Rekapitulasi Bulanan</h2>
            <p className="text-muted-foreground text-sm">{selectedClass.name} — {selectedClass.teacher}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handlePrint('daily')} className="flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-xl text-xs font-bold hover:bg-secondary transition shadow-sm">
              <Printer size={16} /> Laporan Harian
            </button>
            <button onClick={() => handlePrint('monthly')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition shadow-lg">
              <FileText size={16} /> Laporan Bulanan
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Table */}
      <GlassCard className="overflow-hidden p-0 mb-6">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-secondary/80 text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-border">
              <tr>
                <th className="p-5 sticky left-0 bg-secondary z-10 w-40">Nama Siswa</th>
                {['Puasa', 'Sholat', 'Tarawih', 'Rawatib', 'Tilawah', 'Dzikir', 'Dhuha', 'Tahajjud', 'Birrul', 'Ceramah', 'Takjil', 'Sedekah'].map(h => (
                  <th key={h} className="p-5 text-center">{h}</th>
                ))}
                <th className="p-5 text-center bg-primary/5 text-primary w-24">Persentase</th>
                <th className="p-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-medium text-foreground">
              {selectedClass.students.map((student, idx) => {
                const stats = getStats(student, selectedClass.name, submissions, selectedClass.id);
                return (
                  <tr key={idx} className="hover:bg-secondary/30 transition cursor-pointer" onClick={() => setViewingStudent(student)}>
                    <td className="p-5 sticky left-0 bg-card/40 backdrop-blur-sm font-semibold">
                      {student}
                      {stats.haid > 0 && <span className="block text-[9px] text-pink-500 mt-0.5 font-normal">Haid: {stats.haid} hari</span>}
                    </td>
                    <td className="p-5 text-center"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${stats.puasa >= 25 ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>{stats.puasa}</span></td>
                    <td className="p-5 text-center text-muted-foreground">{stats.sholat}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.tarawih}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.rawatib}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.tilawah}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.dzikir}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.dhuha}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.tahajjud}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.birrul}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.ceramah}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.takjil}</td>
                    <td className="p-5 text-center text-muted-foreground">{stats.sedekah}</td>
                    <td className="p-5 text-center bg-primary/5">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-10 h-10 relative flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="hsl(var(--border))" strokeWidth="4" fill="transparent" />
                            <circle cx="20" cy="20" r="16" stroke="hsl(var(--primary))" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - stats.percentage} />
                          </svg>
                          <span className="absolute text-[10px] font-bold text-primary">{stats.percentage}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition"><Eye size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-primary" /> Grafik Keaktifan Kelas (Semua Item)</h3>
        <GlassCard className="p-2">
          <SimpleBarChart data={chartData} />
        </GlassCard>
      </div>

      {/* Student Detail Modal */}
      {viewingStudent && (
        <StudentDetailModal studentName={viewingStudent} className={selectedClass.name} classId={selectedClass.id} teacher={selectedClass.teacher} submissions={submissions} onClose={() => setViewingStudent(null)} />
      )}

      {/* Print View */}
      {printMode && (
        <PrintView mode={printMode} selectedClass={selectedClass} submissions={submissions} onClose={() => setPrintMode(null)} />
      )}
    </div>
  );
};

// Student Detail Modal Component
const StudentDetailModal = ({ studentName, className, classId, teacher, submissions, onClose }: {
  studentName: string; className: string; classId?: string; teacher: string; submissions: any[]; onClose: () => void;
}) => {
  const dates = generateDateRange();
  const studentSubs = submissions.filter((s: any) => s.studentName === studentName && (s.classId ? s.classId === classId : s.className === className));

  const StatusIcon = ({ checked }: { checked: boolean }) => checked ? <Check size={14} className="mx-auto text-emerald-500" /> : <span className="text-muted-foreground/30">-</span>;

  return (
    <div className="fixed inset-0 z-[150] bg-card/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <GlassCard className="w-full max-w-7xl h-[90vh] flex flex-col p-6 overflow-hidden bg-card shadow-2xl border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{studentName}</h2>
            <p className="text-muted-foreground text-sm">Rekapitulasi Detail Bulanan - {className}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition text-muted-foreground"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-auto rounded-xl border border-border custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-secondary sticky top-0 z-10 font-bold text-muted-foreground uppercase">
              <tr>
                <th className="p-3 border-b border-r bg-secondary sticky left-0 z-20">Tanggal</th>
                {['Puasa', 'Sholat (5)', 'Tarawih', 'Rawatib', 'Tilawah', 'Dzikir', 'Dhuha', 'Tahajjud', 'Birrul', 'Ceramah', 'Takjil', 'Sedekah'].map(h => (
                  <th key={h} className="p-3 border-b text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dates.map((date, idx) => {
                const dateStr = formatLocalYmd(date);
                const sub = studentSubs.find((s: any) => s.date === dateStr);
                const isHaid = sub?.isHaid;
                const displayDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                return (
                  <tr key={idx} className="hover:bg-secondary/30 transition">
                    <td className="p-3 font-bold text-foreground border-r bg-card sticky left-0">{displayDate}</td>
                    <td className="p-3 text-center border-r border-border/30">
                      {sub ? (isHaid ? <span className="text-[9px] haid-badge font-bold">HAID</span> :
                        sub.puasa === 'Ya' ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-destructive/30" />) : <span className="text-muted-foreground/30">-</span>}
                    </td>
                    <td className="p-3 text-center border-r border-border/30">
                      {sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> :
                        <div className="flex gap-0.5 justify-center">
                          {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map(p => (
                            <div key={p} className={`w-2 h-2 rounded-full ${sub.sholatWajib[p] ? 'bg-emerald-500' : 'bg-destructive/20'}`} title={p} />
                          ))}
                        </div>) : <span className="text-muted-foreground/30">-</span>}
                    </td>
                    <td className="p-3 text-center border-r border-border/30">{sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> : <StatusIcon checked={sub.tarawih} />) : <span className="text-muted-foreground/30">-</span>}</td>
                    <td className="p-3 text-center border-r border-border/30">{sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> : (parseInt(sub.rawatib) > 0 ? <Check size={14} className="mx-auto text-emerald-500" /> : '-')) : '-'}</td>
                    <td className="p-3 text-center border-r border-border/30 text-[10px] font-medium text-muted-foreground">{sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> : (sub.tilawahQuran ? "Qur'an" : sub.tilawahJilid ? 'Jilid' : '-')) : '-'}</td>
                    <td className="p-3 text-center border-r border-border/30"><StatusIcon checked={sub?.dzikir} /></td>
                    <td className="p-3 text-center border-r border-border/30">{sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> : <StatusIcon checked={sub.dhuha} />) : '-'}</td>
                    <td className="p-3 text-center border-r border-border/30">{sub ? (isHaid ? <span className="text-muted-foreground/30 text-[10px]">Haid</span> : <StatusIcon checked={sub.tahajjud} />) : '-'}</td>
                    <td className="p-3 text-center border-r border-border/30"><StatusIcon checked={sub?.birrul} /></td>
                    <td className="p-3 text-center border-r border-border/30"><StatusIcon checked={sub?.ceramah} /></td>
                    <td className="p-3 text-center border-r border-border/30"><StatusIcon checked={sub?.takjil} /></td>
                    <td className="p-3 text-center"><StatusIcon checked={sub?.sedekah} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

// Print View Component
const PrintView = ({ mode, selectedClass, submissions, onClose }: {
  mode: string; selectedClass: any; submissions: any[]; onClose: () => void;
}) => {
  const targetDate = formatLocalYmd(new Date());

  return (
    <div className="print-container fixed inset-0 z-[200] bg-white text-black p-8 overflow-auto">
      <div className="no-print fixed top-4 right-4 z-[201]">
        <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-red-600 transition flex items-center gap-2"><X size={16} /> Tutup Preview</button>
      </div>
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">SMPIT IKHTIAR UNHAS</h1>
        <h2 className="text-xl font-bold uppercase mt-1">Laporan Amaliyah Ramadhan 1447 H</h2>
        <p className="text-sm mt-1">Jalan Sunu Kompleks UNHAS Baraya, Makassar</p>
      </div>
      <div className="flex justify-between mb-6 font-bold text-sm">
        <div><p>Kelas: {selectedClass?.name}</p><p>Wali Kelas: {selectedClass?.teacher}</p></div>
        <div className="text-right">
          <p>Laporan: {mode === 'monthly' ? 'Rekapitulasi Bulanan' : `Harian (${targetDate})`}</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto overflow-auto">
        <table className="w-full border-collapse border border-black text-[9px] table-auto">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black p-1">No</th>
            <th className="border border-black p-1 text-left">Nama Siswa</th>
            {['Puasa', 'Sholat', 'Tarawih', 'Rawatib', 'Tilawah', 'Dzikir', 'Dhuha', 'Tahajjud', 'Birrul', 'Ceramah', 'Takjil', 'Sedekah'].map(h => (
              <th key={h} className="border border-black p-1">{h}</th>
            ))}
            <th className="border border-black p-1 bg-gray-300 font-bold">{mode === 'monthly' ? '%' : 'Ket'}</th>
          </tr>
        </thead>
        <tbody>
          {selectedClass?.students.map((student: string, idx: number) => {
            const stats = getStats(student, selectedClass.name, submissions, selectedClass.id);
            const studentSubs = submissions.filter((s: any) => s.studentName === student && (s.classId ? s.classId === selectedClass.id : s.className === selectedClass.name));

            let col: any = {};
            if (mode === 'monthly') {
              col = { puasa: stats.puasa, sholat: stats.sholat, tarawih: stats.tarawih, rawatib: stats.rawatib, tilawah: stats.tilawah, dzikir: stats.dzikir, dhuha: stats.dhuha, tahajjud: stats.tahajjud, birrul: stats.birrul, ceramah: stats.ceramah, takjil: stats.takjil, sedekah: stats.sedekah, last: stats.percentage + '%' };
            } else {
              const sub = studentSubs.find((s: any) => s.date === targetDate);
              const isHaid = sub?.isHaid;
              let dailyScore = 0;
              if (sub) {
                if (sub.puasa === 'Ya') dailyScore++;
                if (Object.values(sub.sholatWajib).every((v: any) => v)) dailyScore++;
                if (sub.tarawih) dailyScore++;
                if (parseInt(sub.rawatib) > 0) dailyScore++;
                if (sub.tilawahQuran || sub.tilawahJilid) dailyScore++;
                if (sub.dzikir) dailyScore++;
                if (sub.dhuha) dailyScore++;
                if (sub.tahajjud) dailyScore++;
                if (sub.birrul) dailyScore++;
                if (sub.ceramah) dailyScore++;
                if (sub.takjil) dailyScore++;
                if (sub.sedekah) dailyScore++;
              }
              col = {
                puasa: sub ? (isHaid ? 'H' : (sub.puasa === 'Ya' ? '1' : '0')) : '-',
                sholat: sub ? (isHaid ? 'H' : Object.values(sub.sholatWajib).filter(Boolean).length) : '-',
                tarawih: sub ? (isHaid ? 'H' : (sub.tarawih ? '1' : '0')) : '-',
                rawatib: sub ? (isHaid ? 'H' : (parseInt(sub.rawatib) > 0 ? '1' : '0')) : '-',
                tilawah: sub ? (isHaid ? 'H' : (sub.tilawahQuran || sub.tilawahJilid ? '1' : '0')) : '-',
                dzikir: sub ? (sub.dzikir ? '1' : '0') : '-',
                dhuha: sub ? (isHaid ? 'H' : (sub.dhuha ? '1' : '0')) : '-',
                tahajjud: sub ? (isHaid ? 'H' : (sub.tahajjud ? '1' : '0')) : '-',
                birrul: sub ? (sub.birrul ? '1' : '0') : '-',
                ceramah: sub ? (sub.ceramah ? '1' : '0') : '-',
                takjil: sub ? (sub.takjil ? '1' : '0') : '-',
                sedekah: sub ? (sub.sedekah ? '1' : '0') : '-',
                last: isHaid ? 'Haid' : '',
              };
            }
            return (
              <tr key={idx}>
                <td className="border border-black p-1 text-center">{idx + 1}</td>
                <td className="border border-black p-1">{student}</td>
                {['puasa', 'sholat', 'tarawih', 'rawatib', 'tilawah', 'dzikir', 'dhuha', 'tahajjud', 'birrul', 'ceramah', 'takjil', 'sedekah'].map(k => (
                  <td key={k} className="border border-black p-1 text-center">{col[k]}</td>
                ))}
                <td className={`border border-black p-1 text-center ${mode === 'monthly' ? 'font-bold bg-gray-100' : ''}`}>{col.last}</td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      <div className="mt-16">
        <div className="flex justify-end mb-8">
          <p className="text-right font-medium">Makassar, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex justify-between items-start text-center text-xs font-medium">
          <div className="w-1/3 flex flex-col items-center"><p className="mb-1">Mengetahui,</p><p className="font-bold mb-16">Kepala SMPIT Ikhtiar UNHAS</p><p className="font-bold underline uppercase">{KEPALA_SEKOLAH}</p></div>
          <div className="w-1/3 flex flex-col items-center"><p className="mb-1">Mengetahui,</p><p className="font-bold mb-16">Kesiswaan</p><p className="font-bold underline uppercase">{KESISWAAN_NAME}</p></div>
          <div className="w-1/3 flex flex-col items-center"><p className="mb-1">&nbsp;</p><p className="font-bold mb-16">Wali Kelas</p><p className="font-bold underline uppercase">{selectedClass?.teacher}</p></div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
