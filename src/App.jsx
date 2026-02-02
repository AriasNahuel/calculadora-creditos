import { Route, Routes, Link, useLocation } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Motos from "./pages/Motos";
import Prendarios from "./pages/Prendarios";

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const showBack = !isHome;

  return (
    <div className={`page ${isHome ? "page--home" : ""}`}>
      {showBack && (
        <nav className="navSimple">
          <Link className="backLink" to="/">
            ← Volver
          </Link>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/motos" element={<Motos />} />
        <Route path="/prendarios" element={<Prendarios />} />
      </Routes>
    </div>
  );
}