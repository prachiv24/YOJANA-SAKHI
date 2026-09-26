// components/SakhiStamp.js
//
// The app's one signature visual: a generic ink-stamp seal (concentric ring
// + sunburst spokes), not any real government emblem. Used at three sizes —
// as the sidebar logo, large in the Dashboard hero corner, and medium as
// the assistant's chat avatar — so the whole app reads as one consistent
// mark of "verified / sanctioned," echoing the physical stamps citizens
// already associate with government paperwork.

export default function SakhiStamp({ size = 40, className = "" }) {
  return (
    <div className={`ys-stamp ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 30 * Math.cos(rad);
          const y1 = 50 + 30 * Math.sin(rad);
          const x2 = 50 + 36 * Math.cos(rad);
          const y2 = 50 + 36 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.4" />;
        })}
        <circle cx="50" cy="50" r="22" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
        <text x="50" y="47" textAnchor="middle" fontSize="13" fontFamily="Georgia, serif" fill="currentColor">
          सखी
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="6" letterSpacing="1" fontFamily="monospace" fill="currentColor">
          SANCTIONED
        </text>
      </svg>
    </div>
  );
}
