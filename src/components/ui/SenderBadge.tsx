// src/components/ui/SenderBadge.tsx
const SENDER_STYLE: Record<string, { label: string; className: string }> = {
  mempelai: { label: 'Dari Mempelai', className: 'bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30' },
  keluarga: { label: 'Dari Keluarga', className: 'bg-white/10 text-white/80 border border-white/20' },
  developer: { label: 'Saputra Developer', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
};

export function SenderBadge({ senderType }: { senderType: 'mempelai' | 'keluarga' | 'developer' }) {
  const s = SENDER_STYLE[senderType] ?? SENDER_STYLE.keluarga;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-sans ${s.className}`}>
      <span>{s.label}</span>
      {senderType === 'developer' && (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-blue-400 fill-current shrink-0" aria-label="Verified">
          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.17-2.9-.81-3.88s-2.49-1.27-3.88-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.17-3.88.81s-1.27 2.49-.81 3.88C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.17 2.9.81 3.88s2.49 1.27 3.88.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.17 3.88-.81s1.27-2.49.81-3.88c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.25l-3.5-3.5 1.41-1.42 2.09 2.08 5.18-5.17 1.42 1.41-6.6 6.6z" />
        </svg>
      )}
    </span>
  );
}
