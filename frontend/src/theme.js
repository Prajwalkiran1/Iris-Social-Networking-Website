// Single source of design tokens. Components import these instead of
// hardcoding hex values, so the app has one consistent visual language.
//
// The aesthetic is Apple-inspired dark UI with liquid-glass surfaces:
// translucent panels layered over a near-black background, soft hairline
// borders, generous spacing, and refined typography.

// --- Color tokens --------------------------------------------------------

export const colors = {
  // Backgrounds
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceAlt: "#1a1a1a",
  input: "#1c1c1e",

  // Borders + dividers
  border: "rgba(255,255,255,0.10)",
  hairline: "rgba(255,255,255,0.06)",

  // Liquid-glass surface tones (layer over dark bg with backdrop-filter)
  glassBg: "rgba(255,255,255,0.04)",
  glassBgStrong: "rgba(255,255,255,0.07)",
  glassBgSoft: "rgba(255,255,255,0.025)",
  glassBorder: "rgba(255,255,255,0.10)",
  glassHighlight: "rgba(255,255,255,0.16)",

  // Text
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.62)",
  textFaint: "rgba(255,255,255,0.40)",

  // Brand + intent
  primary: "#3b82f6",
  primaryAlt: "#8b5cf6",
  primarySoft: "rgba(59,130,246,0.16)",
  primaryBorder: "rgba(59,130,246,0.35)",
  danger: "#ef4444",
  dangerSoft: "rgba(239,68,68,0.16)",
  success: "#22c55e",
  warning: "#f59e0b",
};

// --- Typography ----------------------------------------------------------

export const font = {
  family:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

// HIG-inspired scale. Each value carries size + lineHeight + weight so a
// single spread on a JSX element sets all three.
export const type = {
  largeTitle: { fontSize: "34px", lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.02em" },
  title1: { fontSize: "28px", lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.018em" },
  title2: { fontSize: "22px", lineHeight: 1.25, fontWeight: 600, letterSpacing: "-0.012em" },
  title3: { fontSize: "20px", lineHeight: 1.3, fontWeight: 600, letterSpacing: "-0.01em" },
  headline: { fontSize: "17px", lineHeight: 1.4, fontWeight: 600 },
  body: { fontSize: "15px", lineHeight: 1.5, fontWeight: 400 },
  callout: { fontSize: "14px", lineHeight: 1.45, fontWeight: 500 },
  footnote: { fontSize: "13px", lineHeight: 1.4, fontWeight: 400 },
  caption: { fontSize: "11px", lineHeight: 1.35, fontWeight: 500, letterSpacing: "0.01em" },
};

// --- Spacing -------------------------------------------------------------

export const space = (n) => `${n * 4}px`;
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
  "4xl": "64px",
};

// --- Radius (Apple-ish continuous-corner feel) ---------------------------

export const radius = {
  sm: "10px",
  md: "14px",
  lg: "18px",
  xl: "22px",
  "2xl": "28px",
  pill: "9999px",
};

// --- Shadows -------------------------------------------------------------

export const shadows = {
  subtle: "0 1px 2px rgba(0,0,0,0.25)",
  card: "0 8px 24px rgba(0,0,0,0.35)",
  elevated:
    "0 12px 36px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset",
  glow: "0 0 40px rgba(59,130,246,0.35)",
  glowSoft: "0 0 24px rgba(59,130,246,0.18)",
  ringBrand: "0 0 0 3px rgba(59,130,246,0.35)",
};

// --- Transitions ---------------------------------------------------------

export const motion = {
  fast: "150ms cubic-bezier(.2,.8,.2,1)",
  base: "220ms cubic-bezier(.2,.8,.2,1)",
  slow: "360ms cubic-bezier(.2,.8,.2,1)",
};
export const transition = (props = "all") =>
  Array.isArray(props)
    ? props.map((p) => `${p} ${motion.base}`).join(", ")
    : `${props} ${motion.base}`;

// --- Gradients -----------------------------------------------------------

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryAlt} 100%)`,
  brandSoft:
    "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.20) 0%, transparent 55%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.20) 0%, transparent 55%)",
  glassSheen:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)",
  pageVignette:
    "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 50%)",
};

// --- Reusable style factories -------------------------------------------

// Liquid-glass surface. Use for cards, navbar, sidebars, modals.
export const glassCard = ({ strong = false, padded = true } = {}) => ({
  background: strong ? colors.glassBgStrong : colors.glassBg,
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: radius.lg,
  boxShadow: shadows.card,
  padding: padded ? spacing.xl : 0,
  position: "relative",
  overflow: "hidden",
});

// Buttons. variant: primary | secondary | ghost | danger
export const button = (variant = "primary", { size = "md" } = {}) => {
  const sizes = {
    sm: { padding: "8px 14px", fontSize: "13px" },
    md: { padding: "10px 18px", fontSize: "14px" },
    lg: { padding: "12px 22px", fontSize: "15px" },
  };
  const variants = {
    primary: {
      background: gradients.brand,
      color: colors.text,
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: shadows.glowSoft,
    },
    secondary: {
      background: colors.glassBgStrong,
      color: colors.text,
      border: `1px solid ${colors.glassBorder}`,
      backdropFilter: "blur(20px) saturate(160%)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
    },
    ghost: {
      background: "transparent",
      color: colors.text,
      border: `1px solid ${colors.glassBorder}`,
    },
    danger: {
      background: colors.dangerSoft,
      color: colors.danger,
      border: `1px solid rgba(239,68,68,0.40)`,
    },
  };
  return {
    ...sizes[size],
    ...variants[variant],
    borderRadius: radius.pill,
    fontWeight: 600,
    fontFamily: font.family,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    transition: transition(["transform", "background", "box-shadow", "opacity", "border-color"]),
    outline: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
};

// Input field. Use the global :focus-visible rule for the focus ring.
export const input = ({ size = "md" } = {}) => {
  const sizes = {
    sm: { padding: "8px 12px", fontSize: "13px" },
    md: { padding: "11px 14px", fontSize: "14px" },
    lg: { padding: "14px 16px", fontSize: "15px" },
  };
  return {
    width: "100%",
    ...sizes[size],
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontFamily: font.family,
    transition: transition(["border-color", "background", "box-shadow"]),
    outline: "none",
    boxSizing: "border-box",
  };
};

// Soft tag / pill for chips like interests, mutual counts.
export const tag = ({ tone = "neutral" } = {}) => {
  const tones = {
    neutral: {
      background: colors.glassBg,
      color: colors.textMuted,
      border: `1px solid ${colors.glassBorder}`,
    },
    brand: {
      background: colors.primarySoft,
      color: colors.primary,
      border: `1px solid ${colors.primaryBorder}`,
    },
  };
  return {
    ...tones[tone],
    padding: "4px 10px",
    borderRadius: radius.pill,
    fontSize: "12px",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  };
};

// Page shell. Use on the root container of each page to handle navbar
// offset + max-width + responsive padding consistently.
//   <div style={{ ...pageShell({ maxWidth: 720 }) }}>...</div>
// On mobile (≤ 768px), the navbar collapses to a bottom tab bar; index.css
// removes the marginLeft via the .page-shell class which we attach via a
// matching className. The factory below only sets desktop values; the
// className handles the responsive override.
export const pageShell = ({ maxWidth = 1200 } = {}) => ({
  marginLeft: "70px",
  minHeight: "100vh",
  padding: `${spacing["2xl"]} ${spacing.xl}`,
  boxSizing: "border-box",
  color: colors.text,
  maxWidth: "100%",
  // Inner content centering uses a separate inner wrapper, not this shell,
  // so consumers do `<div style={pageShell()}> <div style={pageContent({maxWidth})}> </div> </div>`.
  // But for the common case we centralize that here:
  display: "block",
  // The actual inner-centering is delegated to pageContent below.
  ...(maxWidth ? {} : {}),
});

export const pageContent = ({ maxWidth = 1200 } = {}) => ({
  maxWidth: `${maxWidth}px`,
  margin: "0 auto",
  width: "100%",
});

// Avatar with optional brand gradient ring.
export const avatar = ({ size = 48, ring = false } = {}) => ({
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: radius.pill,
  background: gradients.brand,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.text,
  fontWeight: 700,
  fontSize: `${Math.max(12, Math.round(size * 0.4))}px`,
  flexShrink: 0,
  ...(ring
    ? {
        outline: `2px solid ${colors.primaryBorder}`,
        outlineOffset: "2px",
      }
    : {}),
});

// --- Backwards-compat aliases -------------------------------------------
// Keep `card` working for any callsites that still import it.
export const card = {
  background: colors.surfaceAlt,
  padding: spacing.xl,
  borderRadius: radius.lg,
  marginBottom: spacing.xl,
};
