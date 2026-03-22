import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/axios";

const ALLOWED_ROUTES = ["/home"];

export default function Chatbot() {
  const location  = useLocation();
  const isAllowed = ALLOWED_ROUTES.includes(location.pathname);

  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    "assistant",
      content: "👋 Hi! I'm DineBot, your personal dining assistant. Ask me anything — restaurant recommendations, booking help, menu suggestions and more!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isAllowed) setIsOpen(false);
  }, [location.pathname, isAllowed]);

  if (!isAllowed) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg         = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post("/chat/message", {
        messages: updatedMessages,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      let errMsg = "⚠️ Something went wrong. Please try again.";
      if (detail.includes("Ollama is not running")) {
        errMsg = "⚠️ AI model is offline. Please run: ollama serve in your terminal.";
      } else if (detail.includes("too long")) {
        errMsg = "⚠️ Response timed out. Please try a shorter question.";
      }
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role:    "assistant",
      content: "👋 Hi! I'm DineBot, your personal dining assistant. Ask me anything — restaurant recommendations, booking help, menu suggestions and more!",
    }]);
  };

  return (
    <>
      {/* ── Floating Button ───────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Chat with DineBot"
        style={{
          position:       "fixed",
          bottom:         "28px",
          right:          "28px",
          width:          "56px",
          height:         "56px",
          borderRadius:   "50%",
          background:     isOpen
            ? "#e53e3e"
            : "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
          border:         "none",
          cursor:         "pointer",
          boxShadow:      "0 4px 20px rgba(25,118,210,0.45)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          zIndex:         9999,
          transition:     "background 0.2s, transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(25,118,210,0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(25,118,210,0.45)";
        }}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6"  x2="6"  y2="18" />
            <line x1="6"  y1="6"  x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>

      {/* ── Chat Window ───────────────────────────────────── */}
      {isOpen && (
        <div style={{
          position:      "fixed",
          bottom:        "96px",
          right:         "28px",
          width:         "355px",
          maxHeight:     "500px",
          background:    "#ffffff",
          borderRadius:  "18px",
          boxShadow:     "0 8px 40px rgba(0,0,0,0.16)",
          display:       "flex",
          flexDirection: "column",
          zIndex:        9998,
          overflow:      "hidden",
          animation:     "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily:    "'Segoe UI', sans-serif",
        }}>

          {/* ── Header ──────────────────────────────────── */}
          <div style={{
            background:     "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
            padding:        "14px 16px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width:          "38px",
                height:         "38px",
                borderRadius:   "50%",
                background:     "rgba(255,255,255,0.18)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, color: "#fff", fontWeight: "700", fontSize: "0.92rem" }}>
                  DineBot
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.7rem" }}>
                  {loading ? "Thinking..." : "Your dining assistant · Online"}
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                background:   "rgba(255,255,255,0.15)",
                border:       "none",
                color:        "#fff",
                cursor:       "pointer",
                borderRadius: "6px",
                padding:      "4px 10px",
                fontSize:     "0.7rem",
                fontWeight:   "600",
              }}
            >
              Clear
            </button>
          </div>

          {/* ── Messages ────────────────────────────────── */}
          <div style={{
            flex:          1,
            overflowY:     "auto",
            padding:       "14px",
            display:       "flex",
            flexDirection: "column",
            gap:           "10px",
            background:    "#f8fafc",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display:        "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems:     "flex-end",
                gap:            "7px",
              }}>
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div style={{
                    width:          "26px",
                    height:         "26px",
                    borderRadius:   "50%",
                    background:     "linear-gradient(135deg, #1976d2, #0d47a1)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    flexShrink:     0,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                      <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                )}

                {/* Message bubble */}
                <div style={{
                  maxWidth:     "80%",
                  padding:      "9px 13px",
                  borderRadius: msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  background:   msg.role === "user"
                    ? "linear-gradient(135deg, #1976d2, #0d47a1)"
                    : "#ffffff",
                  color:        msg.role === "user" ? "#fff" : "#1a1a2e",
                  fontSize:     "0.84rem",
                  lineHeight:   "1.55",
                  boxShadow:    msg.role === "user"
                    ? "0 2px 8px rgba(25,118,210,0.28)"
                    : "0 1px 4px rgba(0,0,0,0.07)",
                  whiteSpace:   "pre-wrap",
                  wordBreak:    "break-word",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "7px" }}>
                <div style={{
                  width:          "26px",
                  height:         "26px",
                  borderRadius:   "50%",
                  background:     "linear-gradient(135deg, #1976d2, #0d47a1)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <div style={{
                  background:   "#ffffff",
                  borderRadius: "16px 16px 16px 4px",
                  padding:      "10px 14px",
                  boxShadow:    "0 1px 4px rgba(0,0,0,0.07)",
                  display:      "flex",
                  gap:          "4px",
                  alignItems:   "center",
                }}>
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{
                      width:        "6px",
                      height:       "6px",
                      borderRadius: "50%",
                      background:   "#1976d2",
                      animation:    `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick Suggestions ───────────────────────── */}
          <div style={{
            padding:        "8px 10px",
            background:     "#f0f4ff",
            display:        "flex",
            gap:            "6px",
            overflowX:      "auto",
            borderTop:      "1px solid #e5e7eb",
            scrollbarWidth: "none",
          }}>
            {[
              "Best for a date night?",
              "Veg options?",
              "How to book?",
              "Peak hours?",
              "Budget friendly?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                style={{
                  background:   "#fff",
                  border:       "1px solid #c7d7f7",
                  borderRadius: "20px",
                  padding:      "4px 10px",
                  fontSize:     "0.7rem",
                  color:        "#1976d2",
                  cursor:       "pointer",
                  whiteSpace:   "nowrap",
                  fontWeight:   "500",
                  flexShrink:   0,
                  transition:   "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e8f0fe"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                {q}
              </button>
            ))}
          </div>

          {/* ── Input ───────────────────────────────────── */}
          <div style={{
            padding:    "10px",
            background: "#fff",
            borderTop:  "1px solid #e5e7eb",
            display:    "flex",
            gap:        "8px",
            alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about dining..."
              rows={1}
              style={{
                flex:         1,
                border:       "1px solid #d1d5db",
                borderRadius: "10px",
                padding:      "8px 12px",
                fontSize:     "0.84rem",
                resize:       "none",
                outline:      "none",
                fontFamily:   "inherit",
                lineHeight:   "1.4",
                maxHeight:    "80px",
                overflowY:    "auto",
                transition:   "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#1976d2"}
              onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width:          "38px",
                height:         "38px",
                borderRadius:   "10px",
                background:     !input.trim() || loading
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #1976d2, #0d47a1)",
                border:         "none",
                cursor:         !input.trim() || loading ? "not-allowed" : "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                transition:     "background 0.2s",
              }}
            >
              {loading ? (
                // Clock icon while waiting
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#aaa" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ) : (
                // Send icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2"  x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Animations ────────────────────────────────────── */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0);   }
          30%           { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}