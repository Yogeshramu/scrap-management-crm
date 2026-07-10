const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: '8px',
};

export function SkeletonBox({ w = '100%', h = '20px', style = {} }: { w?: string; h?: string; style?: React.CSSProperties }) {
  return <div style={{ width: w, height: h, ...shimmer, ...style }} />;
}

export function SkeletonMetricCard() {
  return (
    <div className="metric-card" style={{ gap: '12px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SkeletonBox w="60%" h="14px" />
        <SkeletonBox w="80%" h="28px" />
      </div>
      <SkeletonBox w="44px" h="44px" style={{ borderRadius: '12px', flexShrink: 0 }} />
    </div>
  );
}

export function SkeletonTableRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><SkeletonBox h="16px" w={j === 0 ? '70%' : '90%'} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonPanel({ lines = 4 }: { lines?: number }) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SkeletonBox w="40%" h="18px" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} w={i % 2 === 0 ? '100%' : '75%'} h="14px" />
      ))}
    </div>
  );
}
