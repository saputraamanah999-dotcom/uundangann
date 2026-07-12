// src/components/ui/WeatherWidget.tsx
'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Sun, CloudSun, Wind, Droplets, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';

interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  icon: 'sun' | 'cloud-sun';
}

export function WeatherWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(0);

  const hourlyData: HourlyForecast[] = [
    { time: '09:00 WITA', temp: 27, condition: 'Cerah Berawan', icon: 'cloud-sun' },
    { time: '13:00 WITA', temp: 31, condition: 'Cerah Hangat', icon: 'sun' },
    { time: '17:00 WITA', temp: 28, condition: 'Cerah Berawan', icon: 'cloud-sun' },
    { time: '21:00 WITA', temp: 25, condition: 'Malam Sejuk', icon: 'cloud-sun' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative rounded-3xl p-6 bg-white/[0.03] border-2 border-white/10 hover:border-[#C9A24B]/40 shadow-xl backdrop-blur-sm overflow-hidden text-left w-full"
    >
      {/* Background radial accent */}
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CloudSun className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-black text-white uppercase tracking-wider">
              Prakiraan Cuaca Hari-H
            </h4>
            <p className="text-[9px] uppercase tracking-widest text-[#C9A24B] font-extrabold font-sans">
              Sabtu, 08 Agustus 2026 • Bali
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-amber-400 transition-all cursor-pointer active:scale-90"
          title="Segarkan data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Primary Weather Info */}
      <div className="grid grid-cols-2 gap-4 items-center mb-5">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              y: [0, -3, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="shrink-0"
          >
            {hourlyData[selectedHour].icon === 'sun' ? (
              <Sun className="w-11 h-11 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
            ) : (
              <CloudSun className="w-11 h-11 text-amber-300 filter drop-shadow-[0_0_8px_rgba(252,211,77,0.3)]" />
            )}
          </motion.div>
          <div>
            <span className="font-sans font-black text-2xl text-white tracking-tight leading-none">
              {hourlyData[selectedHour].temp}°C
            </span>
            <p className="text-[10px] text-amber-200/90 font-sans font-semibold mt-0.5">
              {hourlyData[selectedHour].condition}
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex flex-col gap-1.5 border-l border-white/5 pl-4 text-[10px] text-[#FDF6E9]/75 font-sans">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Kelembaban: <strong className="text-white">62%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Kecepatan Angin: <strong className="text-white">12 km/h</strong></span>
          </div>
        </div>
      </div>

      {/* Hourly Selectors */}
      <div className="grid grid-cols-4 gap-2 bg-black/20 rounded-xl p-1.5 border border-white/5">
        {hourlyData.map((hour, idx) => (
          <button
            key={hour.time}
            onClick={() => setSelectedHour(idx)}
            className={`flex flex-col items-center py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedHour === idx
                ? 'bg-[#C9A24B]/15 border border-[#C9A24B]/30 text-white'
                : 'border border-transparent text-[#FDF6E9]/55 hover:text-white'
            }`}
          >
            <span className="text-[8px] font-bold font-sans uppercase tracking-wider mb-1">
              {hour.time.split(' ')[0]}
            </span>
            {hour.icon === 'sun' ? (
              <Sun className={`w-4 h-4 ${selectedHour === idx ? 'text-amber-400' : 'text-[#FDF6E9]/40'}`} />
            ) : (
              <CloudSun className={`w-4 h-4 ${selectedHour === idx ? 'text-amber-300' : 'text-[#FDF6E9]/40'}`} />
            )}
            <span className="text-[9px] font-sans font-extrabold mt-1">
              {hour.temp}°
            </span>
          </button>
        ))}
      </div>

      {/* Reassurance text */}
      <div className="mt-4 flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3">
        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#FDF6E9]/80 font-sans font-medium leading-relaxed">
          Kondisi cuaca diprediksi sangat ideal untuk kelancaran rangkaian upacara Pawiwahan dan Resepsi luar ruangan (outdoor).
        </p>
      </div>
    </motion.div>
  );
}
