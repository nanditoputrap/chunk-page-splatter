import { Check } from 'lucide-react';
import { useAmaliyah } from '@/context/AmaliyahContext';

const NotificationToast = () => {
  const { notification } = useAmaliyah();
  if (!notification) return null;

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
      <div className="bg-foreground/80 backdrop-blur-md text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-border/10">
        <Check size={16} className="text-emerald-400" />
        <span className="text-sm font-medium">{notification}</span>
      </div>
    </div>
  );
};

export default NotificationToast;
