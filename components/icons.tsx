// 인라인 SVG 아이콘 (외부 의존성 없음)
type P = { size?: number };
const s = (n = 20) => ({ width: n, height: n, viewBox: "0 0 24 24", fill: "none" as const });

export const IconUser = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
export const IconCart = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h2l2.5 12h10L20 8H6.5" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
  </svg>
);
export const IconMoney = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6l-1.5 3h-3L9 3z" /><path d="M7 6c-2 2-3 4-3 7a8 8 0 0016 0c0-3-1-5-3-7" />
    <path d="M12 10v6M10 12h3a1.5 1.5 0 010 3h-3" />
  </svg>
);
export const IconChart = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);
export const IconGrid = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const IconBell = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 004 0" />
  </svg>
);
export const IconGear = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
);
export const IconCalendar = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
export const IconPulse = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h4l2-6 4 12 2-6h8" />
  </svg>
);
export const IconChevron = ({ size }: P) => (
  <svg {...s(size)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
