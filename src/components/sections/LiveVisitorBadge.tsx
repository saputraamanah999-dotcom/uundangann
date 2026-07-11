// src/components/sections/LiveVisitorBadge.tsx
'use client';
import { motion } from 'motion/react';
import { useLiveVisitors } from '../../hooks/useLiveVisitors';
import { Users } from 'lucide-react';

export function LiveVisitorBadge() {
  const visitorsCount = useLiveVisitors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border-2 border-[#C9A24B]/30 shadow-lg text-white"
    >
      {/* Real-time pulsing online dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      
      <span className="font-mono text-xs font-bold text-emerald-400">
        {visitorsCount}
      </span>
      
      <span className="text-[10px] uppercase tracking-wider text-[#C9A24B] font-sans font-black">
        Tamu Sedang Online
      </span>
    </motion.div>
  );
}
