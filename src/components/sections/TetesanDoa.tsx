// src/components/sections/TetesanDoa.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower, Sparkles, Heart } from 'lucide-react';

interface TetesanDoaProps {
  count: number;
}

interface Droplet {
  id: number;
  startX: number; // percentage from left
}

interface Ripple {
  id: number;
  x: number; // percentage from left
}

export function TetesanDoa({ count }: TetesanDoaProps) {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [liquidHeight, setLiquidHeight] = useState(25); // base percentage height (e.g., 25%)
  
  const prevCountRef = useRef<number | null>(null);
  const nextIdRef = useRef(0);

  // Calculate liquid height based on total count
  useEffect(() => {
    // 25% base level, each message adds 4%, max 85%
    const targetHeight = Math.min(85, 25 + count * 4);
    setLiquidHeight(targetHeight);

    // If count increases, trigger a droplet fall!
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      // Trigger droplets with slight staggers if multiple added at once
      for (let i = 0; i < diff; i++) {
        setTimeout(() => {
          const id = nextIdRef.current++;
          // Randomize starting X coordinate inside the bowl area (between 25% and 75%)
          const startX = 25 + Math.random() * 50;
          setDroplets(prev => [...prev, { id, startX }]);
        }, i * 400);
      }
    }
    prevCountRef.current = count;
  }, [count]);

  const handleDropletComplete = (id: number, x: number) => {
    // Remove droplet
    setDroplets(prev => prev.filter(d => d.id !== id));
    
    // Add ripple
    const rippleId = nextIdRef.current++;
    setRipples(prev => [...prev, { id: rippleId, x }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-sm mx-auto select-none">
      
      {/* 1. The Offering Bowl Vessel */}
      <div className="relative w-[260px] h-[190px] rounded-b-[130px] rounded-t-[40px] border-[3px] border-[#C9A24B]/60 bg-gradient-to-b from-[#160412]/95 to-[#280721]/95 shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(201,162,75,0.15)] flex flex-col justify-end overflow-hidden">
        
        {/* Soft radial gold spotlight inside */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,75,0.08),transparent_75%)] pointer-events-none" />

        {/* Double Gold Line Accents at the top */}
        <div className="absolute top-[18px] left-6 right-6 h-[1px] bg-[#C9A24B]/30" />
        <div className="absolute top-[22px] left-8 right-8 h-[1px] bg-[#C9A24B]/15" />

        {/* Floating Delicate Sparkle (top-right inside bowl) */}
        <motion.div 
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 right-8 text-amber-400/45 pointer-events-none"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>

        {/* 2. Fluid Water Pool (Liquid inside) */}
        <motion.div
          animate={{ height: `${liquidHeight}%` }}
          transition={{ type: 'spring', damping: 15, stiffness: 40 }}
          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#C9A24B]/35 via-[#C9A24B]/18 to-[#C9A24B]/8 border-t border-amber-400/30 flex flex-col justify-end"
        >
          {/* Subtle liquid wave animation */}
          <motion.div
            className="absolute -top-1.5 inset-x-0 h-3 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* 3. Falling Droplets */}
        <AnimatePresence>
          {droplets.map(d => {
            // Find target destination y coordinate matching liquid top
            const targetY = 190 - (190 * liquidHeight) / 100 - 8;
            return (
              <motion.div
                key={d.id}
                initial={{ y: 20, x: `${d.startX}%`, scale: 0.6, opacity: 0 }}
                animate={{ y: targetY, scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)' }}
                onAnimationComplete={() => handleDropletComplete(d.id, d.startX)}
                className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-[#C9A24B] shadow-[0_0_8px_rgba(253,246,233,0.8)] filter blur-[0.3px]"
              />
            );
          })}
        </AnimatePresence>

        {/* 4. Ripple Effects */}
        {ripples.map(r => (
          <div
            key={r.id}
            style={{ 
              left: `${r.x}%`, 
              bottom: `${liquidHeight}%` 
            }}
            className="absolute -translate-x-1/2 translate-y-1/2 pointer-events-none"
          >
            {/* Outer expanding ring */}
            <motion.div
              initial={{ width: 4, height: 2, opacity: 0.8 }}
              animate={{ width: 60, height: 12, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="rounded-full border border-amber-400/50"
            />
            {/* Inner expanding ring */}
            <motion.div
              initial={{ width: 2, height: 1, opacity: 1 }}
              animate={{ width: 35, height: 7, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="rounded-full border border-amber-300/70 absolute inset-0 m-auto"
            />
          </div>
        ))}

        {/* 5. Traditional Golden Flower Symbol on Top Rim */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[-6px] z-20 flex flex-col items-center">
          <div className="p-1 rounded-full bg-[#160412] border-2 border-[#C9A24B]/80 shadow-md">
            <Flower className="w-5 h-5 text-[#C9A24B] drop-shadow-[0_0_2px_rgba(201,162,75,0.5)] animate-spin-slow" />
          </div>
        </div>

      </div>

      {/* 6. Counters & Labels */}
      <div className="flex flex-col items-center gap-1.5 text-center px-4">
        <h3 className="font-sans font-black text-xs text-[#C9A24B] tracking-[0.4em] uppercase">
          UCAPAN &bull; {count}
        </h3>
        
        <p className="font-serif italic text-sm text-[#FDF6E9]/90 max-w-[280px] leading-relaxed drop-shadow-sm">
          {count} {count === 1 ? 'ucapan telah mekar' : 'ucapan telah mekar'} dalam persembahan kami.
        </p>
      </div>

      {/* 7. Dedicated Status Pill */}
      <motion.div 
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.02] border border-[#C9A24B]/35 shadow-[0_4px_12px_rgba(0,0,0,0.4)] text-amber-200/90 hover:text-white hover:border-[#C9A24B] hover:bg-white/[0.04] transition-all duration-300"
      >
        <Heart className="w-3.5 h-3.5 text-[#C9A24B] fill-[#C9A24B]/20" />
        <span className="text-[10px] font-sans font-black uppercase tracking-wider">
          Doa diterima &bull; matur suksma
        </span>
      </motion.div>

    </div>
  );
}
