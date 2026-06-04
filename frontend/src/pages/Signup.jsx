import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiPost } from "../services/apiClient";
import useIsMobile from "../hooks/useIsMobile";
import {
  colors,
  font,
  radius,
  spacing,
  type,
  gradients,
  button,
  input,
  glassCard,
  transition,
} from "../theme";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (currentUser) navigate("/home");
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await user.reload();

      try {
        await apiPost("/auth/register", { name, email });
      } catch (regErr) {
        console.error("Backend register failed:", regErr.message);
      }

      navigate("/home");
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error("Signup failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container(isMobile)}>
      <div style={styles.leftPanel(isMobile)}>
        <div style={styles.branding(isMobile)}>
          <h1 style={styles.logo(isMobile)}>Iris</h1>
          <p style={styles.tagline}>connect through shared interests</p>
          {!isMobile && (
            <>
              <div style={styles.divider} />
              <p style={styles.quote}>
                "Where meaningful connections begin with common passions"
              </p>
            </>
          )}
        </div>
      </div>

      <div style={styles.rightPanel(isMobile)}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Join Iris</h2>
          <p style={styles.subtitle}>Create your account to get started</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input({ size: "lg" })}
              required
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input({ size: "lg" })}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input({ size: "lg" })}
              required
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={input({ size: "lg" })}
              required
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                ...button("primary", { size: "lg" }),
                width: "100%",
                marginTop: spacing.sm,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p style={styles.switchPrompt}>
            Already have an account?{" "}
            <span style={styles.link} onClick={() => navigate("/")}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: (mobile) => ({
    minHeight: "100vh",
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    background: colors.bg,
    fontFamily: font.family,
  }),
  leftPanel: (mobile) => ({
    flex: mobile ? "0 0 auto" : "1 1 55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: gradients.brandSoft,
    overflow: "hidden",
    paddingTop: mobile ? spacing.xl : 0,
    paddingBottom: mobile ? spacing.lg : 0,
  }),
  branding: (mobile) => ({
    padding: mobile ? spacing.lg : spacing["3xl"],
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  }),
  logo: (mobile) => ({
    fontSize: mobile ? "56px" : "104px",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    marginBottom: mobile ? spacing.sm : spacing.xl,
    background: gradients.brand,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),
  tagline: {
    ...type.caption,
    color: colors.textFaint,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    marginBottom: spacing["3xl"],
  },
  divider: {
    width: "32px",
    height: "1px",
    background: colors.primaryBorder,
    margin: `0 auto ${spacing.xl}`,
  },
  quote: {
    fontStyle: "italic",
    fontSize: "18px",
    fontWeight: 300,
    color: colors.textMuted,
    lineHeight: 1.7,
    maxWidth: "360px",
    margin: "0 auto",
  },
  rightPanel: (mobile) => ({
    flex: mobile ? "1 1 auto" : "1 1 45%",
    display: "flex",
    alignItems: mobile ? "flex-start" : "center",
    justifyContent: "center",
    padding: mobile ? spacing.lg : spacing.xl,
    background: "transparent",
  }),
  formCard: {
    ...glassCard({ strong: true, padded: false }),
    padding: `${spacing["2xl"]} ${spacing["2xl"]}`,
    width: "100%",
    maxWidth: "420px",
    borderRadius: radius.xl,
  },
  title: {
    ...type.title1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...type.body,
    color: colors.textFaint,
    marginBottom: spacing.xl,
  },
  error: {
    background: "rgba(239,68,68,0.12)",
    color: colors.danger,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    ...type.footnote,
    border: "1px solid rgba(239,68,68,0.28)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  switchPrompt: {
    textAlign: "center",
    marginTop: spacing.xl,
    ...type.footnote,
    color: colors.textFaint,
  },
  link: {
    color: colors.primary,
    fontWeight: 600,
    cursor: "pointer",
    transition: transition(["color", "opacity"]),
  },
};

export default Signup;
