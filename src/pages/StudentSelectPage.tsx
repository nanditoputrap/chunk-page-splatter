import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAmaliyah } from '@/context/AmaliyahContext';

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

const StudentSelectPage = () => {
  const navigate = useNavigate();
  const { selectedClass, setSelectedStudent } = useAmaliyah();
  const [searchTerm, setSearchTerm] = useState('');

  if (!selectedClass) {
    return <LoadingDots text="Memuat data siswa..." />;
  }

  const filteredStudents = (selectedClass.students || []).filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in slide-in-from-right duration-500 min-h-screen flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Halo, Siswa {selectedClass.id}</h2>
        <p className="text-muted-foreground text-sm">Siapa nama Anda?</p>
      </div>

      <div className="sticky top-16 z-20 bg-background/90 backdrop-blur pb-4 pt-2">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Cari nama Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card shadow-sm border border-border rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student, idx) => (
            <GlassCard key={idx} onClick={() => {
                setSelectedStudent(student);
                navigate(`/classes/${selectedClass?.id}/form`);
            }}
              className="p-5 cursor-pointer hover:bg-primary/5 active:scale-95 flex flex-row items-center gap-4 group transition-all">
              <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-gradient-to-br from-primary/10 to-indigo-50 border border-card flex items-center justify-center text-primary font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                {student.charAt(0)}
              </div>
              <h4 className="font-semibold text-foreground text-sm md:text-base group-hover:text-primary leading-tight">{student}</h4>
              <ChevronRight size={18} className="ml-auto text-muted-foreground/40 group-hover:text-primary" />
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-muted-foreground text-sm">Nama tidak ditemukan.</div>
        )}
      </div>
    </div>
  );
};

export default StudentSelectPage;
