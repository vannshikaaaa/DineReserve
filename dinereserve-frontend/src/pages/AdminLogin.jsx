import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

const page = { minHeight:"100vh", background:"#0c0d0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'Jost', sans-serif" };
const wrap = { width:"100%", maxWidth:"420px" };
const brandName = { fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"36px", fontWeight:"400", color:"#e8e4de", letterSpacing:"0.04em", display:"block", marginBottom:"6px" };
const brandSub = { fontSize:"12px", color:"#4a4844", letterSpacing:"0.12em", textTransform:"uppercase" };
const card = { background:"#141618", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"20px", padding:"40px", boxShadow:"0 24px 64px rgba(0,0,0,0.6)" };
const cardTitle = { fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"24px", fontWeight:"300", color:"#e8e4de", marginBottom:"4px" };
const cardDesc = { fontSize:"13px", color:"#4a4844", marginBottom:"28px" };
const label = { display:"block", fontSize:"11px", fontWeight:"500", color:"#4a4844", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" };
const field = { marginBottom:"18px" };
const inp = { width:"100%", padding:"12px 16px", background:"#1a1c20", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"8px", color:"#e8e4de", fontFamily:"'Jost', sans-serif", fontSize:"14px", outline:"none", boxSizing:"border-box" };
const btn = { width:"100%", padding:"13px", background:"#b89a6a", color:"#0c0d0f", border:"none", borderRadius:"8px", fontFamily:"'Jost', sans-serif", fontSize:"14px", fontWeight:"600", letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", marginTop:"4px", transition:"all 0.2s" };
const err = { background:"rgba(196,96,96,0.1)", border:"1px solid rgba(196,96,96,0.2)", borderRadius:"8px", padding:"10px 14px", color:"#c46060", fontSize:"13px", marginBottom:"20px" };
const foot = { textAlign:"center", marginTop:"22px", fontSize:"13px", color:"#4a4844" };

function FI({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input {...props} style={{ ...inp, borderColor: f ? "#b89a6a" : "rgba(255,255,255,0.09)", boxShadow: f ? "0 0 0 3px rgba(184,154,106,0.12)" : "none" }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email:"", password:"", restaurant_unique_password:"" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const res = await API.post("/admin/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/admin-dashboard");
    } catch (err) { setError(err.response?.data?.detail || "Login failed. Check your credentials."); }
  };

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <span style={brandName}>DineReserve</span>
          <span style={brandSub}>Operator Portal</span>
        </div>
        <div style={card}>
          <h2 style={cardTitle}>Admin sign in</h2>
          <p style={cardDesc}>Access your restaurant dashboard</p>
          {error && <div style={err}>{error}</div>}
          <form onSubmit={submit}>
            <div style={field}><label style={label}>Email address</label><FI type="email" placeholder="admin@restaurant.com" onChange={set("email")} required /></div>
            <div style={field}><label style={label}>Password</label><FI type="password" placeholder="••••••••" onChange={set("password")} required /></div>
            <div style={field}>
              <label style={label}>Restaurant access key</label>
              <FI type="text" placeholder="Unique restaurant password" onChange={set("restaurant_unique_password")} required />
              <p style={{ fontSize:"12px", color:"#4a4844", marginTop:"6px" }}>The unique password set for your restaurant</p>
            </div>
            <button type="submit" style={btn}
              onMouseEnter={e => { e.currentTarget.style.background="#cdb48a"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#b89a6a"; e.currentTarget.style.transform="none"; }}
            >Sign in</button>
          </form>
          <div style={foot}>No admin account? <Link to="/admin-register" style={{ color:"#b89a6a", fontWeight:"500" }}>Register restaurant</Link></div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
