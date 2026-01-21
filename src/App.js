import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import MonitoringPDIL from "./pages/MonitoringPDIL";
import LaporanPDIL from "./pages/LaporanPDIL";

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div
      style={{
        backgroundImage: isHome
          ? "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/background.jpg')"
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        minHeight: "100vh",
        width: "100%",
        color: isHome ? "#fff" : "#000",
        display: "flex",
        flexDirection: "column",
        paddingTop: "64px",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          padding: "16px",
          backgroundColor: "rgba(0,0,0,0.6)",
          fontWeight: "bold",
          fontSize: "18px",
          zIndex: 10,
        }}
      >
        <Link to="/monitoring" style={{ color: "#fff", textDecoration: "none" }}>
          Monitoring
        </Link>
        <Link to="/laporan" style={{ color: "#fff", textDecoration: "none" }}>
          Laporan
        </Link>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <div style={{ textAlign: "center", padding: "40px" }}>
                <h2>Selamat datang di Dashboard PDIL 53-BGR</h2>
                <p>Pilih menu <strong>Monitoring</strong> atau <strong>Laporan</strong> di atas.</p>
              </div>
            }
          />
          <Route path="/monitoring" element={<MonitoringPDIL />} />
          <Route path="/laporan" element={<LaporanPDIL />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
