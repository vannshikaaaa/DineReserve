import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import Chart from "chart.js/auto";

const BG   = "#0d0f12";
const S1   = "#131619";
const S3   = "#1f2329";
const BLUE  = "#5b8def";
const T1   = "#e8ecf0";
const T2   = "#8a9099";
const T3   = "#454952";
const BRD  = "rgba(255,255,255,0.07)";
const BRD2 = "rgba(255,255,255,0.12)";
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";

function Reports() {
  const barRef      = useRef(null);
  const barInstance = useRef(null);
  const pieRef      = useRef(null);
  const pieInstance = useRef(null);

  const [restaurants, setRestaurants]     = useState([]);
  const [selectedRest, setSelectedRest]   = useState("");
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError]     = useState("");
  const [isMobile, setIsMobile]                 = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchReports();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!sentimentData || !pieRef.current) return;
    if (pieInstance.current) pieInstance.current.destroy();
    const { positive_count, neutral_count, negative_count } = sentimentData;
    pieInstance.current = new Chart(pieRef.current, {
      type: "doughnut",
      data: {
        labels: ["Positive", "Neutral", "Negative"],
        datasets: [{
          data: [positive_count, neutral_count, negative_count],
          backgroundColor: ["rgba(76,175,125,0.8)", "rgba(138,144,153,0.5)", "rgba(224,92,92,0.8)"],
          borderColor: ["#4caf7d", "#454952", "#e05c5c"],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: T2, font: { size: 13, family: SANS }, padding: 16, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
            backgroundColor: S3, titleColor: T1, bodyColor: T2, borderColor: BRD2, borderWidth: 1,
          },
        },
      },
    });
  }, [sentimentData]);

  const fetchReports = async () => {
    try {
      const res = await API.get("/admin/analytics");
      if (barInstance.current) barInstance.current.destroy();
      barInstance.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: res.data.labels,
          datasets: [{
            label: "Bookings",
            data: res.data.bookings,
            backgroundColor: "rgba(91,141,239,0.6)",
            borderColor: "rgba(91,141,239,0.9)",
            borderWidth: 1, borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: T2, font: { size: 12, family: SANS } } },
            tooltip: { backgroundColor: S3, titleColor: T1, bodyColor: T2, borderColor: BRD2, borderWidth: 1 },
          },
          scales: {
            x: { ticks: { color: T3, font: { size: 11, family: SANS } }, grid: { color: "rgba(255,255,255,0.04)" } },
            y: { beginAtZero: true, ticks: { stepSize: 1, color: T3, font: { size: 11, family: SANS } }, grid: { color: "rgba(255,255,255,0.04)" } },
          },
        },
      });
    } catch (err) { console.error(err); }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await API.get("/restaurants");
      setRestaurants(res.data || []);
      if (res.data?.length > 0) setSelectedRest(res.data[0]._id);
    } catch {}
  };

  const fetchSentiment = async () => {
    if (!selectedRest) return;
    setSentimentLoading(true); setSentimentError(""); setSentimentData(null);
    try {
      const res = await API.get(`/reviews/${selectedRest}/sentiment-summary`);
      setSentimentData(res.data);
    } catch (err) {
      setSentimentError(err.response?.data?.detail || "Failed to load sentiment.");
    } finally { setSentimentLoading(false); }
  };

  const overallColor = (overall) => {
    if (!overall) return { bg: S3, border: BRD, color: T2 };
    if (overall.includes("Positive")) return { bg: "rgba(76,175,125,0.08)", border: "rgba(76,175,125,0.2)", color: "#4caf7d" };
    if (overall.includes("Negative")) return { bg: "rgba(224,92,92,0.08)",  border: "rgba(224,92,92,0.2)",  color: "#e05c5c" };
    return { bg: S3, border: BRD, color: T2 };
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, paddingBottom: "60px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>

        <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? "22px" : "28px", fontWeight: "400", color: T1, marginBottom: "32px" }}>
          Reports & Analytics
        </h1>

        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: isMobile ? "20px 16px" : "28px", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: "400", color: T1, marginBottom: "20px" }}>
            Bookings per day
          </h2>
          <canvas ref={barRef} />
        </div>

        <div style={{ background: S1, border: `1px solid ${BRD}`, borderRadius: "16px", padding: isMobile ? "20px 16px" : "28px" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: "400", color: T1, marginBottom: "4px" }}>
            Customer sentiment
          </h2>
          <p style={{ fontSize: "13px", color: T3, marginBottom: "20px" }}>
            Select a restaurant to analyse review sentiments
          </p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
            <select
              value={selectedRest}
              onChange={e => { setSelectedRest(e.target.value); setSentimentData(null); setSentimentError(""); }}
              style={{ flex: 1, minWidth: "160px", background: S3, border: `1px solid ${BRD2}`, borderRadius: "8px", color: T1, padding: "9px 12px", fontFamily: SANS, fontSize: "13px", outline: "none", cursor: "pointer" }}
            >
              {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            <button
              onClick={fetchSentiment}
              disabled={sentimentLoading || !selectedRest}
              style={{ padding: "9px 22px", background: sentimentLoading ? S3 : BLUE, color: sentimentLoading ? T3 : "#0d0f12", border: "none", borderRadius: "8px", fontFamily: SANS, fontSize: "13px", fontWeight: "600", cursor: sentimentLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s", width: isMobile ? "100%" : "auto" }}
            >
              {sentimentLoading ? "Analysing..." : "Analyse reviews"}
            </button>
          </div>

          {sentimentError && (
            <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.25)", borderRadius: "8px", padding: "12px 16px", color: "#e05c5c", fontSize: "13px", marginBottom: "16px" }}>
              {sentimentError}
            </div>
          )}

          {!sentimentData && !sentimentLoading && !sentimentError && (
            <div style={{ textAlign: "center", padding: "40px", color: T3, fontSize: "13px" }}>
              Select a restaurant and click Analyse reviews
            </div>
          )}

          {sentimentData && sentimentData.total === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: T3, fontSize: "13px" }}>
              No reviews yet for this restaurant
            </div>
          )}

          {sentimentData && sentimentData.total > 0 && (() => {
            const s = overallColor(sentimentData.overall);
            const pills = [
              { label: "Positive", count: sentimentData.positive_count, pct: sentimentData.positive_percent, bg: "rgba(76,175,125,0.1)",  bd: "rgba(76,175,125,0.25)",  c: "#4caf7d" },
              { label: "Neutral",  count: sentimentData.neutral_count,  pct: sentimentData.neutral_percent,  bg: "rgba(138,144,153,0.1)", bd: "rgba(138,144,153,0.25)", c: T2 },
              { label: "Negative", count: sentimentData.negative_count, pct: sentimentData.negative_percent, bg: "rgba(224,92,92,0.1)",   bd: "rgba(224,92,92,0.25)",  c: "#e05c5c" },
            ];
            return (
              <>
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <p style={{ fontFamily: SERIF, fontSize: "17px", color: T1, margin: "0 0 3px", fontWeight: "400" }}>
                      {sentimentData.overall_emoji} {sentimentData.overall}
                    </p>
                    <p style={{ fontSize: "12px", color: T3, margin: 0 }}>
                      Based on {sentimentData.total} review{sentimentData.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {pills.map(p => (
                      <span key={p.label} style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", background: p.bg, border: `1px solid ${p.bd}`, color: p.c }}>
                        {p.label}: {p.count} ({p.pct}%)
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ maxWidth: isMobile ? "260px" : "320px", margin: "0 auto" }}>
                  <canvas ref={pieRef} />
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default Reports;