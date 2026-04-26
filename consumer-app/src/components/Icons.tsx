import type { ReactNode, SVGProps } from "react";

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ children, ...rest }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg {...baseProps} {...rest}>
      {children}
    </svg>
  );
}

export const RainIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A4 4 0 0 0 5 15" />
    <path d="M8 19v2M12 17v4M16 19v2" />
  </Svg>
);
export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
  </Svg>
);
export const CloudIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A4 4 0 0 0 5 15" />
  </Svg>
);
export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const WalkIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M13 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    <path d="M9 22l2-9-3-2 2-5 4 2 3 4" />
    <path d="M11 13l4 2 2 5" />
  </Svg>
);
export const ShopIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 9l1-5h16l1 5" />
    <path d="M5 9v11h14V9" />
    <path d="M9 20v-6h6v6" />
  </Svg>
);
export const PulseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 12h3l3-9 6 18 3-9h3" />
  </Svg>
);
export const HeartIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.7l-1.06-1.1a5.5 5.5 0 0 0-7.78 7.8l1.06 1 7.78 7.8 7.78-7.8 1.06-1a5.5 5.5 0 0 0 0-7.8z" />
  </Svg>
);
export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="1" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 12l5 5L20 7" />
  </Svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </Svg>
);
export const WalletIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
  </Svg>
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
export const MapIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20 3 6" />
    <line x1="9" y1="4" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="20" />
  </Svg>
);
export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
);
export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);
export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 10c.5-1.5 2-2.5 3.5-2 1.5.5 2 2 1 3.5L12 14" />
    <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
  </Svg>
);
export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);
export const ReceiptIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Svg>
);
