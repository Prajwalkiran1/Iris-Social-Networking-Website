import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiPost } from "../services/apiClient";
import { colors, font, radius, gradients } from "../theme";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await user.reload();

      // Mirror the new user into the Neo4j graph. apiClient uses
      // VITE_API_BASE_URL (the Render backend in prod) and attaches the
      // freshly-minted ID token.
      try {
        await apiPost("/auth/register", { name, email });
      } catch (regErr) {
        // Firebase account exists; the graph node is created lazily on the
        // first write too. Don't block the user — log and continue.
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
          <h2 style={styles.title}>Join iris</h2>
          <p style={styles.subtitle}>Create your account to get started</p>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
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
            
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          
          <p style={styles.switchPrompt}>
            Already have an account?{" "}
            <span 
              style={styles.link}
              onClick={() => navigate("/")}
            >
              Sign in
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

export default Signup;
