import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";

const BG   = "#0e0f0d";
const S1   = "#151713";
const GOLD  = "#c9a96e";
const T1   = "#f0ede6";
const T2   = "#8f8b82";
const T3   = "#4a4840";
const BRD  = "rgba(255,255,255,0.07)";
const BRD2 = "rgba(255,255,255,0.12)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

function ThankYou() {
  const location = useLocation();
  const navigate  = useNavigate();
  const booking   = location.state;
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs]         = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!booking?.restaurant_id) return;
    setLoadingRecs(true);
    API.post("/ai/recommend-dish", {
      restaurant_id: booking.restaurant_id,
      food_preference: booking.food_preference || null,
      top_n: 5,
    })
      .then(res => setRecommendations(res.data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingRecs(false));
  }, []);

  if (!booking) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: SANS, color: T3 }}>
      <p style={{ marginBottom: "16px" }}>No booking found</p>
      <button onClick={() => navigate("/home")} style={{ padding: "10px 22px", background: GOLD, color: "#0e0f0d", border: "none", borderRadius: "8px", fontFamily: SANS, fontWeight: "600", cursor: "pointer" }}>
        Go home
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>

        {/* Success header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "56px", height: "56px", background: "rgba(76,175,125,0.12)", border: "1px solid rgba(76,175,125,0.25)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ color: "#4caf7d", fontSize: "22px" }}>✓</span>
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? "26px" : "34px", fontWeight: "400", color: T1, marginBottom: "6px", letterSpacing: "-0.01em" }}>
            Booking confirmed
          </h1>
          <p style={{ fontSize: "14px", color: T3 }}>Your table is reserved. See you soon.</p>
        </div>

        {/* Booking details */}
        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: isMobile ? "16px" : "24px", marginBottom: "28px" }}>
          {[
            { label: "Booking ID",  val: booking.booking_id || booking.id },
            { label: "Restaurant",  val: booking.restaurant_name },
            { label: "Table",       val: booking.table_name },
            { label: "Date",        val: booking.date },
            { label: "Time",        val: booking.time },
            { label: "Guests",      val: booking.guests },
          ].map(({ label, val }, i, arr) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BRD}` : "none", gap: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontSize: "14px", color: T2, textAlign: "right", wordBreak: "break-all" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Dish recommendations */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: T3, marginBottom: "16px" }}>
            Recommended dishes
          </p>

          {loadingRecs ? (
            <p style={{ fontSize: "13px", color: T3 }}>Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p style={{ fontSize: "13px", color: T3 }}>No recommendations available</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
            }}>
              {recommendations.map((item, i) => (
                <div key={i}
                  style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "12px", padding: isMobile ? "12px" : "16px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = BRD2}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BRD}
                >
                  <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "500", color: T1 }}>{item.dish_name}</p>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: T3 }}>{item.cuisine_type} · {item.food_preference}</p>
                  {item.description && <p style={{ margin: "0 0 8px", fontSize: "12px", color: T2, lineHeight: 1.5 }}>{item.description}</p>}
                  <p style={{ margin: 0, fontSize: "11px", color: T3 }}>{item.popularity_score || item.order_count} orders</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <button
            onClick={() => navigate("/home")}
            style={{ padding: "12px 28px", background: GOLD, color: "#0e0f0d", border: "none", borderRadius: "10px", fontFamily: SANS, fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", flex: isMobile ? "1" : "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#d9bc8a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = "none"; }}
          >
            Back to home
          </button>
          <button
            onClick={() => navigate("/bookings")}
            style={{ padding: "12px 24px", background: "transparent", color: T2, border: `1px solid ${BRD2}`, borderRadius: "10px", fontFamily: SANS, fontSize: "14px", cursor: "pointer", transition: "all 0.2s", flex: isMobile ? "1" : "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = S1; e.currentTarget.style.color = T1; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T2; }}
          >
            My bookings
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThankYou;