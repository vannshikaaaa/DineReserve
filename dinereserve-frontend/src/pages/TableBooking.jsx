import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";

const BG   = "#0e0f0d";
const S1   = "#151713";
const S2   = "#1c1e1a";
const S3   = "#232620";
const GOLD  = "#c9a96e";
const T1   = "#f0ede6";
const T2   = "#8f8b82";
const T3   = "#4a4840";
const BRD  = "rgba(255,255,255,0.07)";
const BRD2 = "rgba(255,255,255,0.12)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

const demandCfg = {
  High:   { bg: "rgba(224,92,92,0.08)",  bd: "rgba(224,92,92,0.25)",  c: "#e05c5c", icon: "High demand" },
  Medium: { bg: "rgba(224,169,78,0.08)", bd: "rgba(224,169,78,0.25)", c: "#e0a94e", icon: "Medium demand" },
  Low:    { bg: "rgba(76,175,125,0.08)", bd: "rgba(76,175,125,0.25)", c: "#4caf7d", icon: "Low demand" },
};

function TableBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [date, setDate]     = useState("");
  const [time, setTime]     = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes]   = useState("");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError]   = useState("");
  const [demand, setDemand] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDemand = useCallback(async () => {
    setDemandLoading(true);
    try {
      const guestNum    = parseInt(guests);
      const table_cat   = guestNum <= 2 ? 0 : guestNum <= 4 ? 1 : 2;
      const dateObj     = new Date(date);
      const jsDay       = dateObj.getDay();
      const day_of_week = jsDay === 0 ? 6 : jsDay - 1;
      const hour        = parseInt(time.split(":")[0]);
      const month       = dateObj.getMonth() + 1;
      const res = await API.post("/ai/predict-demand", { table_category: table_cat, day_of_week, hour, month });
      setDemand(res.data.demand);
    } catch { setDemand(null); }
    finally { setDemandLoading(false); }
  }, [date, time, guests]);

  useEffect(() => {
    if (!date || !time || !guests) { setDemand(null); return; }
    fetchDemand();
  }, [date, time, guests, fetchDemand]);

  const checkAvailability = async () => {
    if (!date || !time) { setError("Please select date and time"); return; }
    setError(""); setLoading(true); setTables([]); setSelectedTable(null);
    try {
      const res = await API.get(`/restaurants/${id}/available-tables`, { params: { date, time, guests } });
      if (res.data.length === 0) setError("No tables available for this slot");
      setTables(res.data);
    } catch (err) { setError(err.response?.data?.detail || "Failed to fetch tables"); }
    finally { setLoading(false); }
  };

  const confirmBooking = async () => {
    if (!selectedTable) { setError("Please select a table"); return; }
    if (!guests) { setError("Please enter number of guests"); return; }
    setBookingLoading(true);
    try {
      const res = await API.post("/bookings", {
        restaurant_id: id, table_id: selectedTable,
        date, time, guests: Number(guests), notes,
      });
      const tbl = tables.find(t => t._id === selectedTable);
      navigate("/thankyou", { state: { ...res.data, restaurant_id: id, table_name: tbl?.name || "Your Table", date, time, guests: Number(guests) } });
    } catch (err) { setError(err.response?.data?.detail || "Booking failed"); }
    finally { setBookingLoading(false); }
  };

  const inputStyle = {
    background: S2, border: `1px solid ${BRD}`, borderRadius: "8px",
    padding: "11px 14px", color: T1, fontFamily: SANS, fontSize: "14px",
    width: "100%", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: "500",
    letterSpacing: "0.07em", textTransform: "uppercase",
    color: T3, marginBottom: "7px",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "620px", margin: "0 auto", padding: isMobile ? "20px 16px" : "40px 24px" }}>

        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? "24px" : "28px", fontWeight: "400", color: T1, marginBottom: "28px" }}>
          Book a Table
        </h1>

        {error && (
          <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.25)", borderRadius: "8px", padding: "12px 16px", color: "#e05c5c", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Booking form */}
        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: isMobile ? "20px 16px" : "28px", marginBottom: "20px" }}>

          {/* Date and Time */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "16px", marginBottom: "16px",
          }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = BRD;  e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = BRD;  e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Guests</label>
            <input type="number" min="1" placeholder="Number of guests" value={guests}
              onChange={e => setGuests(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = BRD;  e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Special notes (optional)</label>
            <textarea
              placeholder="Allergies, special requests..." value={notes} rows={3}
              onChange={e => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = BRD;  e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Demand badge */}
          {demandLoading && <p style={{ fontSize: "13px", color: T3, marginBottom: "12px" }}>Checking demand...</p>}
          {demand && !demandLoading && (() => {
            const d = demandCfg[demand.demand_level] || demandCfg.Low;
            return (
              <div style={{ background: d.bg, border: `1px solid ${d.bd}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: d.c }}>{d.icon}</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: d.c, opacity: 0.85 }}>{demand.availability_advice}</p>
              </div>
            );
          })()}

          <button
            onClick={checkAvailability}
            style={{ width: "100%", padding: "12px", background: GOLD, color: "#0e0f0d", border: "none", borderRadius: "8px", fontFamily: SANS, fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#d9bc8a"}
            onMouseLeave={e => e.currentTarget.style.background = GOLD}
          >
            Check availability
          </button>
        </div>

        {loading && <p style={{ color: T3, fontSize: "13px" }}>Loading tables...</p>}

        {/* Table grid */}
        {tables.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: "14px" }}>
              Select a table
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(90px, 1fr))" : "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "12px",
            }}>
              {tables.map(t => {
                const selected = selectedTable === t._id;
                return (
                  <div key={t._id} onClick={() => setSelectedTable(t._id)}
                    style={{
                      background: selected ? "rgba(201,169,110,0.12)" : S1,
                      border: `1px solid ${selected ? "rgba(201,169,110,0.4)" : BRD}`,
                      borderRadius: "10px", padding: isMobile ? "12px" : "16px",
                      cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                      boxShadow: selected ? "0 0 0 1px rgba(201,169,110,0.3)" : "none",
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = BRD2; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = BRD; }}
                  >
                    <p style={{ margin: "0 0 4px", fontSize: isMobile ? "13px" : "14px", color: selected ? GOLD : T1, fontWeight: "500" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: T3 }}>{t.seats} seats</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tables.length > 0 && (
          <button
            onClick={confirmBooking} disabled={bookingLoading}
            style={{ width: "100%", padding: "13px", background: bookingLoading ? S1 : GOLD, color: bookingLoading ? T3 : "#0e0f0d", border: "none", borderRadius: "10px", fontFamily: SANS, fontSize: "15px", fontWeight: "600", cursor: bookingLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!bookingLoading) e.currentTarget.style.background = "#d9bc8a"; }}
            onMouseLeave={e => { if (!bookingLoading) e.currentTarget.style.background = GOLD; }}
          >
            {bookingLoading ? "Confirming..." : "Confirm booking"}
          </button>
        )}
      </div>
    </div>
  );
}

export default TableBooking;