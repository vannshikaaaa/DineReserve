import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

const C = {
  page: {
    minHeight: "100vh",
    background: "#0c0d0f",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px",
    fontFamily: "'Jost', sans-serif",
  },
  wrap: { width: "100%", maxWidth: "400px" },
  brand: { textAlign: "center", marginBottom: "40px" },
  brandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "clamp(28px, 7vw, 38px)",
    fontWeight: "400", color: "#e8e4de",
    letterSpacing: "0.04em", display: "block", marginBottom: "6px",
  },
  brandSub: {
    fontSize: "12px", color: "#4a4844",
    letterSpacing: "0.12em", textTransform: "uppercase",
  },
  card: {
    background: "#141618",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "20px",
    padding: "clamp(24px, 5vw, 40px)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "24px", fontWeight: "300", color: "#e8e4de",
    marginBottom: "28px", letterSpacing: "0.01em",
  },
  label: {
    display: "block", fontSize: "11px", fontWeight: "500",
    color: "#4a4844", letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: "8px",
  },
  field: { marginBottom: "20px" },
  input: {
    width: "100%", padding: "12px 16px",
    background: "#1a1c20", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "8px", color: "#e8e4de",
    fontFamily: "'Jost', sans-serif", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btn: {
    width: "100%", padding: "13px",
    background: "#b89a6a", color: "#0c0d0f",
    border: "none", borderRadius: "8px",
    fontFamily: "'Jost', sans-serif", fontSize: "14px", fontWeight: "600",
    letterSpacing: "0.06em", textTransform: "uppercase",
    cursor: "pointer", marginTop: "6px",
    transition: "all 0.2s",
  },
  footer: {
    textAlign: "center", marginTop: "24px",
    fontSize: "13px", color: "#4a4844",
  },
  err: {
    background: "rgba(196,96,96,0.1)", border: "1px solid rgba(196,96,96,0.2)",
    borderRadius: "8px", padding: "10px 14px",
    color: "#c46060", fontSize: "13px", marginBottom: "20px",
  },
};

function FocusInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...style,
        borderColor: focused ? "#b89a6a" : "rgba(255,255,255,0.09)",
        boxShadow: focused ? "0 0 0 3px rgba(184,154,106,0.12)" : "none",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await API.post("/customer/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <div style={C.page}>
      <div style={C.wrap}>
        <div style={C.brand}>
          <span style={C.brandName}>DineReserve</span>
          <span style={C.brandSub}>Guest Portal</span>
        </div>
        <div style={C.card}>
          <h2 style={C.cardTitle}>Sign in</h2>
          {error && <div style={C.err}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={C.field}>
              <label style={C.label}>Email address</label>
              <FocusInput
                type="email" placeholder="you@example.com"
                style={C.input}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div style={C.field}>
              <label style={C.label}>Password</label>
              <FocusInput
                type="password" placeholder="••••••••"
                style={C.input}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              type="submit" style={C.btn} disabled={loading}
              onMouseEnter={e => { e.currentTarget.style.background = "#cdb48a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#b89a6a"; e.currentTarget.style.transform = "none"; }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div style={C.footer}>
            No account?{" "}
            <Link to="/register" style={{ color: "#b89a6a", fontWeight: "500" }}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;