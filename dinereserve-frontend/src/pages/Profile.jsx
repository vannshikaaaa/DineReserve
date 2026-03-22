import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = "#b89a6a";
const T1 = "#e8e4de";
const T2 = "#8f8b84";
const T3 = "#4a4844";
const BG = "#0c0d0f";
const BG1 = "#141618";
const BG2 = "#1a1c20";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_MD = "rgba(255,255,255,0.12)";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/customer/profile").then(r => setProfile(r.data)).catch(console.error);
  }, []);

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"'Jost', sans-serif", paddingBottom:"60px" }}>
      <div style={{ maxWidth:"560px", margin:"0 auto", padding:"40px 24px" }}>

        <h1 style={{ fontFamily:SERIF, fontSize:"30px", fontWeight:"300", color:T1,
          letterSpacing:"-0.01em", marginBottom:"6px" }}>My Profile</h1>
        <p style={{ fontSize:"13px", color:T3, marginBottom:"32px" }}>Your account details</p>

        {!profile ? (
          <p style={{ color:T3, fontSize:"14px" }}>Loading...</p>
        ) : (
          <div style={{
            background:BG1, border:`1px solid ${BORDER}`,
            borderRadius:"20px", overflow:"hidden",
            boxShadow:"0 16px 48px rgba(0,0,0,0.5)",
          }}>
            {/* Header band */}
            <div style={{
              padding:"28px 28px 24px",
              borderBottom:`1px solid ${BORDER}`,
              display:"flex", alignItems:"center", gap:"18px",
            }}>
              <div style={{
                width:"52px", height:"52px",
                background:"rgba(184,154,106,0.1)",
                border:`1px solid rgba(184,154,106,0.25)`,
                borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <span style={{ fontFamily:SERIF, fontSize:"22px", color:GOLD, lineHeight:1 }}>
                  {profile.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ fontSize:"18px", fontWeight:"400", color:T1, marginBottom:"3px" }}>{profile.name}</p>
                <p style={{ fontSize:"13px", color:T3 }}>Guest member</p>
              </div>
            </div>

            {/* Info rows */}
            {[
              { label:"Email address", value:profile.email },
              { label:"Total bookings", value:profile.total_bookings ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"18px 28px", borderBottom:`1px solid ${BORDER}`,
              }}>
                <span style={{ fontSize:"11px", fontWeight:"500", color:T3,
                  letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
                <span style={{ fontSize:"14px", color:T1 }}>{value}</span>
              </div>
            ))}

            {/* Sign out row */}
            <div style={{ padding:"20px 28px" }}>
              <button
                onClick={logout}
                style={{
                  padding:"10px 22px",
                  background:"rgba(196,96,96,0.08)",
                  border:"1px solid rgba(196,96,96,0.2)",
                  borderRadius:"8px", color:"#c46060",
                  fontFamily:"'Jost', sans-serif", fontSize:"13px",
                  fontWeight:"500", letterSpacing:"0.05em",
                  cursor:"pointer", transition:"all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="#c46060"; e.currentTarget.style.color="white"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(196,96,96,0.08)"; e.currentTarget.style.color="#c46060"; }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
