import { useEffect, useState } from "react";
import API from "../api/axios";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = "#b89a6a";
const T1 = "#e8e4de";
const T2 = "#8f8b84";
const T3 = "#4a4844";
const BG = "#0c0d0f";
const BG1 = "#141618";
const BG3 = "#212428";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_MD = "rgba(255,255,255,0.12)";

export default function ManageTables() {
  const [tables, setTables] = useState([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    load();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await API.get("/admin/tables");
      setTables(r.data);
    } catch {
      setError("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    if (!name || !seats) { setError("Enter both table name and seat count"); return; }
    try {
      await API.post("/admin/tables", { name, seats: Number(seats) });
      setName(""); setSeats(""); setError(""); load();
    } catch {
      setError("Failed to add table");
    }
  };

  const inpStyle = {
    padding: "12px 14px", background: BG3,
    border: `1px solid ${BORDER_MD}`, borderRadius: "8px",
    color: T1, fontFamily: "'Jost', sans-serif", fontSize: "14px",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'Jost', sans-serif", paddingBottom: "60px",
    }}>
      <div style={{
        maxWidth: "860px", margin: "0 auto",
        padding: isMobile ? "24px 16px" : "40px 24px",
      }}>

        <h1 style={{
          fontFamily: SERIF,
          fontSize: isMobile ? "24px" : "30px",
          fontWeight: "300", color: T1,
          letterSpacing: "-0.01em", marginBottom: "6px",
        }}>
          Manage Tables
        </h1>
        <p style={{ fontSize: "13px", color: T3, marginBottom: "32px" }}>
          Configure and monitor your restaurant floor
        </p>

        {error && (
          <div style={{
            background: "rgba(196,96,96,0.1)",
            border: "1px solid rgba(196,96,96,0.2)",
            borderRadius: "8px", padding: "10px 16px",
            color: "#c46060", fontSize: "13px", marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Add table panel */}
        <div style={{
          background: BG1, border: `1px solid ${BORDER_MD}`,
          borderRadius: "16px", padding: isMobile ? "20px 16px" : "26px",
          marginBottom: "28px",
        }}>
          <p style={{
            fontSize: "11px", fontWeight: "500", color: T3,
            letterSpacing: "0.1em", textTransform: "uppercase",
            marginBottom: "18px",
          }}>
            Add new table
          </p>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "12px",
            alignItems: isMobile ? "stretch" : "center",
          }}>
            <input
              placeholder="Table name (e.g. T1, Window Seat)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ ...inpStyle, flex: 1 }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(184,154,106,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = BORDER_MD; e.target.style.boxShadow = "none"; }}
            />
            <input
              placeholder="Seats" type="number" value={seats}
              onChange={e => setSeats(e.target.value)}
              style={{ ...inpStyle, width: isMobile ? "100%" : "120px", flex: isMobile ? "unset" : "none" }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(184,154,106,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = BORDER_MD; e.target.style.boxShadow = "none"; }}
            />
            <button
              onClick={add}
              style={{
                padding: "12px 24px",
                background: GOLD, color: "#0c0d0f",
                border: "none", borderRadius: "8px",
                fontFamily: "'Jost', sans-serif", fontSize: "13px",
                fontWeight: "600", letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: "pointer",
                whiteSpace: "nowrap", transition: "background 0.2s",
                width: isMobile ? "100%" : "auto",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#cdb48a"}
              onMouseLeave={e => e.currentTarget.style.background = GOLD}
            >
              Add Table
            </button>
          </div>
        </div>

        {/* Table count */}
        {!loading && (
          <p style={{ fontSize: "12px", color: T3, marginBottom: "16px", letterSpacing: "0.04em" }}>
            {tables.length} table{tables.length !== 1 ? "s" : ""} configured
          </p>
        )}

        {/* Table list */}
        {loading ? (
          <p style={{ color: T3, fontSize: "14px", textAlign: "center", padding: "40px" }}>
            Loading tables...
          </p>
        ) : tables.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: T3 }}>
            <p style={{ fontSize: "18px", color: T2, marginBottom: "8px" }}>No tables yet</p>
            <p style={{ fontSize: "14px" }}>Add your first table above</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {tables.map(t => (
              <div
                key={t._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: BG1,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: isMobile ? "14px 16px" : "16px 22px",
                  transition: "border-color 0.2s",
                  gap: "12px",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = BORDER_MD}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                  <div style={{
                    width: "36px", height: "36px", minWidth: "36px",
                    background: BG3, border: `1px solid ${BORDER_MD}`,
                    borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: "600", color: GOLD,
                  }}>
                    {t.name?.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: "15px", fontWeight: "500", color: T1,
                      marginBottom: "2px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {t.name}
                    </p>
                    <p style={{ fontSize: "12px", color: T3 }}>
                      {t.seats} seat{t.seats !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: "12px", fontWeight: "500",
                  padding: "4px 12px", borderRadius: "20px",
                  flexShrink: 0,
                  background: (!t.status || t.status === "Available") ? "rgba(90,158,122,0.1)" : "rgba(196,154,80,0.1)",
                  color: (!t.status || t.status === "Available") ? "#5a9e7a" : "#c49a50",
                  border: `1px solid ${(!t.status || t.status === "Available") ? "rgba(90,158,122,0.2)" : "rgba(196,154,80,0.2)"}`,
                }}>
                  {t.status || "Available"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}