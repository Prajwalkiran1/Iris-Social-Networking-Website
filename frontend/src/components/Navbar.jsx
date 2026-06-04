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
import { apiGet } from "../services/apiClient";
import useIsMobile from "../hooks/useIsMobile";
import {
  colors,
  spacing,
  radius,
  type,
  gradients,
  transition,
} from "../theme";

// Poll the conversations list for unread total. Used by the bell-style
// badge on the Messages icon. Cadence matches Chat.jsx's own conversations
// poll (10s) so the badge stays roughly in sync; if the user is on /chat
// the page's own polling will also keep things fresh.
const UNREAD_POLL_MS = 10000;

const useUnreadTotal = (currentUser, path) => {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!currentUser) {
      setTotal(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await apiGet("/messages/conversations");
        if (cancelled) return;
        const sum = (Array.isArray(data) ? data : []).reduce(
          (n, c) => n + (Number(c.unreadCount) || 0),
          0
        );
        setTotal(sum);
      } catch {
        /* keep the previous value */
      }
    };
    refresh();
    const id = setInterval(refresh, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // Re-run whenever the route changes so opening /chat triggers an
    // immediate refresh (and the badge clears quickly when the user reads).
  }, [currentUser, path]);
  return total;
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
  const { currentUser, logout } = useAuth();
  const isMobile = useIsMobile();
  const unreadTotal = useUnreadTotal(currentUser, location.pathname);

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
          const showBadge = to === "/chat" && unreadTotal > 0;
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
              <span style={styles.iconWrap}>
                <Icon size={22} />
                {showBadge && <span style={styles.notifDot} />}
              </span>
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
            badge={item.to === "/chat" && unreadTotal > 0 ? unreadTotal : 0}
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

const NavItem = ({ Icon, label, expanded, active, onClick, badge = 0 }) => {
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
      <span style={styles.iconWrap}>
        <Icon size={20} />
        {badge > 0 && (
          <span style={styles.notifDot} aria-label={`${badge} unread`} />
        )}
      </span>
      {expanded && (
        <span style={{ ...type.callout, color: "inherit", fontWeight: active ? 600 : 500 }}>
          {label}
        </span>
      )}
      {expanded && badge > 0 && (
        <span style={styles.navItemBadge}>
          {badge > 99 ? "99+" : badge}
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

  iconWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: "-3px",
    right: "-4px",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: colors.primary,
    border: `2px solid ${colors.bg}`,
    boxShadow: "0 0 8px rgba(59,130,246,0.7)",
  },
  navItemBadge: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    borderRadius: radius.pill,
    background: colors.primary,
    color: colors.text,
    fontSize: "11px",
    fontWeight: 700,
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
