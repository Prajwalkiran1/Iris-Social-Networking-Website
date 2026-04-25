import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaHome, FaSearch, FaEnvelope, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa"
import { useAuth } from "../contexts/AuthContext"

const Navbar = () => {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <div
      style={styles.sidebar(expanded)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <h2 style={styles.logo(expanded)}>
        {expanded ? "Iris" : "Iris"}
      </h2>

      <NavItem icon={<FaHome />} label="Home" expanded={expanded} onClick={() => navigate("/home")} />
      <NavItem icon={<FaSearch />} label="Search" expanded={expanded} onClick={() => navigate("/search")} />
      <NavItem icon={<FaEnvelope />} label="Messages" expanded={expanded} onClick={() => navigate("/chat")} />
      <NavItem icon={<FaBell />} label="Notifications" expanded={expanded} />
      <NavItem icon={<FaUser />} label="Profile" expanded={expanded} onClick={() => navigate("/profile")} />
      
      <div style={{ marginTop: "20px" }}>
        <NavItem icon={<FaSignOutAlt />} label="Logout" expanded={expanded} onClick={handleLogout} />
      </div>

    </div>
  )
}

const NavItem = ({ icon, label, expanded, onClick }) => {
  return (
    <div 
      style={styles.navItem} 
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#2a2a2a";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#aaa";
      }}
    >
      <div style={styles.icon}>{icon}</div>
      {expanded && <span style={{ color: "#fff" }}>{label}</span>}
    </div>
  )
}

const styles = {
  sidebar: (expanded) => ({
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    width: expanded ? "200px" : "70px",
    background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
    borderRight: "2px solid #333",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    transition: "all 0.3s ease",
    zIndex: 1000,
    boxShadow: "4px 0 20px rgba(0, 0, 0, 0.3)"
  }),

  logo: (expanded) => ({
    color: "#fff",
    fontSize: expanded ? "24px" : "18px",
    fontWeight: "700",
    marginBottom: "30px",
    textAlign: "center",
    background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  }),

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    cursor: "pointer",
    fontSize: "16px",
    padding: "12px 8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    color: "#aaa",
    textDecoration: "none"
  },

  icon: {
    fontSize: "20px",
    width: "25px",
    color: "#fff"
  }
}

export default Navbar