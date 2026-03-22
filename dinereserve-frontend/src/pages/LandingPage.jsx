import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0e0f11",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: "480px", width: "100%" }}>

        {/* Brand mark */}
        <div style={{
          width: "56px", height: "56px",
          background: "rgba(201,169,110,0.1)",
          border: "1px solid rgba(201,169,110,0.25)",
          borderRadius: "14px",
          margin: "0 auto 28px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
              fill="#c9a96e" opacity="0.8"/>
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "48px", fontWeight: "400",
          color: "#f0ede8", letterSpacing: "-0.02em",
          lineHeight: "1.1", marginBottom: "12px",
        }}>
          DineReserve
        </h1>

        <p style={{
          fontSize: "16px", color: "#9a9590",
          marginBottom: "48px", lineHeight: "1.6",
        }}>
          Effortless restaurant reservations,<br />powered by AI
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "14px 32px",
              background: "#c9a96e",
              color: "#0e0f11",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#d9bc8a";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,169,110,0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#c9a96e";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Continue as Guest
          </button>

          <button
            onClick={() => navigate("/admin-login")}
            style={{
              padding: "14px 32px",
              background: "transparent",
              color: "#9a9590",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "400",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#f0ede8";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9a9590";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            Continue as Operator
          </button>
        </div>

        <p style={{
          marginTop: "40px",
          fontSize: "12px",
          color: "#5a5752",
          letterSpacing: "0.04em",
        }}>
          RESTAURANT RESERVATION SYSTEM · AI/ML POWERED
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
