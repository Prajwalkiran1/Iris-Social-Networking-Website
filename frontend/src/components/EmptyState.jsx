import {
  colors,
  spacing,
  radius,
  type,
  button as buttonStyle,
} from "../theme";

// Consistent empty state for "no posts", "no results", "no conversations" etc.
// Icon is rendered in a soft-brand circular badge.
const EmptyState = ({ icon, title, body, action }) => (
  <div style={styles.wrap}>
    {icon && <div style={styles.iconWrap}>{icon}</div>}
    {title && (
      <h3
        style={{
          ...type.title3,
          color: colors.text,
          marginBottom: body ? spacing.sm : 0,
        }}
      >
        {title}
      </h3>
    )}
    {body && (
      <p
        style={{
          ...type.body,
          color: colors.textMuted,
          maxWidth: "440px",
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
    )}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        style={{
          ...buttonStyle("primary", { size: "md" }),
          marginTop: spacing.lg,
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: `${spacing["2xl"]} ${spacing.xl}`,
    background: colors.glassBgSoft,
    border: `1px dashed ${colors.glassBorder}`,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: colors.primarySoft,
    border: `1px solid ${colors.primaryBorder}`,
    color: colors.primary,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
};

export default EmptyState;
