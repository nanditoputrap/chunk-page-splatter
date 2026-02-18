import { useState } from 'react';
import GlassCard from './GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';

interface DataModalProps {
  type: 'addClass' | 'addStudent';
  classIndex?: number;
  onClose: () => void;
}

const DataModal = ({ type, classIndex, onClose }: DataModalProps) => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const { schoolData, setSchoolData, showNotif } = useAmaliyah();

  const handleSubmit = () => {
    if (type === 'addClass') {
      if (!input1) return showNotif('ID Kelas harus diisi!');
      setSchoolData([...schoolData, { id: input1, name: input1, teacher: input2 || 'Wali Kelas Baru', students: [] }]);
      showNotif('Kelas Berhasil Ditambah');
    } else if (type === 'addStudent' && classIndex !== undefined) {
      if (!input1) return showNotif('Nama siswa kosong!');
      const newStudents = input1.split('\n').map(s => s.trim()).filter(s => s !== '');
      const updated = schoolData.map((cls, idx) => {
        if (idx !== classIndex) return cls;
        const mergedStudents = Array.from(new Set([...cls.students, ...newStudents])).sort();
        return { ...cls, students: mergedStudents };
      });
      setSchoolData(updated);
      showNotif(`${newStudents.length} Siswa Ditambahkan`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-in fade-in">
      <GlassCard className="p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-foreground mb-4">
          {type === 'addClass' ? 'Tambah Kelas Baru' : 'Tambah Siswa'}
        </h3>
        {type === 'addClass' && (
          <>
            <label className="block text-xs font-bold text-muted-foreground mb-1">ID Kelas (Contoh: 7A)</label>
            <input type="text" value={input1} onChange={(e) => setInput1(e.target.value)}
              className="w-full border border-border bg-card p-2 rounded mb-3 outline-none focus:border-primary" />
            <label className="block text-xs font-bold text-muted-foreground mb-1">Nama Wali Kelas</label>
            <input type="text" value={input2} onChange={(e) => setInput2(e.target.value)}
              className="w-full border border-border bg-card p-2 rounded mb-4 outline-none focus:border-primary" />
          </>
        )}
        {type === 'addStudent' && (
          <>
            <label className="block text-xs font-bold text-muted-foreground mb-1">Nama Siswa (Bisa banyak, pisahkan baris)</label>
            <textarea rows={5} value={input1} onChange={(e) => setInput1(e.target.value)}
              className="w-full border border-border bg-card p-2 rounded mb-4 outline-none focus:border-primary resize-none"
              placeholder={"Budi Santoso\nSiti Aminah\nAhmad..."} />
          </>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-muted-foreground font-bold bg-secondary rounded-lg">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:opacity-90">Simpan</button>
        </div>
      </GlassCard>
    </div>
  );
};

export default DataModal;
