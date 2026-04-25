import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
          <h1 style={styles.logo}>
            TruthSocial<em>.</em>
          </h1>
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
    backgroundColor: "#0a0a0a",
    fontFamily: "'Jost', sans-serif"
  },
  leftPanel: {
    width: "55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: `
      radial-gradient(ellipse at 30% 50%, rgba(180, 150, 100, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(200, 170, 120, 0.08) 0%, transparent 50%),
      #0d0c0b
    `,
    backgroundImage: `
      linear-gradient(rgba(180,150,100,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(180,150,100,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px"
  },
  branding: {
    padding: "60px",
    textAlign: "center"
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "96px",
    fontWeight: "300",
    color: "#e8dcc8",
    letterSpacing: "-2px",
    lineHeight: "1",
    marginBottom: "24px"
  },
  tagline: {
    fontSize: "12px",
    fontWeight: "200",
    color: "rgba(232, 220, 200, 0.4)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    marginBottom: "60px"
  },
  divider: {
    width: "40px",
    height: "1px",
    background: "rgba(201, 169, 110, 0.4)",
    margin: "0 auto 32px"
  },
  quote: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: "italic",
    fontSize: "18px",
    fontWeight: "300",
    color: "rgba(232, 220, 200, 0.35)",
    lineHeight: "1.7",
    maxWidth: "340px",
    margin: "0 auto"
  },
  rightPanel: {
    width: "45%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f5f0"
  },
  formContainer: {
    width: "80%",
    maxWidth: "400px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "400",
    color: "#2c2c2c",
    marginBottom: "8px"
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px"
  },
  error: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "12px",
    borderRadius: "8px",
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
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "16px",
    backgroundColor: "#fff",
    transition: "border-color 0.2s"
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#2c2c2c",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "8px"
  },
  switchPrompt: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "14px",
    color: "#666"
  },
  link: {
    color: "#2c2c2c",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "underline"
  }
};

export default Login;
