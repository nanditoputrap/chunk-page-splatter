import { useState } from 'react';
import { Lock } from 'lucide-react';
import GlassCard from './GlassCard';
import { PIN_GURU, PIN_KESISWAAN } from '@/lib/constants';
import { useAmaliyah } from '@/context/AmaliyahContext';

interface PinModalProps {
  role: string;
  onSuccess: () => void;
  onClose: () => void;
}

const PinModal = ({ role, onSuccess, onClose }: PinModalProps) => {
  const [pinInput, setPinInput] = useState('');
  const { showNotif } = useAmaliyah();

  const handleSubmit = () => {
    const isValid =
      (role === 'teacher' && pinInput === PIN_GURU) ||
      (role === 'kesiswaan' && pinInput === PIN_KESISWAAN);

    if (isValid) {
      onSuccess();
    } else {
      showNotif('PIN Salah!');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-in fade-in">
      <GlassCard className="p-8 w-full max-w-sm mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {role === 'teacher' ? 'Login Wali Kelas' : 'Login Kesiswaan'}
          </h3>
          <p className="text-muted-foreground text-sm">Masukkan PIN untuk melanjutkan</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="PIN..."
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full bg-card/70 border border-border rounded-xl px-4 py-3 text-center font-bold tracking-widest text-xl mb-6 focus:ring-2 focus:ring-ring outline-none"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-muted-foreground font-bold hover:bg-secondary rounded-xl transition">
            Batal
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg transition hover:opacity-90">
            Masuk
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default PinModal;
