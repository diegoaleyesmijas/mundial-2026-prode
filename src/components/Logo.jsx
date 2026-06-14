export default function Logo({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Copa Mundial"
      role="img"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5E070" />
          <stop offset="40%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A67B1E" />
        </linearGradient>
        <linearGradient id="goldLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E070" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A67B1E" />
          <stop offset="25%" stopColor="#F5E070" />
          <stop offset="50%" stopColor="#C9A227" />
          <stop offset="75%" stopColor="#F5E070" />
          <stop offset="100%" stopColor="#A67B1E" />
        </linearGradient>
      </defs>

      {/* Bottom tier */}
      <rect x="23" y="112" width="54" height="10" rx="3" fill="url(#goldH)" />
      {/* Base ring 1 */}
      <rect x="26" y="107" width="48" height="6" rx="2" fill="url(#goldH)" />
      {/* Green malachite band */}
      <rect x="28" y="97" width="44" height="11" rx="2" fill="#1E8449" />
      <rect x="28" y="97" width="44" height="3" rx="1" fill="#2ECC71" opacity="0.3" />
      {/* Base ring 2 */}
      <rect x="30" y="91" width="40" height="7" rx="2" fill="url(#goldH)" />

      {/* Stem */}
      <rect x="47" y="76" width="6" height="16" rx="1.5" fill="url(#gold)" />
      <line x1="47" y1="84" x2="53" y2="84" stroke="#A67B1E" strokeWidth="0.8" opacity="0.4" />

      {/* Left figure */}
      <path
        d="M48 76 C48 76 30 72 22 58 C16 48 18 38 24 32 C28 28 33 28 36 32 C39 36 38 42 34 48 C30 54 30 58 34 62 C38 66 44 68 48 64"
        fill="none"
        stroke="url(#goldLight)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="34" r="3.5" fill="url(#goldLight)" />

      {/* Right figure */}
      <path
        d="M52 76 C52 76 70 72 78 58 C84 48 82 38 76 32 C72 28 67 28 64 32 C61 36 62 42 66 48 C70 54 70 58 66 62 C62 66 56 68 52 64"
        fill="none"
        stroke="url(#goldLight)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="70" cy="34" r="3.5" fill="url(#goldLight)" />

      {/* Globe shadow */}
      <circle cx="50" cy="24" r="20" fill="rgba(0,0,0,0.08)" />
      {/* Globe sphere */}
      <circle cx="50" cy="22" r="20" fill="white" stroke="url(#gold)" strokeWidth="2.5" />
      {/* Highlight */}
      <ellipse cx="42" cy="14" rx="8" ry="11" fill="white" opacity="0.35" />

      {/* Globe grid lines */}
      <ellipse cx="50" cy="22" rx="20" ry="7" fill="none" stroke="#C9A227" strokeWidth="1.2" opacity="0.5" />
      <ellipse cx="50" cy="22" rx="7" ry="20" fill="none" stroke="#C9A227" strokeWidth="1.2" opacity="0.5" />
      <line x1="50" y1="2" x2="50" y2="42" stroke="#C9A227" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}
