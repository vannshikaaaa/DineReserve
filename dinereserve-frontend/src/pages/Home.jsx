import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const PAGE = {
  minHeight: "100vh",
  background: "#0c0d0f",
  fontFamily: "'Jost', sans-serif",
  paddingBottom: "60px"
};

const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = "#b89a6a";
const T1 = "#e8e4de";
const T2 = "#8f8b84";
const T3 = "#4a4844";
const BG1 = "#141618";
const BG2 = "#1a1c20";
const BG3 = "#212428";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_MD = "rgba(255,255,255,0.12)";

function RestaurantCard({ r }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const cuisine = Array.isArray(r.cuisine)
    ? r.cuisine.join(", ")
    : r.cuisine || "Various";

  return (
    <div
      onClick={() => navigate(`/restaurant/${r._id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: BG1,
        border: `1px solid ${hov ? BORDER_MD : BORDER}`,
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        transform: hov ? "translateY(-5px)" : "none",
        boxShadow: hov
          ? "0 16px 40px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: "200px" }}>
        <img
          src={r.image}
          alt={r.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hov ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80";
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(to top, rgba(20,22,24,0.9), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(12,13,15,0.75)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${BORDER_MD}`,
            borderRadius: "20px",
            padding: "3px 10px",
            fontSize: "12px",
            color: GOLD,
            fontWeight: "500",
          }}
        >
          ★ {r.rating ?? "N/A"}
        </div>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        <h3
          style={{
            fontFamily: SERIF,
            fontSize: "19px",
            fontWeight: "400",
            color: T1,
            marginBottom: "8px",
            letterSpacing: "0.01em",
          }}
        >
          {r.name}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            marginBottom: "16px",
          }}
        >
          <p style={{ fontSize: "13px", color: T2 }}>
            <span
              style={{
                color: T3,
                marginRight: "8px",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Cuisine
            </span>
            {cuisine}
          </p>
          <p style={{ fontSize: "13px", color: T2 }}>
            <span
              style={{
                color: T3,
                marginRight: "8px",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Price
            </span>
            {r.price_range ?? "—"}
          </p>
          <p style={{ fontSize: "13px", color: T2 }}>
            <span
              style={{
                color: T3,
                marginRight: "8px",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Type
            </span>
            {r.restaurant_type ?? "—"}
          </p>
        </div>

        <div
          style={{
            padding: "10px 0 0",
            borderTop: `1px solid ${BORDER}`,
            fontSize: "12px",
            fontWeight: "500",
            color: hov ? GOLD : T3,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            transition: "color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>View details</span>
          <span style={{ fontSize: "16px" }}>→</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [pref, setPref] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRestaurants = async (params = {}) => {
    setLoading(true);
    try {
      const res = await API.get("/restaurants", { params });
      setRestaurants(res.data);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const applyFilters = () => {
    const p = {};
    if (search) p.search = search;
    if (cuisine) p.cuisine = cuisine;
    if (pref) p.food_preference = pref;
    if (type) p.restaurant_type = type;
    if (budget) p.budget = budget;
    if (guests) p.guests = guests;
    fetchRestaurants(p);
  };

  const selStyle = {
    padding: "10px 14px",
    background: BG3,
    border: `1px solid ${BORDER_MD}`,
    borderRadius: "8px",
    color: T1,
    fontFamily: "'Jost', sans-serif",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    width: "100%",
  };

  const INNER = {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: isMobile ? "16px 12px" : "36px 24px",
  };

  return (
    <div style={PAGE}>
      <div style={INNER}>

        {/* Page header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: isMobile ? "24px" : "34px",
              fontWeight: "300",
              color: T1,
              letterSpacing: "-0.01em",
              marginBottom: "6px",
            }}
          >
            Featured Restaurants
          </h1>
          <p style={{ fontSize: "13px", color: T3 }}>
            Discover, reserve, and experience the best dining
          </p>
        </div>

        {/* Search row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            style={{
              flex: 1,
              minWidth: isMobile ? "100%" : "200px",
              padding: "12px 16px",
              background: BG2,
              border: `1px solid ${BORDER_MD}`,
              borderRadius: "8px",
              color: T1,
              fontFamily: "'Jost', sans-serif",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = GOLD;
              e.target.style.boxShadow = "0 0 0 3px rgba(184,154,106,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = BORDER_MD;
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            onClick={applyFilters}
            style={{
              padding: "12px 24px",
              background: GOLD,
              color: "#0c0d0f",
              border: "none",
              borderRadius: "8px",
              fontFamily: "'Jost', sans-serif",
              fontSize: "13px",
              fontWeight: "600",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flex: isMobile ? "1" : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#cdb48a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
          >
            Search
          </button>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              padding: "12px 20px",
              background: "transparent",
              border: `1px solid ${BORDER_MD}`,
              borderRadius: "8px",
              color: T2,
              fontFamily: "'Jost', sans-serif",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flex: isMobile ? "1" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = GOLD;
              e.currentTarget.style.color = GOLD;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BORDER_MD;
              e.currentTarget.style.color = T2;
            }}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div
            style={{
              background: BG1,
              border: `1px solid ${BORDER}`,
              borderRadius: "14px",
              padding: isMobile ? "16px 14px" : "22px 24px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: T3,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Filter restaurants
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr 1fr"
                  : "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
                alignItems: "end",
              }}
            >
              <select
                value={pref}
                onChange={(e) => setPref(e.target.value)}
                style={selStyle}
              >
                <option value="">Food preference</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
              </select>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                style={selStyle}
              >
                <option value="">Cuisine</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Italian">Italian</option>
                <option value="Continental">Continental</option>
                <option value="Mughlai">Mughlai</option>
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={selStyle}
              >
                <option value="">Restaurant type</option>
                <option value="Fine Dining">Fine Dining</option>
                <option value="Casual Dining">Casual Dining</option>
                <option value="Cafe">Cafe</option>
                <option value="Fast Food">Fast Food</option>
              </select>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={selStyle}
              >
                <option value="">Budget</option>
                <option value="Under Rs 500">Under ₹500</option>
                <option value="Under Rs 800">Under ₹800</option>
                <option value="Under Rs 1500">Under ₹1500</option>
                <option value="Under Rs 2000">Under ₹2000</option>
              </select>
              <input
                type="number"
                placeholder="Guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                style={selStyle}
              />
              <button
                onClick={applyFilters}
                style={{
                  padding: "10px 22px",
                  background: GOLD,
                  color: "#0c0d0f",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "13px",
                  fontWeight: "600",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  width: "100%",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#cdb48a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = GOLD)
                }
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setPref("");
                  setCuisine("");
                  setType("");
                  setBudget("");
                  setGuests("");
                  setSearch("");
                  fetchRestaurants();
                }}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  border: `1px solid ${BORDER_MD}`,
                  borderRadius: "8px",
                  color: T3,
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "13px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: T3,
              fontSize: "14px",
            }}
          >
            Loading restaurants...
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ fontSize: "18px", color: T2, marginBottom: "8px" }}>
              No restaurants found
            </p>
            <p style={{ fontSize: "14px", color: T3 }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: "12px",
                color: T3,
                marginBottom: "20px",
                letterSpacing: "0.04em",
              }}
            >
              {restaurants.length} restaurant
              {restaurants.length !== 1 ? "s" : ""} available
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fill, minmax(min(290px, 100%), 1fr))",
                gap: "22px",
              }}
            >
              {restaurants.map((r) => (
                <RestaurantCard key={r._id} r={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}