// Single source of design tokens. Components import these instead of
// hardcoding hex values, so the app has one consistent visual language.

export const colors = {
  bg: "#0a0a0a",
  surface: "#1a1a1a",
  surfaceAlt: "#1f1f1f",
  input: "#2a2a2a",
  border: "#333",
  text: "#ffffff",
  textMuted: "#aaaaaa",
  textFaint: "#888888",
  primary: "#3b82f6",
  primaryAlt: "#8b5cf6",
  danger: "#ef4444",
  success: "#22c55e",
};

export const font = {
  family:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export const radius = { sm: "6px", md: "8px", lg: "12px", xl: "16px" };

export const space = (n) => `${n * 4}px`;

export const gradients = {
  brand: `linear-gradient(45deg, ${colors.primary}, ${colors.primaryAlt})`,
};

// Reusable style factories.
export const button = (variant = "primary") => ({
  padding: "10px 18px",
  borderRadius: radius.md,
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  color: "#fff",
  background:
    variant === "danger"
      ? colors.danger
      : variant === "success"
      ? colors.success
      : colors.primary,
  transition: "opacity 0.2s ease",
});

export const input = {
  width: "100%",
  padding: "12px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.input,
  color: colors.text,
  fontSize: "14px",
  fontFamily: font.family,
};

export const card = {
  background: colors.surfaceAlt,
  padding: space(5),
  borderRadius: radius.lg,
  marginBottom: space(5),
};
