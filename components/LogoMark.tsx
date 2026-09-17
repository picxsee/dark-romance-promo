type LogoMarkProps = {
  size?: number;
  animated?: boolean;
  className?: string;
};

/**
 * Badge coeur + pastille "lecture" : le mark de Dark Romance Promo.
 * `animated` déclenche un vrai battement de coeur (lub-dub) en boucle, via la
 * classe .animate-heartbeat définie dans globals.css.
 */
export default function LogoMark({ size = 40, animated = false, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${animated ? "animate-heartbeat" : ""} ${className}`}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="55%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="#12081a" />
      <rect x="10" y="10" width="80" height="80" rx="22" fill="url(#logoGradient)" />
      <path
        fill="#160b1f"
        d="M50,73 C50,73 23,54 23,35 C23,23 33,15 43,21 C46,23 49,27 50,31
           C51,27 54,23 57,21 C67,15 77,23 77,35 C77,54 50,73 50,73 Z"
      />
      <circle cx="74" cy="74" r="15" fill="url(#logoGradient)" stroke="#160b1f" strokeWidth="3" />
      <path d="M70,68 L81,74 L70,80 Z" fill="#160b1f" />
    </svg>
  );
}
