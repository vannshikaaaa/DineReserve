import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// ── Design tokens (operator — cool) ──────────────────────────
const BG   = "#0d0f12";
const S1   = "#131619";
const S2   = "#191c21";
const S3   = "#1f2329";
const BLUE  = "#5b8def";
const BLUE_DIM = "rgba(91,141,239,0.12)";
const T1   = "#e8ecf0";
const T2   = "#8a9099";
const T3   = "#454952";
const BRD  = "rgba(255,255,255,0.07)";
const BRD2 = "rgba(255,255,255,0.12)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

const riskColors = {
  noshow: {
    High:   { bg: "rgba(224,92,92,0.1)",  bd: "rgba(224,92,92,0.25)",  c: "#e05c5c" },
    Medium: { bg: "rgba(224,169,78,0.1)", bd: "rgba(224,169,78,0.25)", c: "#e0a94e" },
    Low:    { bg: "rgba(76,175,125,0.1)", bd: "rgba(76,175,125,0.25)", c: "#4caf7d" },
  },
  cancel: {
    High:   { bg: "rgba(155,100,220,0.1)", bd: "rgba(155,100,220,0.25)", c: "#b07fdc" },
    Medium: { bg: "rgba(91,141,239,0.1)",  bd: "rgba(91,141,239,0.25)",  c: "#5b8def" },
    Low:    { bg: "rgba(76,175,125,0.1)",  bd: "rgba(76,175,125,0.25)",  c: "#4caf7d" },
  },
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData]             = useState(null);
  const [error, setError]           = useState("");
  const [peakForecast, setPeakForecast] = useState([]);
  const [peakLoading, setPeakLoading]   = useState(false);
  const [selectedDay, setSelectedDay]   = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [todayBookings, setTodayBookings] = useState([]);
  const [riskScores, setRiskScores]   = useState({});
  const [cancelRisks, setCancelRisks] = useState({});
  const [riskLoading, setRiskLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/admin-login"); return; }
    fetchDashboard();
    fetchTodayBookings();
    fetchPeakForecast(selectedDay, selectedMonth);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/admin/dashboard");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load");
      if (err.response?.status === 401) navigate("/admin-login");
    }
  };

  const fetchTodayBookings = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res   = await API.get("/admin/bookings", { params: { date: today } });
      const list  = res.data || [];
      setTodayBookings(list);
      if (list.length > 0) fetchAllRisks(list);
    } catch {}
  };

  const fetchAllRisks = async (list) => {
    setRiskLoading(true);
    const ns = {}, cs = {};
    await Promise.all(list.map(async (b) => {
      const hour        = parseInt(b.time) || 19;
      const jsDay       = new Date(b.date).getDay();
      const day_of_week = jsDay === 0 ? 6 : jsDay - 1;
      const month       = new Date(b.date).getMonth() + 1;
      const payload     = { hour, day_of_week, month, guests: parseInt(b.guests) || 2 };
      const [nr, cr] = await Promise.allSettled([
        API.post("/ai/predict-noshow", payload),
        API.post("/ai/predict-cancellation", payload),
      ]);
      if (nr.status === "fulfilled") ns[b._id] = nr.value.data.prediction;
      if (cr.status === "fulfilled") cs[b._id] = cr.value.data.prediction;
    }));
    setRiskScores(ns);
    setCancelRisks(cs);
    setRiskLoading(false);
  };

  const fetchPeakForecast = async (day, month) => {
    setPeakLoading(true);
    setPeakForecast([]);
    try {
      const res    = await API.post("/ai/predict-peak-hour", { day_of_week: day, month });
      const sorted = [...(res.data.hourly_forecast || [])].sort((a, b) => a.hour - b.hour);
      setPeakForecast(sorted);
    } catch {}
    finally { setPeakLoading(false); }
  };

  const handleForecastChange = (day, month) => {
    setSelectedDay(day);
    setSelectedMonth(month);
    fetchPeakForecast(day, month);
  };

  const riskBadge = (score, type) => {
    if (!score) return <span style={{ color: T3, fontSize: "12px" }}>—</span>;
    const s = riskColors[type][score.risk_level] || riskColors[type].Low;
    return (
      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: s.bg, border: `1px solid ${s.bd}`, color: s.c, whiteSpace: "nowrap" }}>
        {score.risk_level} {Math.round(score.probability * 100)}%
      </span>
    );
  };

  const maxB = Math.max(1, ...peakForecast.map(s => s.predicted_bookings));
  const dayNames   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  if (error) return <div style={{ padding: "40px", color: "#e05c5c", fontFamily: SANS }}>{error}</div>;
  if (!data)  return <div style={{ padding: "40px", color: T3, fontFamily: SANS }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: "400", color: T1, marginBottom: "4px" }}>
            Restaurant Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: T3 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "32px" }}>
          {[
            { label: "Today's reservations", val: data.today_reservations },
            { label: "Booked tables",         val: data.booked_tables },
            { label: "Expected guests",        val: data.expected_guests },
            { label: "No shows predicted",     val: data.no_shows },
            { label: "Busiest hour",           val: data.peak_hours },
            { label: "Avg guests / day",       val: data.avg_guests },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: T3, marginBottom: "10px", margin: "0 0 10px" }}>
                {label}
              </p>
              <p style={{ fontFamily: SERIF, fontSize: "26px", color: T1, margin: 0, lineHeight: 1 }}>
                {val ?? "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Peak forecast */}
        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: "400", color: T1, marginBottom: "20px" }}>
            Peak Hour Forecast
          </h2>

          {/* Day/Month selectors */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Day", value: selectedDay, options: dayNames.map((n, i) => ({ val: i, label: n })), onChange: v => handleForecastChange(Number(v), selectedMonth) },
              { label: "Month", value: selectedMonth, options: monthNames.map((n, i) => ({ val: i+1, label: n })), onChange: v => handleForecastChange(selectedDay, Number(v)) },
            ].map(({ label, value, options, onChange }) => (
              <div key={label}>
                <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: "6px" }}>{label}</p>
                <select value={value} onChange={e => onChange(e.target.value)}
                  style={{ background: S3, border: `1px solid ${BRD2}`, borderRadius: "8px", color: T1, padding: "8px 12px", fontFamily: SANS, fontSize: "13px", cursor: "pointer", outline: "none" }}>
                  {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {peakLoading ? (
            <p style={{ color: T3, fontSize: "13px" }}>Generating forecast...</p>
          ) : peakForecast.length === 0 ? (
            <p style={{ color: T3, fontSize: "13px" }}>No forecast available</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {peakForecast.map(slot => {
                const pct = Math.round((slot.predicted_bookings / maxB) * 100);
                const isPeak = slot.is_peak;
                return (
                  <div key={slot.hour} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "76px", fontSize: "12px", color: T2, textAlign: "right", flexShrink: 0 }}>
                      {slot.hour_label || `${slot.hour}:00`}
                    </span>
                    <div style={{ flex: 1, background: S3, borderRadius: "4px", height: "20px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: "4px", background: isPeak ? "#e05c5c" : BLUE, opacity: 0.85, transition: "width 0.4s ease", minWidth: "3px" }} />
                    </div>
                    <span style={{ width: "90px", fontSize: "12px", color: T2, flexShrink: 0 }}>
                      {slot.predicted_bookings} bookings
                      {isPeak && <span style={{ color: "#e05c5c", fontWeight: "600", marginLeft: "4px", fontSize: "11px" }}>PEAK</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's bookings risk table */}
        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: "400", color: T1, marginBottom: "4px" }}>
            Today's Bookings
          </h2>
          <p style={{ fontSize: "12px", color: T3, marginBottom: "20px" }}>
            ML-powered no-show and cancellation risk per booking
          </p>

          {todayBookings.length === 0 ? (
            <p style={{ color: T3, fontSize: "13px" }}>No bookings for today</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Customer","Time","Guests","Table","Notes","No-show risk","Cancel risk"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, borderBottom: `1px solid ${BRD}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayBookings.map((b, i) => (
                    <tr key={b._id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: `1px solid ${BRD}` }}>
                      <td style={{ padding: "12px", color: T1 }}>{b.customer_name || "Guest"}</td>
                      <td style={{ padding: "12px", color: T2 }}>{b.time}</td>
                      <td style={{ padding: "12px", color: T2 }}>{b.guests}</td>
                      <td style={{ padding: "12px", color: T2 }}>{b.table_name || "—"}</td>
                      <td style={{ padding: "12px", color: T2, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.notes || "—"}</td>
                      <td style={{ padding: "12px" }}>{riskLoading ? <span style={{ color: T3, fontSize: "12px" }}>Checking...</span> : riskBadge(riskScores[b._id], "noshow")}</td>
                      <td style={{ padding: "12px" }}>{riskLoading ? <span style={{ color: T3, fontSize: "12px" }}>Checking...</span> : riskBadge(cancelRisks[b._id], "cancel")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: "Manage tables", path: "/manage-tables" },
            { label: "Reports",       path: "/reports" },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              style={{ padding: "10px 22px", background: BLUE_DIM, color: BLUE, border: `1px solid rgba(91,141,239,0.25)`, borderRadius: "8px", cursor: "pointer", fontFamily: SANS, fontSize: "13px", fontWeight: "500", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.color = BG; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE_DIM; e.currentTarget.style.color = BLUE; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
