import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { colors, font, radius, gradients } from "../theme";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate("/home");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User is logged in, AuthContext will handle state update
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
          <div style={styles.divider}></div>
          <p style={styles.quote}>
            "Where meaningful connections begin with common passions"
          </p>
        </div>
      </div>
      
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue to iris</p>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <p style={styles.switchPrompt}>
            Don't have an account?{" "}
            <span 
              style={styles.link}
              onClick={() => navigate("/signup")}
            >
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
    backgroundColor: colors.bg,
    fontFamily: font.family
  },
  leftPanel: {
    width: "55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: `
      radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 50%),
      ${colors.bg}
    `,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px"
  },
  branding: {
    padding: "60px",
    textAlign: "center"
  },
  logo: {
    fontSize: "96px",
    fontWeight: 700,
    letterSpacing: "-2px",
    lineHeight: "1",
    marginBottom: "24px",
    background: gradients.brand,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  tagline: {
    fontSize: "12px",
    fontWeight: 400,
    color: colors.textFaint,
    letterSpacing: "4px",
    textTransform: "uppercase",
    marginBottom: "60px"
  },
  divider: {
    width: "40px",
    height: "1px",
    background: colors.primaryAlt,
    margin: "0 auto 32px"
  },
  quote: {
    fontStyle: "italic",
    fontSize: "18px",
    fontWeight: 300,
    color: colors.textMuted,
    lineHeight: "1.7",
    maxWidth: "340px",
    margin: "0 auto"
  },
  rightPanel: {
    width: "45%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  formContainer: {
    width: "80%",
    maxWidth: "400px"
  },
  title: {
    fontSize: "32px",
    fontWeight: 600,
    color: colors.text,
    marginBottom: "8px"
  },
  subtitle: {
    fontSize: "16px",
    color: colors.textFaint,
    marginBottom: "32px"
  },
  error: {
    backgroundColor: "rgba(239,68,68,0.12)",
    color: colors.danger,
    padding: "12px",
    borderRadius: radius.md,
    marginBottom: "16px",
    fontSize: "14px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  inputGroup: {
    position: "relative"
  },
  input: {
    width: "100%",
    padding: "16px",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: "16px",
    backgroundColor: colors.input,
    color: colors.text,
    fontFamily: font.family
  },
  button: {
    width: "100%",
    padding: "16px",
    background: gradients.brand,
    color: "#fff",
    border: "none",
    borderRadius: radius.md,
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
    marginTop: "8px"
  },
  switchPrompt: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "14px",
    color: colors.textFaint
  },
  link: {
    color: colors.primary,
    fontWeight: 600,
    cursor: "pointer"
  }
};

export default Login;
