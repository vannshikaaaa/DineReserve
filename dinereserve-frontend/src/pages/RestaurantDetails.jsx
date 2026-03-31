import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

const BG   = "#0e0f0d";
const S1   = "#151713";
const GOLD  = "#c9a96e";
const T1   = "#f0ede6";
const T2   = "#8f8b82";
const T3   = "#4a4840";
const BRD  = "rgba(255,255,255,0.07)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

export function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    API.get(`/restaurants/${id}`)
      .then(res => setRestaurant(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: SANS, color: T3 }}>
      Loading...
    </div>
  );
  if (!restaurant) return (
    <div style={{ padding: "40px", textAlign: "center", color: T3, fontFamily: SANS }}>
      Restaurant not found
    </div>
  );

  const cuisine = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "20px 16px" : "40px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "24px" : "40px",
          alignItems: "start",
          background: S1,
          border: `1px solid ${BRD}`,
          borderRadius: "20px",
          padding: isMobile ? "20px 16px" : "32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>

          <div>
            <img
              src={restaurant.image}
              alt={restaurant.name}
              style={{
                width: "100%",
                height: isMobile ? "220px" : "340px",
                objectFit: "cover",
                borderRadius: "14px",
                display: "block",
              }}
              onError={e => { e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"; }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h1 style={{
              fontFamily: SERIF,
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: "400", color: T1,
              lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>
              {restaurant.name}
            </h1>
            <p style={{ fontSize: "14px", color: T2, lineHeight: 1.7 }}>
              {restaurant.description}
            </p>

            <div style={{
              display: "flex", flexDirection: "column", gap: "10px",
              padding: "16px 0",
              borderTop: `1px solid ${BRD}`,
              borderBottom: `1px solid ${BRD}`,
            }}>
              {[
                { label: "Rating",   val: `★ ${restaurant.rating || "N/A"}` },
                { label: "Cuisine",  val: cuisine },
                { label: "Price",    val: restaurant.price_range },
                { label: "Capacity", val: `${restaurant.max_capacity} guests` },
                { label: "Type",     val: restaurant.restaurant_type },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "14px", color: T2, textAlign: "right" }}>{val || "—"}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/restaurant/${id}/book`)}
              style={{
                padding: "14px 28px",
                background: GOLD, color: "#0e0f0d",
                border: "none", borderRadius: "10px",
                fontFamily: SANS, fontSize: "15px", fontWeight: "600",
                cursor: "pointer", letterSpacing: "0.01em",
                transition: "all 0.2s",
                width: isMobile ? "100%" : "fit-content",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#d9bc8a"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,169,110,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              View available tables
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetails;