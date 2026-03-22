import { Link, useLocation, useNavigate } from "react-router-dom";

const S = {
  nav: {
    position: "sticky", top: 0, zIndex: 200,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 44px", height: "62px",
    background: "rgba(12,13,15,0.88)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  brand: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "22px", fontWeight: "400", color: "#b89a6a",
    letterSpacing: "0.06em", textDecoration: "none",
  },
  links: { display: "flex", alignItems: "center", gap: "32px" },
};

function NavLink({ to, children }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} style={{
      fontFamily: "'Jost', sans-serif",
      fontSize: "13px", fontWeight: "400",
      color: active ? "#b89a6a" : "#8f8b84",
      letterSpacing: "0.06em", textTransform: "uppercase",
      textDecoration: "none",
      transition: "color 0.2s",
      borderBottom: active ? "1px solid #b89a6a" : "1px solid transparent",
      paddingBottom: "2px",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#e8e4de"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8f8b84"; }}
    >
      {children}
    </Link>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();

  const hideOn = ["/", "/login", "/register", "/admin-login", "/admin-register"];
  if (hideOn.includes(location.pathname)) return null;

  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.includes("manage-tables") ||
    location.pathname.includes("reports");

  const logout = () => {
    localStorage.removeItem("token");
    navigate(isAdmin ? "/admin-login" : "/login");
  };

  return (
    <nav style={S.nav}>
      <span style={S.brand}>DineReserve</span>
      <div style={S.links}>
        {isAdmin ? (
          <>
            <NavLink to="/admin-dashboard">Dashboard</NavLink>
            <NavLink to="/manage-tables">Tables</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/home">Restaurants</NavLink>
            <NavLink to="/bookings">My Bookings</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </>
        )}
        <button
          onClick={logout}
          style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px", color: "#8f8b84",
            fontFamily: "'Jost', sans-serif", fontSize: "12px",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "7px 18px", cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#c46060";
            e.currentTarget.style.color = "#c46060";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "#8f8b84";
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
