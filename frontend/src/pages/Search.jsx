import React, { useState, useEffect, useRef } from "react";
import {
  FiSearch as SearchIcon,
  FiChevronDown as ChevronDown,
  FiHash as Hash,
  FiUsers as Users,
} from "react-icons/fi";
import EmptyState from "../components/EmptyState";
import { apiGet } from "../services/apiClient";
import { useAuth } from "../contexts/AuthContext";
import FollowButton from "../components/FollowButton";
import Avatar from "../components/Avatar";
import useIsMobile from "../hooks/useIsMobile";
import {
  colors,
  spacing,
  radius,
  type,
  glassCard,
  tag,
  transition,
  pageShell,
  pageContent,
} from "../theme";

const TYPE_OPTIONS = [
  { value: "users", label: "People", Icon: Users },
  { value: "interests", label: "Interests", Icon: Hash },
];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("users");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const menuRef = useRef(null);
  const isNarrow = useIsMobile(600);

  useEffect(() => {
    if (searchTerm.trim()) {
      const timer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchType]);

  // Close the type dropdown when clicking outside.
  useEffect(() => {
    if (!typeMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setTypeMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [typeMenuOpen]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const endpoint =
        searchType === "users" ? "/search/users" : "/search/interests";
      const data = await apiGet(
        `${endpoint}?q=${encodeURIComponent(searchTerm)}`
      );
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search error:", error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const activeOption =
    TYPE_OPTIONS.find((o) => o.value === searchType) || TYPE_OPTIONS[0];
  const ActiveIcon = activeOption.Icon;

  return (
    <div data-page-shell style={pageShell()}>
      <div style={pageContent({ maxWidth: 820 })}>
        <header style={styles.header}>
          <h1 style={{ ...type.largeTitle, color: colors.text }}>Search</h1>
          <p style={{ ...type.body, color: colors.textMuted, marginTop: spacing.sm }}>
            Find people who share your interests, or browse interest tags.
          </p>
        </header>

        <div style={styles.searchControls(isNarrow)}>
          <div style={styles.searchField(isNarrow)}>
            <SearchIcon
              size={18}
              color={colors.textFaint}
              style={styles.searchIcon}
            />
            <input
              type="text"
              placeholder={`Search by ${activeOption.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
          </div>

          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setTypeMenuOpen((o) => !o)}
              style={styles.typeButton}
              aria-haspopup="listbox"
              aria-expanded={typeMenuOpen}
            >
              <ActiveIcon size={15} />
              <span>{activeOption.label}</span>
              <ChevronDown
                size={15}
                style={{
                  transition: transition(["transform"]),
                  transform: typeMenuOpen ? "rotate(180deg)" : "rotate(0)",
                }}
              />
            </button>
            {typeMenuOpen && (
              <ul role="listbox" style={styles.typeMenu}>
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  const isActive = opt.value === searchType;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => {
                        setSearchType(opt.value);
                        setTypeMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSearchType(opt.value);
                          setTypeMenuOpen(false);
                        }
                      }}
                      style={{
                        ...styles.typeMenuItem,
                        background: isActive ? colors.glassBg : "transparent",
                        color: isActive ? colors.text : colors.textMuted,
                      }}
                    >
                      <Icon size={15} />
                      <span>{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div style={styles.results}>
          {loading ? (
            <p style={styles.placeholder}>Searching...</p>
          ) : results.length > 0 ? (
            results.map((result, index) =>
              searchType === "users" ? (
                <article key={index} style={styles.userCard}>
                  <div style={styles.userLeft}>
                    <Avatar user={result} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          ...type.headline,
                          color: colors.text,
                          marginBottom: "2px",
                        }}
                      >
                        {result.name}
                      </h3>
                      <p style={{ ...type.footnote, color: colors.textFaint }}>
                        {result.email}
                      </p>
                      {result.interests && result.interests.length > 0 && (
                        <div style={styles.interests}>
                          {result.interests.slice(0, 5).map((interest, i) => (
                            <span key={i} style={tag({ tone: "brand" })}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    targetUserId={result.uid}
                    currentUserId={currentUser?.uid}
                  />
                </article>
              ) : (
                <article key={index} style={styles.interestCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: radius.md,
                        background: colors.primarySoft,
                        border: `1px solid ${colors.primaryBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.primary,
                        flexShrink: 0,
                      }}
                    >
                      <Hash size={20} />
                    </div>
                    <div>
                      <h3 style={{ ...type.headline, color: colors.text }}>
                        {result.interest}
                      </h3>
                      <p style={{ ...type.footnote, color: colors.textMuted }}>
                        {result.count} {result.count === 1 ? "person" : "people"} interested
                      </p>
                    </div>
                  </div>
                </article>
              )
            )
          ) : searchTerm.trim() ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No results"
              body={`Nothing matched "${searchTerm}". Try a different term or switch between People and Interests.`}
            />
          ) : (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="Start typing to search"
              body="Find people by name, or browse popular interest tags."
            />
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: spacing.xl,
  },
  searchControls: (narrow) => ({
    display: "flex",
    flexDirection: narrow ? "column" : "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  }),
  searchField: (narrow) => ({
    position: "relative",
    flex: 1,
    minWidth: narrow ? 0 : "240px",
    width: narrow ? "100%" : undefined,
  }),
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: `${spacing.md} ${spacing.md} ${spacing.md} 44px`,
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: "15px",
    transition: transition(["border-color", "background"]),
    outline: "none",
    boxSizing: "border-box",
  },
  typeButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.glassBgStrong,
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: radius.md,
    color: colors.text,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: transition(["background", "border-color"]),
  },
  typeMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    minWidth: "180px",
    listStyle: "none",
    padding: spacing.xs,
    margin: 0,
    background: "rgba(20,20,20,0.92)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: radius.md,
    boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
    zIndex: 50,
    animation: "iris-slide-in 180ms ease-out",
  },
  typeMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: transition(["background", "color"]),
    outline: "none",
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    textAlign: "center",
    padding: spacing["2xl"],
  },
  userCard: {
    ...glassCard({ padded: false }),
    padding: spacing.lg,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  userLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  interests: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: spacing.sm,
  },
  interestCard: {
    ...glassCard({ padded: false }),
    padding: spacing.lg,
  },
};

export default Search;
