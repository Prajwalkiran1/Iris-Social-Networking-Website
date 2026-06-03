import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome as Home,
  FiCompass as Compass,
  FiSearch as Search,
  FiMessageCircle as MessageCircle,
  FiUser as User,
  FiLogOut as LogOut,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import {
  colors,
  spacing,
  radius,
  type,
  gradients,
  transition,
} from "../theme";

// Tiny matchMedia hook so we can swap to a bottom tab bar under 768px.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return isMobile;
};

const ITEMS = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/chat", label: "Messages", Icon: MessageCircle },
  { to: "/profile", label: "Profile", Icon: User },
];

const Navbar = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/home" && location.pathname.startsWith(to));

  // ---------- Mobile: bottom tab bar ----------
  if (isMobile) {
    return (
      <nav style={styles.mobileBar}>
        {ITEMS.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              style={{
                ...styles.mobileTab,
                color: active ? colors.text : colors.textFaint,
              }}
            >
              <Icon size={22} />
              <span style={styles.mobileTabLabel}>{label}</span>
              {active && <span style={styles.mobileActiveDot} />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          style={{ ...styles.mobileTab, color: colors.textFaint }}
        >
          <LogOut size={22} />
          <span style={styles.mobileTabLabel}>Logout</span>
        </button>
      </nav>
    );
  }

  // ---------- Desktop: collapsible glass sidebar ----------
  return (
    <nav
      style={styles.sidebar(expanded)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <h2 style={styles.logo(expanded)}>{expanded ? "Iris" : "I"}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {ITEMS.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            expanded={expanded}
            active={isActive(item.to)}
            onClick={() => navigate(item.to)}
          />
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <NavItem
          to="logout"
          Icon={LogOut}
          label="Logout"
          expanded={expanded}
          active={false}
          onClick={handleLogout}
        />
      </div>
    </nav>
  );
};

const NavItem = ({ Icon, label, expanded, active, onClick }) => {
  const [hover, setHover] = useState(false);

  const background = active
    ? colors.glassBgStrong
    : hover
    ? colors.glassBg
    : "transparent";
  const color = active || hover ? colors.text : colors.textMuted;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.navItem,
        background,
        color,
        justifyContent: expanded ? "flex-start" : "center",
      }}
      aria-current={active ? "page" : undefined}
    >
      {active && <span style={styles.activeIndicator} />}
      <Icon size={20} />
      {expanded && (
        <span style={{ ...type.callout, color: "inherit", fontWeight: active ? 600 : 500 }}>
          {label}
        </span>
      )}
    </button>
  );
};

const styles = {
  sidebar: (expanded) => ({
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    width: expanded ? "210px" : "70px",
    background: "rgba(10,10,10,0.65)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    borderRight: `1px solid ${colors.glassBorder}`,
    padding: `${spacing.xl} ${spacing.md}`,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    transition: transition(["width", "background"]),
    zIndex: 1000,
    boxShadow: "8px 0 32px rgba(0,0,0,0.45)",
    boxSizing: "border-box",
  }),

  logo: (expanded) => ({
    ...type.title1,
    fontSize: expanded ? "26px" : "22px",
    fontWeight: 800,
    textAlign: "center",
    marginBottom: spacing.lg,
    background: gradients.brand,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.02em",
    transition: transition(["font-size"]),
  }),

  navItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    cursor: "pointer",
    border: "none",
    width: "100%",
    padding: `${spacing.md} ${spacing.md}`,
    borderRadius: radius.md,
    transition: transition(["background", "color"]),
    textAlign: "left",
    fontFamily: "inherit",
  },

  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: "3px",
    borderRadius: "2px",
    background: gradients.brand,
    boxShadow: "0 0 12px rgba(59,130,246,0.55)",
  },

  // --- Mobile bottom tab bar ---
  mobileBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "72px",
    paddingBottom: "env(safe-area-inset-bottom, 0)",
    background: "rgba(10,10,10,0.72)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    borderTop: `1px solid ${colors.glassBorder}`,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "space-around",
    zIndex: 1000,
    boxShadow: "0 -8px 28px rgba(0,0,0,0.5)",
  },
  mobileTab: {
    flex: 1,
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    cursor: "pointer",
    position: "relative",
    transition: transition(["color"]),
    padding: 0,
    fontFamily: "inherit",
  },
  mobileTabLabel: {
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  mobileActiveDot: {
    position: "absolute",
    top: "6px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: colors.primary,
    boxShadow: "0 0 8px rgba(59,130,246,0.6)",
  },
};

export default Navbar;
