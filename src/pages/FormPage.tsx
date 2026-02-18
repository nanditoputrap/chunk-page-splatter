import { useState, useEffect } from 'react';
import { Moon, Sun, Star, Heart, Coffee, HandHeart, Book, BookOpen, Activity, Check, ChevronLeft, ChevronRight, Edit2, Save } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import CheckboxTile from '@/components/CheckboxTile';
import { useAmaliyah } from '@/context/AmaliyahContext';
import { DEFAULT_FORM, FormData } from '@/lib/constants';
import { formatLocalYmd, parseYmdToLocalDate } from '@/lib/date';

const FormPage = () => {
  const { selectedClass, selectedStudent, submissions, saveSubmission, showNotif } = useAmaliyah();
  const getLocalIsoDate = () => formatLocalYmd(new Date());
  const [formDate, setFormDate] = useState(getLocalIsoDate());
  const [formData, setFormData] = useState<FormData>({ date: getLocalIsoDate(), ...DEFAULT_FORM });

  useEffect(() => {
    if (selectedStudent && selectedClass) {
      const existing = submissions.find(s =>
        s.studentName === selectedStudent && s.className === selectedClass.name && s.date === formDate
      );
      if (existing) {
        setFormData(existing);
      } else {
        setFormData({ date: formDate, ...DEFAULT_FORM });
      }
    }
  }, [formDate, selectedStudent, selectedClass, submissions]);

  if (!selectedClass || !selectedStudent) return null;

  const dateObj = new Date(formDate);
  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const changeDate = (days: number) => {
    const d = parseYmdToLocalDate(formDate);
    d.setDate(d.getDate() + days);
    setFormDate(formatLocalYmd(d));
  };

  const toggleHaid = () => {
    const newVal = !formData.isHaid;
    setFormData({
      ...formData, isHaid: newVal,
      puasa: newVal ? 'Berhalangan' : 'Ya',
      sholatWajib: newVal ? { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false } : formData.sholatWajib,
      tarawih: newVal ? false : formData.tarawih,
      rawatib: newVal ? 0 : formData.rawatib,
      dhuha: newVal ? false : formData.dhuha,
      tahajjud: newVal ? false : formData.tahajjud,
      tilawahQuran: newVal ? false : formData.tilawahQuran,
      tilawahJilid: newVal ? false : formData.tilawahJilid,
    });
  };

  const handleSubmit = () => {
    saveSubmission({
      id: Date.now(),
      studentName: selectedStudent,
      className: selectedClass.name,
      ...formData,
      puasa: formData.isHaid ? 'Berhalangan' : formData.puasa,
      date: formDate,
      timestamp: new Date().toISOString(),
    });
    showNotif('Laporan Berhasil Disimpan!');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 pb-32 animate-in slide-in-from-bottom duration-500">
      {/* Date & Student Info */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <GlassCard className="flex-1 p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400" />
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition"><ChevronLeft size={24} /></button>
          <div className="text-center flex-1 relative">
            <label className="cursor-pointer group">
              <h2 className="text-3xl font-light text-foreground group-hover:text-primary transition">{dayName}</h2>
              <p className="text-muted-foreground text-sm font-medium">{fullDate}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider"><Edit2 size={10} /> Ganti Tanggal</div>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </label>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition"><ChevronRight size={24} /></button>
        </GlassCard>
        <GlassCard className="md:w-1/3 p-6 flex items-center justify-between md:flex-col md:justify-center">
          <div className="text-left md:text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Siswa</span>
            <h3 className="text-lg font-bold text-foreground">{selectedStudent}</h3>
            <p className="text-muted-foreground text-xs">{selectedClass.name}</p>
          </div>
          <div onClick={toggleHaid} className={`cursor-pointer px-4 py-2 rounded-xl border transition-all flex items-center gap-2 mt-2 ${
            formData.isHaid ? 'haid-mode haid-text' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'
          }`}>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              formData.isHaid ? 'bg-pink-500 border-pink-500' : 'bg-card border-muted-foreground/30'
            }`}>{formData.isHaid && <Check size={10} className="text-white" />}</div>
            <span className="text-xs font-bold">Sedang Berhalangan (Haid)</span>
          </div>
        </GlassCard>
      </div>

      {/* Amaliyah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Puasa */}
        <GlassCard className={`p-3 ${formData.isHaid ? 'haid-mode' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl transition-colors ${formData.isHaid ? 'haid-icon' : 'bg-card text-muted-foreground'}`}><Moon size={18} /></div>
            <div><h4 className={`font-bold text-sm ${formData.isHaid ? 'haid-text' : 'text-foreground'}`}>Puasa Ramadhan</h4>{!formData.isHaid && <p className="text-[10px] text-muted-foreground">Status Hari Ini</p>}</div>
          </div>
          {formData.isHaid ? <div className="w-full py-1.5 haid-badge text-center rounded-lg">BERHALANGAN</div> :
            <div className="flex bg-secondary/50 p-1 rounded-lg">
              {['Ya', 'Tidak'].map(opt => (
                <button key={opt} onClick={() => setFormData({ ...formData, puasa: opt })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.puasa === opt ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}>{opt}</button>
              ))}
            </div>}
        </GlassCard>

        {/* Sholat Wajib */}
        <GlassCard className={`p-3 row-span-1 md:col-span-2 lg:col-span-1 ${formData.isHaid ? 'haid-mode' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl transition-colors ${formData.isHaid ? 'haid-icon' : 'bg-card text-muted-foreground'}`}><Sun size={18} /></div>
            <div><h4 className={`font-bold text-sm ${formData.isHaid ? 'haid-text' : 'text-foreground'}`}>Sholat Fardhu</h4>{!formData.isHaid && <p className="text-[10px] text-muted-foreground">Wajib 5 Waktu</p>}</div>
          </div>
          {formData.isHaid ? <div className="w-full py-1.5 haid-badge text-center rounded-lg">BERHALANGAN</div> :
            <div className="flex justify-between px-2">
              {Object.keys(formData.sholatWajib).map((prayer) => (
                <label key={prayer} className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border ${formData.sholatWajib[prayer] ? 'checked-circle text-primary-foreground' : 'bg-card border-border text-muted-foreground/30'}`}>
                    {formData.sholatWajib[prayer] && <Check size={12} />}
                  </div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">{prayer.substr(0, 1)}</span>
                  <input type="checkbox" className="hidden" checked={formData.sholatWajib[prayer]}
                    onChange={() => setFormData({ ...formData, sholatWajib: { ...formData.sholatWajib, [prayer]: !formData.sholatWajib[prayer] } })} />
                </label>
              ))}
            </div>}
        </GlassCard>

        <CheckboxTile title="Sholat Tarawih" subtitle="Qiyamul Lail" icon={Star} targetLabel="Malam" checked={formData.tarawih} onChange={() => setFormData({ ...formData, tarawih: !formData.tarawih })} disabled={formData.isHaid} isHaidMode={formData.isHaid} />

        {/* Tilawah */}
        <GlassCard className={`p-3 ${formData.isHaid ? 'haid-mode' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl transition-colors ${formData.isHaid ? 'haid-icon' : 'bg-card text-muted-foreground'}`}><BookOpen size={18} /></div>
            <div><h4 className={`font-bold text-sm ${formData.isHaid ? 'haid-text' : 'text-foreground'}`}>Tilawah Quran</h4>{!formData.isHaid && <p className="text-[10px] text-muted-foreground">Centang yang dilakukan</p>}</div>
          </div>
          {formData.isHaid ? <div className="w-full py-1.5 haid-badge text-center rounded-lg">BERHALANGAN</div> :
            <div className="space-y-1.5">
              {[{ key: 'tilawahQuran' as const, label: "Baca Al-Qur'an (1 Juz)" }, { key: 'tilawahJilid' as const, label: 'Baca Jilid (3 Lembar)' }].map(item => (
                <label key={item.key} className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${formData[item.key] ? 'checked-bg' : 'bg-card border-border'}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData[item.key] ? 'checked-circle' : 'bg-card border-muted-foreground/30'}`}>
                    {formData[item.key] && <Check size={10} className="text-primary-foreground" />}
                  </div>
                  <span className="text-[10px] font-bold text-foreground">{item.label}</span>
                  <input type="checkbox" className="hidden" checked={formData[item.key]} onChange={() => setFormData({ ...formData, [item.key]: !formData[item.key] })} />
                </label>
              ))}
            </div>}
        </GlassCard>

        {/* Rawatib */}
        <GlassCard className={`p-3 flex flex-col justify-between ${formData.isHaid ? 'haid-mode' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${formData.isHaid ? 'haid-icon' : 'bg-card text-muted-foreground'}`}><Activity size={18} /></div>
            <div><h4 className={`font-bold text-sm ${formData.isHaid ? 'haid-text' : 'text-foreground'}`}>Sholat Rawatib</h4>{!formData.isHaid && <p className="text-[10px] text-muted-foreground">Target: 12 Rakaat</p>}</div>
          </div>
          {formData.isHaid ? <div className="w-full mt-2 py-1.5 haid-badge text-center rounded-lg">BERHALANGAN</div> :
            <div className="flex items-center justify-between bg-card/40 p-1 rounded-lg border border-border/60 mt-2">
              <button onClick={() => setFormData({ ...formData, rawatib: Math.max(0, formData.rawatib - 2) })} className="w-7 h-7 rounded bg-card shadow-sm text-foreground font-bold flex items-center justify-center">-</button>
              <span className="font-bold text-foreground text-sm">{formData.rawatib}</span>
              <button onClick={() => setFormData({ ...formData, rawatib: Math.min(12, formData.rawatib + 2) })} className="w-7 h-7 rounded bg-card shadow-sm text-primary font-bold flex items-center justify-center">+</button>
            </div>}
        </GlassCard>

        <CheckboxTile title="Sholat Dhuha" subtitle="Sunnah Pagi" icon={Sun} checked={formData.dhuha} onChange={() => setFormData({ ...formData, dhuha: !formData.dhuha })} targetLabel="Harian" disabled={formData.isHaid} isHaidMode={formData.isHaid} />
        <CheckboxTile title="Sholat Tahajjud" subtitle="Sepertiga Malam" icon={Moon} checked={formData.tahajjud} onChange={() => setFormData({ ...formData, tahajjud: !formData.tahajjud })} targetLabel="3x Sepekan" disabled={formData.isHaid} isHaidMode={formData.isHaid} />
        <CheckboxTile title="Dzikir" subtitle="Pagi & Petang" icon={Heart} checked={formData.dzikir} onChange={() => setFormData({ ...formData, dzikir: !formData.dzikir })} targetLabel="Harian" />
        <CheckboxTile title="Birrul Walidain" subtitle="Bantu Orang Tua" icon={HandHeart} checked={formData.birrul} onChange={() => setFormData({ ...formData, birrul: !formData.birrul })} targetLabel="Harian" />
        <CheckboxTile title="Ceramah/Buku" subtitle="Menambah Ilmu" icon={Book} checked={formData.ceramah} onChange={() => setFormData({ ...formData, ceramah: !formData.ceramah })} targetLabel="Harian" />
        <CheckboxTile title="Berbagi Takjil" subtitle="Sedekah Makanan" icon={Coffee} checked={formData.takjil} onChange={() => setFormData({ ...formData, takjil: !formData.takjil })} targetLabel="1x Sepekan" />
        <CheckboxTile title="Sedekah" subtitle="Infaq Harta" icon={HandHeart} checked={formData.sedekah} onChange={() => setFormData({ ...formData, sedekah: !formData.sedekah })} targetLabel="2x Sepekan" />
      </div>

      <button onClick={handleSubmit}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-foreground/90 backdrop-blur-md text-background px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 z-50 border border-border/20">
        <Save size={20} className="text-yellow-400" />
        <span>Simpan Laporan</span>
      </button>
    </div>
  );
};

export default FormPage;
