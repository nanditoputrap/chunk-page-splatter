import { Check } from 'lucide-react';
import GlassCard from './GlassCard';
import { LucideIcon } from 'lucide-react';

interface CheckboxTileProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: () => void;
  targetLabel?: string;
  disabled?: boolean;
  isHaidMode?: boolean;
}

const CheckboxTile = ({ title, subtitle, icon: Icon, checked, onChange, targetLabel, disabled, isHaidMode }: CheckboxTileProps) => (
  <GlassCard
    onClick={!disabled && !isHaidMode ? onChange : undefined}
    className={`p-3 group relative overflow-hidden transition-all h-full flex flex-col justify-center ${
      isHaidMode
        ? 'haid-mode cursor-not-allowed'
        : disabled
          ? 'opacity-50 cursor-not-allowed bg-muted'
          : checked
            ? 'checked-bg cursor-pointer'
            : 'hover:shadow-xl cursor-pointer'
    }`}
  >
    <div className="flex justify-between items-start z-10 relative">
      <div className="flex gap-3 items-start w-full">
        <div className={`p-2 rounded-xl transition-colors shrink-0 ${
          isHaidMode ? 'haid-icon' :
          checked && !disabled ? 'checked-icon' : 'bg-card text-muted-foreground'
        }`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm leading-tight truncate ${
            isHaidMode ? 'haid-text' :
            checked && !disabled ? 'text-primary' : 'text-foreground'
          }`}>{title}</h4>
          {isHaidMode ? (
            <span className="haid-badge mt-1">BERHALANGAN</span>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {!disabled && !isHaidMode && (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
          checked ? 'checked-circle' : 'border-muted-foreground/30 bg-card'
        }`}>
          {checked && <Check size={12} className="text-primary-foreground" />}
        </div>
      )}
    </div>
    {targetLabel && !disabled && !isHaidMode && (
      <div className="absolute bottom-2 right-2 opacity-60">
        <span className="text-[9px] font-bold text-muted-foreground bg-card/50 px-1.5 py-0.5 rounded border border-border/50">{targetLabel}</span>
      </div>
    )}
  </GlassCard>
);

export default CheckboxTile;
