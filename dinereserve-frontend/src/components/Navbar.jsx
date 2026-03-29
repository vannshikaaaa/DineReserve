import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavLink({ to, children, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: "12px", fontWeight: "400",
        color: active ? "#b89a6a" : "#8f8b84",
        letterSpacing: "0.05em", textTransform: "uppercase",
        textDecoration: "none",
        transition: "color 0.2s",
        borderBottom: active ? "1px solid #b89a6a" : "1px solid transparent",
        paddingBottom: "2px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const hideOn = ["/", "/login", "/register", "/admin-login", "/admin-register"];
  if (hideOn.includes(location.pathname)) return null;

  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.includes("manage-tables") ||
    location.pathname.includes("reports");

  const logout = () => {
    localStorage.removeItem("token");
    navigate(isAdmin ? "/admin-login" : "/login");
    setMenuOpen(false);
  };

  const adminLinks = [
    { to: "/admin-dashboard", label: "Dashboard" },
    { to: "/manage-tables",   label: "Tables" },
    { to: "/reports",         label: "Reports" },
  ];

  const guestLinks = [
    { to: "/home",     label: "Restaurants" },
    { to: "/bookings", label: "My Bookings" },
    { to: "/profile",  label: "Profile" },
  ];

  const links = isAdmin ? adminLinks : guestLinks;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 20px",
        height: "58px",
        background: "rgba(12,13,15,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Brand */}
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "20px", fontWeight: "400", color: "#b89a6a",
          letterSpacing: "0.06em", flexShrink: 0,
        }}>
          DineReserve
        </span>

        {/* Desktop links — hidden on mobile */}
        <div style={{
          display: "flex", alignItems: "center", gap: "24px",
          // Hide on mobile using inline media — handled by hamburger below
        }}
          className="navbar-desktop-links"
        >
          {links.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          <button
            onClick={logout}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px", color: "#8f8b84",
              fontFamily: "'Jost', sans-serif", fontSize: "11px",
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 14px", cursor: "pointer", transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#c46060"; e.currentTarget.style.color = "#c46060"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#8f8b84"; }}
          >
            Logout
          </button>
        </div>

        {/* Hamburger — shown on mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="navbar-hamburger"
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px", color: "#8f8b84",
            display: "none", flexDirection: "column", gap: "5px",
          }}
        >
          <span style={{ display: "block", width: "22px", height: "2px", background: menuOpen ? "#b89a6a" : "#8f8b84", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ display: "block", width: "22px", height: "2px", background: menuOpen ? "#b89a6a" : "#8f8b84", transition: "all 0.2s", opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: "block", width: "22px", height: "2px", background: menuOpen ? "#b89a6a" : "#8f8b84", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: "58px", left: 0, right: 0,
          background: "rgba(12,13,15,0.98)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          zIndex: 199,
          padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "0px",
        }}
          className="navbar-mobile-menu"
        >
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "14px", fontWeight: "400",
                color: location.pathname === l.to ? "#b89a6a" : "#8f8b84",
                letterSpacing: "0.05em", textTransform: "uppercase",
                textDecoration: "none",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                transition: "color 0.2s",
              }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            style={{
              marginTop: "12px",
              background: "rgba(196,96,96,0.08)",
              border: "1px solid rgba(196,96,96,0.2)",
              borderRadius: "8px", color: "#c46060",
              fontFamily: "'Jost', sans-serif", fontSize: "13px",
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "12px", cursor: "pointer",
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-desktop-links { display: none !important; }
          .navbar-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .navbar-mobile-menu { display: none !important; }
          .navbar-hamburger { display: none !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;