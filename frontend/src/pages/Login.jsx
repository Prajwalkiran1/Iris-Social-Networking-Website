import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  React.useEffect(() => {
    if (currentUser) navigate("/home");
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.branding}>
          <h1 style={styles.logo}>Iris</h1>
          <p style={styles.tagline}>connect through shared interests</p>
          <div style={styles.divider} />
          <p style={styles.quote}>
            "Where meaningful connections begin with common passions"
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue to Iris</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
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
              autoComplete="current-password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={styles.switchPrompt}>
            Don't have an account?{" "}
            <span style={styles.link} onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    background: colors.bg,
    fontFamily: font.family,
  },
  leftPanel: {
    flex: "1 1 55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: gradients.brandSoft,
    overflow: "hidden",
  },
  branding: {
    padding: spacing["3xl"],
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    fontSize: "104px",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    marginBottom: spacing.xl,
    background: gradients.brand,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
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
  rightPanel: {
    flex: "1 1 45%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    background: "transparent",
  },
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

export default Login;
