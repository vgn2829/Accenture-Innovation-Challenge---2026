// ============================================================
// ControlPlane.ai — Design System Tokens & Semantic Constants
// ============================================================

export const TOKENS = {
  colors: {
    canvas: '#F3F0EE',
    surface: '#FCFBFA',
    surfaceBone: '#F4F4F4',
    white: '#FFFFFF',
    ink: '#141413',
    charcoal: '#262627',
    muted: '#696969',
    granite: '#555555',
    soft: '#D1CDC7',
    ghost: '#E8E2DA',
    border: '#E5E0DA',
    borderSubtle: '#ECE8E3',

    // Accents
    accent: '#C84A12',
    accentLight: '#F37338',
    clay: '#9A3A0A',
    info: '#3860BE',

    // Semantic States
    release: {
      text: '#2E7D5B',
      bg: '#E8F5EE',
      border: '#A3D9C0',
      label: 'Verified',
    },
    edit: {
      text: '#3860BE',
      bg: '#EEF3FC',
      border: '#B5CEF7',
      label: 'Safe Repair',
    },
    block: {
      text: '#B42318',
      bg: '#FDF2F1',
      border: '#F8A8A1',
      label: 'Blocked Risk',
    },
    escalate: {
      text: '#A45A00',
      bg: '#FEF7EC',
      border: '#F7D29E',
      label: 'Human Review',
    },
  },
  radii: {
    micro: '6px',
    btn: '20px',
    stadium: '40px',
    pill: '999px',
    circle: '50%',
  },
  shadows: {
    soft: '0 4px 24px 0 rgba(0, 0, 0, 0.04)',
    elevated: '0 24px 48px 0 rgba(0, 0, 0, 0.07)',
    floating: '0 12px 36px 0 rgba(20, 20, 19, 0.06)',
  },
} as const;
