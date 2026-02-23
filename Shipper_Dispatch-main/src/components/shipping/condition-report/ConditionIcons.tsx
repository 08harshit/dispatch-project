import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// Simple car silhouette with green checkmark badge - "Starts" / "No Structural Damage"
export const NoStructuralDamageIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Car silhouette - simple side view */}
    <path
      d="M6 38 L12 28 L24 24 L40 24 L52 28 L58 38 L58 44 L6 44 Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Windows */}
    <path
      d="M18 28 L22 24 L32 24 L32 32 L18 32 Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M34 24 L44 24 L48 28 L48 32 L34 32 Z"
      fill="currentColor"
      opacity="0.3"
    />
    {/* Front wheel */}
    <circle cx="18" cy="44" r="6" fill="currentColor" opacity="0.6" />
    <circle cx="18" cy="44" r="3" fill="currentColor" opacity="0.3" />
    {/* Rear wheel */}
    <circle cx="46" cy="44" r="6" fill="currentColor" opacity="0.6" />
    <circle cx="46" cy="44" r="3" fill="currentColor" opacity="0.3" />
    {/* Green checkmark badge */}
    <circle cx="52" cy="14" r="10" fill="hsl(var(--status-delivered))" />
    <path d="M47 14 L50 17 L57 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Car silhouette with red warning badge - "Prior Paint"
export const PriorPaintIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Car silhouette */}
    <path
      d="M6 38 L12 28 L24 24 L40 24 L52 28 L58 38 L58 44 L6 44 Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Paint drip effect */}
    <path d="M20 32 Q22 36 20 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M32 30 Q34 38 32 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M44 32 Q46 38 44 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    {/* Wheels */}
    <circle cx="18" cy="44" r="6" fill="currentColor" opacity="0.6" />
    <circle cx="46" cy="44" r="6" fill="currentColor" opacity="0.6" />
    {/* Red warning badge */}
    <circle cx="52" cy="14" r="10" fill="hsl(var(--destructive))" />
    <path d="M52 8 L52 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="52" cy="18" r="1.5" fill="white" />
  </svg>
);

// Tire/wheel with tread pattern - matching reference exactly
export const TiresIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Outer tire */}
    <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="3" />
    {/* Inner rim */}
    <circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Hub center */}
    <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.4" />
    {/* Tread pattern lines */}
    <path d="M32 8 L32 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 46 L32 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 32 L18 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M46 32 L56 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Diagonal treads */}
    <path d="M14 14 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M43 43 L50 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 14 L43 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M21 43 L14 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Tread depth badges - 4 corners */}
    <circle cx="32" cy="4" r="6" fill="hsl(var(--status-delivered))" />
    <text x="32" y="7" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">8</text>
    <circle cx="60" cy="32" r="6" fill="hsl(var(--destructive))" />
    <text x="60" y="35" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">5</text>
    <circle cx="32" cy="60" r="6" fill="hsl(var(--primary))" />
    <text x="32" y="63" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">4</text>
    <circle cx="4" cy="32" r="6" fill="hsl(var(--status-delivered))" />
    <text x="4" y="35" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">7</text>
  </svg>
);

// Sparkle/clean icon with checkmark badge
export const CleanIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Main sparkle star - 4-point */}
    <path
      d="M32 8 L36 24 L52 28 L36 32 L32 48 L28 32 L12 28 L28 24 Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Small sparkles */}
    <path d="M50 44 L52 48 L56 50 L52 52 L50 56 L48 52 L44 50 L48 48 Z" fill="currentColor" opacity="0.4" />
    <path d="M12 48 L14 52 L18 54 L14 56 L12 60 L10 56 L6 54 L10 52 Z" fill="currentColor" opacity="0.4" />
    {/* Green checkmark badge */}
    <circle cx="52" cy="12" r="9" fill="hsl(var(--status-delivered))" />
    <path d="M47 12 L50 15 L57 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Car with X/warning - "Not Drivable"
export const NotDrivableIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Car silhouette */}
    <path
      d="M6 40 L12 30 L24 26 L40 26 L52 30 L58 40 L58 46 L6 46 Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Flat/broken wheels */}
    <ellipse cx="18" cy="46" rx="6" ry="4" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="46" cy="46" rx="6" ry="4" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1.5" />
    {/* Red warning triangle badge */}
    <path d="M52 4 L62 20 L42 20 Z" fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" strokeWidth="1" strokeLinejoin="round" />
    <path d="M52 8 L52 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="52" cy="17" r="1.5" fill="white" />
  </svg>
);

// Engine block with checkmark - "Starts"
export const StartsIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Engine block */}
    <rect x="10" y="18" width="36" height="30" rx="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
    {/* Engine details - cylinders/vents */}
    <rect x="16" y="24" width="10" height="6" rx="2" fill="currentColor" opacity="0.4" />
    <rect x="30" y="24" width="10" height="6" rx="2" fill="currentColor" opacity="0.4" />
    {/* Exhaust pipes */}
    <path d="M46 26 L54 26 L54 32 L46 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M46 36 L52 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Intake manifold */}
    <path d="M18 18 L18 12 L24 12 L24 18" stroke="currentColor" strokeWidth="2" />
    <path d="M32 18 L32 12 L38 12 L38 18" stroke="currentColor" strokeWidth="2" />
    {/* Green checkmark badge */}
    <circle cx="52" cy="48" r="9" fill="hsl(var(--status-delivered))" />
    <path d="M47 48 L50 51 L57 44" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Wavy smell/odor lines with warning badge
export const OtherOdorIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Wavy odor lines */}
    <path
      d="M18 56 Q22 50 18 44 Q14 38 18 32 Q22 26 18 20"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 58 Q36 52 32 46 Q28 40 32 34 Q36 28 32 22"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M46 56 Q50 50 46 44 Q42 38 46 32 Q50 26 46 20"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
    {/* Red warning badge */}
    <circle cx="10" cy="12" r="9" fill="hsl(var(--destructive))" />
    <path d="M10 7 L10 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="16" r="1.5" fill="white" />
  </svg>
);

// Key icon with count badge
export const KeysIcon = ({ className, count = 1, ...props }: IconProps & { count?: number }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Key head (circular ring) */}
    <circle cx="20" cy="20" r="12" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="3" />
    <circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Key shaft */}
    <path d="M30 28 L52 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    {/* Key teeth */}
    <path d="M40 38 L44 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M46 44 L50 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M52 50 L56 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    {/* Count badge */}
    <circle cx="52" cy="14" r="9" fill="hsl(var(--primary))" />
    <text x="52" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{count}</text>
  </svg>
);

// Key fob remote with count badge
export const KeyFobsIcon = ({ className, count = 0, ...props }: IconProps & { count?: number }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Fob body */}
    <rect x="16" y="12" width="24" height="40" rx="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
    {/* Key ring loop */}
    <circle cx="28" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Buttons */}
    <circle cx="28" cy="26" r="6" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1.5" />
    <rect x="22" y="36" width="12" height="5" rx="2" fill="currentColor" opacity="0.3" />
    <rect x="22" y="44" width="12" height="5" rx="2" fill="currentColor" opacity="0.3" />
    {/* Count badge */}
    <circle cx="48" cy="48" r="9" fill={count > 0 ? "hsl(var(--status-delivered))" : "hsl(var(--muted-foreground))"} />
    <text x="48" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{count}</text>
  </svg>
);

// Invoice/document icon with checkmark
export const InvoiceIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Document */}
    <rect x="12" y="8" width="32" height="48" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
    {/* Folded corner */}
    <path d="M36 8 L44 16 L36 16 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1" />
    {/* Text lines */}
    <path d="M18 24 L38 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 32 L34 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 40 L38 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 48 L28 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Green checkmark badge */}
    <circle cx="52" cy="14" r="9" fill="hsl(var(--status-delivered))" />
    <path d="M47 14 L50 17 L57 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Condition details icon with score badge
export const ConditionDetailsIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Car silhouette */}
    <path
      d="M6 38 L12 28 L24 24 L40 24 L52 28 L58 38 L58 44 L6 44 Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Windows */}
    <path d="M18 28 L22 24 L32 24 L32 32 L18 32 Z" fill="currentColor" opacity="0.3" />
    <path d="M34 24 L44 24 L48 28 L48 32 L34 32 Z" fill="currentColor" opacity="0.3" />
    {/* Wheels */}
    <circle cx="18" cy="44" r="6" fill="currentColor" opacity="0.6" />
    <circle cx="46" cy="44" r="6" fill="currentColor" opacity="0.6" />
    {/* Score badge */}
    <circle cx="52" cy="14" r="10" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
    <text x="52" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">36</text>
  </svg>
);

// Smoke odor icon with warning badge
export const SmokeOdorIcon = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Cigarette/smoke source */}
    <rect x="24" y="50" width="16" height="6" rx="2" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1" />
    {/* Smoke trails */}
    <path
      d="M28 50 Q32 44 28 38 Q24 32 28 26 Q32 20 28 14"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M36 50 Q40 44 36 38 Q32 32 36 26 Q40 20 36 14"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    {/* Red warning badge */}
    <circle cx="52" cy="12" r="9" fill="hsl(var(--destructive))" />
    <path d="M52 7 L52 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="52" cy="16" r="1.5" fill="white" />
  </svg>
);
