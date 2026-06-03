import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import {
  colors,
  spacing,
  radius,
  type,
  glassCard,
  transition,
} from "../theme";

// Reusable glass modal. Portal-mounted so it overlays the whole app.
// Closes on ESC + backdrop click. Renders nothing if !open.
const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 480,
  contentPadding,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={styles.backdrop}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.modal,
          maxWidth: `${maxWidth}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={styles.header}>
          <h3 style={{ ...type.title3, color: colors.text }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={styles.closeButton}
          >
            <FiX size={18} />
          </button>
        </header>
        <div
          style={{
            ...styles.body,
            padding: contentPadding ?? `0 ${spacing.xl} ${spacing.xl}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px) saturate(140%)",
    WebkitBackdropFilter: "blur(8px) saturate(140%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    zIndex: 2000,
    animation: "iris-fade-in 160ms ease-out",
  },
  modal: {
    ...glassCard({ strong: true, padded: false }),
    width: "100%",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "iris-slide-in 200ms ease-out",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.lg} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.glassBorder}`,
    flexShrink: 0,
  },
  closeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: colors.glassBg,
    border: `1px solid ${colors.glassBorder}`,
    color: colors.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: transition(["background", "color"]),
  },
  body: {
    overflowY: "auto",
    flex: 1,
  },
};

export default Modal;
