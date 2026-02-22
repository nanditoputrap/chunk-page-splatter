import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, ArrowLeft, Plus, Trash2, X, Save } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import DataModal from '@/components/DataModal';
import { useAmaliyah } from '@/context/AmaliyahContext';

const ClassSelectPage = () => {
  const navigate = useNavigate();
  const { userRole, setSelectedClass, schoolData, setSchoolData, showNotif, syncDataNow } = useAmaliyah();
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDataPokok, setIsSavingDataPokok] = useState(false);
  const [dataModal, setDataModal] = useState<{ show: boolean; type: 'addClass' | 'addStudent' | null; classIndex?: number }>({ show: false, type: null });
  const legacySeedClassIds = new Set(['7A', '8A', '9A']);
  const hasStructuredClasses = schoolData.some((c) => /^[789][AB][12]$/.test(String(c.id || '').trim()));
  const visibleSchoolData = schoolData
    .map((cls, index) => ({ cls, index }))
    .filter(({ cls }) => !hasStructuredClasses || !legacySeedClassIds.has(String(cls.id || '').trim()));

  const handleUpdateClass = (classIndex: number, field: string, value: string) => {
    const newData = schoolData.map((cls, idx) => (
      idx === classIndex ? { ...cls, [field]: value } : cls
    ));
    setSchoolData(newData);
  };

  const handleDeleteClass = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (confirm('Hapus Kelas beserta seluruh isinya?')) {
      const newData = [...schoolData];
      newData.splice(index, 1);
      setSchoolData(newData);
    }
  };

  const handleDeleteStudent = (e: React.MouseEvent, classIndex: number, studentIndex: number) => {
    e.stopPropagation();
    if (confirm('Hapus siswa ini?')) {
      const newData = schoolData.map((cls, idx) => {
        if (idx !== classIndex) return cls;
        return { ...cls, students: cls.students.filter((_, sIdx) => sIdx !== studentIndex) };
      });
      setSchoolData(newData);
    }
  };

  const handleUpdateStudent = (classIndex: number, studentIndex: number, value: string) => {
    const newData = schoolData.map((cls, idx) => {
      if (idx !== classIndex) return cls;
      const students = cls.students.map((std, sIdx) => (sIdx === studentIndex ? value : std));
      return { ...cls, students };
    });
    setSchoolData(newData);
  };

  const handleSaveDataPokok = async () => {
    // Force a fresh reference to ensure sync side-effects run.
    const refreshed = schoolData.map((cls) => ({ ...cls, students: [...cls.students] }));
    setSchoolData(refreshed);
    setIsSavingDataPokok(true);
    try {
      await syncDataNow(refreshed);
      showNotif('Perubahan data pokok disimpan');
    } catch {
      showNotif('Gagal sinkron ke server. Coba lagi.');
    } finally {
      setIsSavingDataPokok(false);
    }
  };

  const handleClassClick = (cls: typeof schoolData[0]) => {
    if (userRole === 'kesiswaan' && isEditing) return;
    setSelectedClass(cls);
    const base = `/classes/${cls.id}`;
    if (!userRole) {
      // no role selected yet, go to landing page for class
      navigate(base);
    } else {
      navigate(userRole === 'student' ? `${base}/students` : `${base}/dashboard`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 animate-in slide-in-from-bottom duration-500">
      <div className="text-center mb-8 flex flex-col items-center relative">
        <h2 className="text-2xl font-bold text-foreground">
          {userRole === 'kesiswaan' ? (isEditing ? 'Edit Data Pokok Sekolah' : 'Panel Kesiswaan') : 'Pilih Kelas'}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {userRole === 'kesiswaan' ? (isEditing ? 'Kelola Data Kelas, Guru & Siswa' : 'Pilih kelas untuk melihat monitoring') : 'Silakan pilih kelas Anda'}
        </p>
        {userRole === 'kesiswaan' && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                isEditing ? 'bg-secondary text-foreground' : 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              }`}>
              {isEditing ? <ArrowLeft size={14} /> : <Settings size={14} />}
              {isEditing ? 'Kembali ke Monitoring' : 'Edit Data Pokok Sekolah'}
            </button>
            {isEditing && (
              <>
                <button onClick={() => setDataModal({ show: true, type: 'addClass' })}
                  className="px-4 py-2 bg-card border border-border text-muted-foreground rounded-full text-xs font-bold hover:bg-secondary flex items-center gap-1 transition">
                  <Plus size={14} /> Tambah Kelas
                </button>
                <button
                  onClick={() => void handleSaveDataPokok()}
                  disabled={isSavingDataPokok}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold hover:opacity-90 flex items-center gap-1 transition disabled:opacity-60"
                >
                  <Save size={14} /> {isSavingDataPokok ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleSchoolData.map(({ cls, index: realIndex }) => (
          <GlassCard key={cls.id} onClick={() => handleClassClick(cls)}
            className={`p-6 relative group overflow-hidden ${
              userRole === 'kesiswaan' && isEditing ? '' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
            }`}>
            {userRole === 'kesiswaan' && isEditing ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded">ID: {cls.id}</span>
                  <button onClick={(e) => handleDeleteClass(e, realIndex)} className="text-destructive/50 hover:text-destructive bg-destructive/5 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                <input type="text" value={cls.name} onChange={(e) => handleUpdateClass(realIndex, 'name', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-card/50 border border-border rounded px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-ring outline-none" />
                <input type="text" value={cls.teacher} onChange={(e) => handleUpdateClass(realIndex, 'teacher', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-card/50 border border-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-ring outline-none" />
                <div className="pt-2 border-t border-border mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Siswa ({cls.students.length})</span>
                    <button onClick={(e) => { e.stopPropagation(); setDataModal({ show: true, type: 'addStudent', classIndex: realIndex }); }}
                      className="text-purple-600 text-[10px] font-bold hover:underline bg-purple-50 px-2 py-0.5 rounded">+ Tambah</button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {cls.students.map((std, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center text-xs bg-secondary/50 p-2 rounded border border-border">
                        <input
                          type="text"
                          value={std}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateStudent(realIndex, sIdx, e.target.value)}
                          className="flex-1 bg-transparent outline-none text-foreground pr-2"
                        />
                        <button onClick={(e) => handleDeleteStudent(e, realIndex, sIdx)} className="text-muted-foreground hover:text-destructive">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative z-10">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Kelas</span>
                  <h3 className="text-3xl font-bold text-foreground mb-1">{cls.id}</h3>
                  <p className="font-medium text-foreground/80 mb-4">{cls.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/40 p-2 rounded-lg w-fit">
                    <Users size={12} />{cls.teacher}
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        ))}
      </div>

      {dataModal.show && dataModal.type && (
        <DataModal
          type={dataModal.type}
          classIndex={dataModal.classIndex}
          onClose={() => setDataModal({ show: false, type: null })}
        />
      )}
    </div>
  );
};

export default ClassSelectPage;
