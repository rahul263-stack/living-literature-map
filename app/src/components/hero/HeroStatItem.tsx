import { useState } from 'react';

export interface HeroStatItemProps {
  value: string | number;
  label: string;
  tip?: string;
}

export function HeroStatItem({ value, label, tip }: HeroStatItemProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="text-center relative select-none"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ cursor: 'default' }}
    >
      <div className="font-mono text-[16px] font-bold text-[#D4A853]">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-white/40">{label}</div>
      {show && tip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 font-mono text-[10px] rounded-lg px-3 py-2 z-50 pointer-events-none shadow-xl"
          style={{
            width: 200,
            background: 'rgba(10,10,20,0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'normal',
            lineHeight: 1.4,
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
}
