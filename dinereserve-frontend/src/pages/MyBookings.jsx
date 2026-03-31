import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";

const BG   = "#0e0f0d";
const S1   = "#151713";
const S2   = "#1c1e1a";
const S3   = "#232620";
const GOLD = "#c9a96e";
const GOLD_DIM = "rgba(201,169,110,0.12)";
const T1   = "#f0ede6";
const T2   = "#8f8b82";
const T3   = "#4a4840";
const BRD  = "rgba(255,255,255,0.07)";
const BRD2 = "rgba(255,255,255,0.12)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

const pill = (bg, color, border) => ({
  display: "inline-block", padding: "3px 10px",
  borderRadius: "20px", fontSize: "12px", fontWeight: "500",
  background: bg, color, border: `1px solid ${border}`,
  letterSpacing: "0.02em",
});

function MyBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [riskScores, setRiskScores]     = useState({});
  const [cancelRisks, setCancelRisks]   = useState({});
  const [reviewModal, setReviewModal]   = useState(null);
  const [reviewText, setReviewText]     = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [submittedIds, setSubmittedIds] = useState([]);
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAllRisks = useCallback(async (list) => {
    const ns = {}, cs = {};
    await Promise.all(list.map(async (b) => {
      const hour        = parseInt(String(b.time).split(":")[0]) || 19;
      const jsDay       = new Date(b.date).getDay();
      const day_of_week = jsDay === 0 ? 6 : jsDay - 1;
      const month       = new Date(b.date).getMonth() + 1;
      const payload     = { hour, day_of_week, month, guests: parseInt(b.guests) || 2 };
      const [nr, cr]    = await Promise.allSettled([
        API.post("/ai/predict-noshow", payload),
        API.post("/ai/predict-cancellation", payload),
      ]);
      if (nr.status === "fulfilled" && nr.value.data?.prediction) ns[b.booking_id] = nr.value.data.prediction;
      if (cr.status === "fulfilled" && cr.value.data?.prediction) cs[b.booking_id] = cr.value.data.prediction;
    }));
    setRiskScores(ns);
    setCancelRisks(cs);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await API.get("/customer/bookings");
      const data = res.data || [];
      setBookings(data);
      const upcoming = data.filter(b => b.status === "Pending" || b.status === "confirmed");
      if (upcoming.length > 0) await fetchAllRisks(upcoming);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchAllRisks]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await API.delete(`/customer/bookings/${id}`);
      setBookings(p => p.filter(b => b.booking_id !== id));
      setRiskScores(p => { const u = { ...p }; delete u[id]; return u; });
      setCancelRisks(p => { const u = { ...p }; delete u[id]; return u; });
    } catch (err) { alert(err.response?.data?.detail || "Failed to cancel"); }
  };

  const openReview  = (b) => { setReviewModal(b); setReviewText(""); setReviewRating(5); setReviewResult(null); };
  const closeReview = ()  => { setReviewModal(null); setReviewText(""); setReviewRating(5); setReviewResult(null); };

  const submitReview = async () => {
    if (!reviewText.trim()) { alert("Please write a review."); return; }
    setReviewLoading(true);
    try {
      const res = await API.post("/reviews", {
        restaurant_id: reviewModal.restaurant_id,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      setReviewResult({ sentiment: res.data.sentiment || "Neutral", emoji: res.data.emoji || "😐" });
      setSubmittedIds(p => [...p, reviewModal.booking_id]);
    } catch (err) { alert(err.response?.data?.detail || "Failed to submit."); }
    finally { setReviewLoading(false); }
  };

  const riskBadge = (score, type) => {
    if (!score) return null;
    const cfg = {
      noshow: {
        High:   { bg: "rgba(224,92,92,0.12)",  bd: "rgba(224,92,92,0.3)",  c: "#e05c5c", label: "High no-show risk" },
        Medium: { bg: "rgba(224,169,78,0.12)", bd: "rgba(224,169,78,0.3)", c: "#e0a94e", label: "Medium no-show risk" },
        Low:    { bg: "rgba(76,175,125,0.12)", bd: "rgba(76,175,125,0.3)", c: "#4caf7d", label: "Low no-show risk" },
      },
      cancel: {
        High:   { bg: "rgba(155,100,220,0.12)", bd: "rgba(155,100,220,0.3)", c: "#b07fdc", label: "High cancel risk" },
        Medium: { bg: "rgba(100,130,220,0.12)", bd: "rgba(100,130,220,0.3)", c: "#7f9fdc", label: "Medium cancel risk" },
        Low:    { bg: "rgba(76,175,125,0.12)",  bd: "rgba(76,175,125,0.3)",  c: "#4caf7d", label: "Low cancel risk" },
      },
    };
    const s = cfg[type][score.risk_level] || cfg[type].Low;
    return (
      <div style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: "8px", padding: "8px 12px", marginTop: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: s.c }}>
          {s.label} — {Math.round(score.probability * 100)}%
        </span>
      </div>
    );
  };

  const statusPill = (status) => {
    const m = {
      Pending:   pill("rgba(91,155,213,0.12)",  "#5b9bd5", "rgba(91,155,213,0.3)"),
      confirmed: pill("rgba(76,175,125,0.12)",  "#4caf7d", "rgba(76,175,125,0.3)"),
      completed: pill("rgba(255,255,255,0.06)", T2,        BRD2),
      cancelled: pill("rgba(224,92,92,0.12)",   "#e05c5c", "rgba(224,92,92,0.3)"),
      no_show:   pill("rgba(224,169,78,0.12)",  "#e0a94e", "rgba(224,169,78,0.3)"),
    };
    const labels = { Pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", no_show: "No Show" };
    const s = m[status] || m.Pending;
    return <span style={s}>{labels[status] || status}</span>;
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: SANS, color: T3 }}>
      Loading bookings...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>

        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? "24px" : "30px", fontWeight: "400", color: T1, marginBottom: "6px", letterSpacing: "-0.01em" }}>
          My Bookings
        </h1>
        <p style={{ fontSize: "13px", color: T3, marginBottom: "32px" }}>
          {bookings.length} reservation{bookings.length !== 1 ? "s" : ""}
        </p>

        {bookings.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: S1, border: `1px solid ${BRD}`, borderRadius: "16px" }}>
            <p style={{ fontSize: "16px", color: T2, marginBottom: "6px" }}>No bookings yet</p>
            <p style={{ fontSize: "13px", color: T3 }}>Book a table to get started</p>
          </div>
        )}

        {bookings.map((b) => (
          <div key={b.booking_id} style={{
            background: S1, border: `1px solid ${BRD}`, borderRadius: "14px",
            padding: isMobile ? "16px" : "20px 22px", marginBottom: "14px",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = BRD2}
            onMouseLeave={e => e.currentTarget.style.borderColor = BRD}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "10px" }}>
              <span style={{ fontFamily: SERIF, fontSize: isMobile ? "15px" : "17px", color: T1, fontWeight: "400" }}>
                {b.restaurant_name}
              </span>
              {statusPill(b.status)}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
              gap: "6px 20px",
              marginBottom: "12px",
            }}>
              {[
                { label: "Date",   val: b.date },
                { label: "Time",   val: b.time },
                { label: "Guests", val: `${b.guests} guests` },
                { label: "Table",  val: b.table_name || "—" },
              ].map(({ label, val }) => (
                <p key={label} style={{ margin: 0, fontSize: "13px", color: T2 }}>
                  <span style={{ color: T3, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", marginRight: "8px" }}>
                    {label}
                  </span>
                  {val}
                </p>
              ))}
              {b.notes && (
                <p style={{ margin: 0, fontSize: "13px", color: T2, gridColumn: "1 / -1", fontStyle: "italic" }}>
                  {b.notes}
                </p>
              )}
            </div>

            {(b.status === "Pending" || b.status === "confirmed") && (
              <div style={{ borderTop: `1px solid ${BRD}`, paddingTop: "12px", marginBottom: "12px" }}>
                {riskBadge(riskScores[b.booking_id],  "noshow")}
                {riskBadge(cancelRisks[b.booking_id], "cancel")}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {(b.status === "Pending" || b.status === "confirmed") && (
                <button
                  onClick={() => cancelBooking(b.booking_id)}
                  style={{
                    padding: "7px 16px", background: "rgba(224,92,92,0.1)", color: "#e05c5c",
                    border: "1px solid rgba(224,92,92,0.25)", borderRadius: "7px",
                    cursor: "pointer", fontFamily: SANS, fontSize: "13px", fontWeight: "500",
                    transition: "all 0.2s", flex: isMobile ? "1" : "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#e05c5c"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(224,92,92,0.1)"; e.currentTarget.style.color = "#e05c5c"; }}
                >
                  Cancel booking
                </button>
              )}
              {b.status === "completed" && !submittedIds.includes(b.booking_id) && (
                <button
                  onClick={() => openReview(b)}
                  style={{
                    padding: "7px 16px", background: GOLD_DIM, color: GOLD,
                    border: `1px solid rgba(201,169,110,0.25)`, borderRadius: "7px",
                    cursor: "pointer", fontFamily: SANS, fontSize: "13px", fontWeight: "600",
                    transition: "all 0.2s", flex: isMobile ? "1" : "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = "#0e0f0d"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD_DIM; e.currentTarget.style.color = GOLD; }}
                >
                  Write a review
                </button>
              )}
              {b.status === "completed" && submittedIds.includes(b.booking_id) && (
                <span style={{ fontSize: "12px", color: "#4caf7d", fontWeight: "500" }}>Review submitted</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviewModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeReview(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}
        >
          <div style={{ background: S2, border: `1px solid ${BRD2}`, borderRadius: "20px", padding: isMobile ? "24px 20px" : "32px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", fontFamily: SANS }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h3 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: "400", color: T1, margin: 0 }}>Write a review</h3>
              <button onClick={closeReview} style={{ background: "none", border: "none", color: T3, fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: "4px" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: T3 }}>
              {reviewModal.restaurant_name} · {reviewModal.date}
            </p>

            <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: "10px" }}>Rating</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} onClick={() => !reviewResult && setReviewRating(star)}
                  style={{ fontSize: "28px", cursor: reviewResult ? "default" : "pointer", color: star <= reviewRating ? GOLD : S3, transition: "all 0.15s", transform: star <= reviewRating ? "scale(1.15)" : "scale(1)", display: "inline-block" }}>
                  ★
                </span>
              ))}
            </div>

            <p style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: "10px" }}>Your review</p>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              disabled={!!reviewResult}
              style={{ width: "100%", background: S3, border: `1px solid ${BRD}`, borderRadius: "10px", padding: "12px 14px", fontSize: "14px", color: T1, fontFamily: SANS, resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.12)"; }}
              onBlur={e  => { e.target.style.borderColor = BRD;  e.target.style.boxShadow = "none"; }}
            />

            {reviewResult && (
              <div style={{ marginTop: "16px", background: S3, border: `1px solid ${BRD2}`, borderRadius: "12px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "28px", margin: "0 0 6px" }}>{reviewResult.emoji}</p>
                <p style={{ fontWeight: "600", fontSize: "15px", color: T1, margin: "0 0 4px" }}>{reviewResult.sentiment} review</p>
                <p style={{ fontSize: "12px", color: T3, margin: 0 }}>Thank you for your feedback</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button onClick={closeReview}
                style={{ padding: "9px 20px", background: S3, color: T2, border: `1px solid ${BRD2}`, borderRadius: "8px", cursor: "pointer", fontFamily: SANS, fontSize: "13px" }}>
                {reviewResult ? "Close" : "Cancel"}
              </button>
              {!reviewResult && (
                <button onClick={submitReview} disabled={reviewLoading || !reviewText.trim()}
                  style={{ padding: "9px 22px", background: reviewLoading || !reviewText.trim() ? S3 : GOLD, color: reviewLoading || !reviewText.trim() ? T3 : "#0e0f0d", border: "none", borderRadius: "8px", cursor: reviewLoading || !reviewText.trim() ? "not-allowed" : "pointer", fontFamily: SANS, fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}>
                  {reviewLoading ? "Submitting..." : "Submit review"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;