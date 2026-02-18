import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const GlassCard = ({ children, className = '', onClick, interactive }: GlassCardProps) => (
  <div
    onClick={onClick}
    className={cn(
      interactive ? 'glass-card-interactive' : 'glass-card',
      className
    )}
  >
    {children}
  </div>
);

export default GlassCard;
