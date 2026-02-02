import { useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/a.png";

export default function Home() {
  useEffect(() => {
    document.title = "Acrecentar - Servicios Financieros";
  }, []);

  return (
    <div className="homeWrap">
      <div className="homeCard">
        <img src={logo} alt="Acrecentar" className="homeLogo" />
        <h1 className="homeTitle">Acrecentar</h1>
        <p className="homeSubtitle">Servicios Financieros</p>
        <div className="homeActions">
          <Link className="homeBtn primary" to="/motos">
            Financiación Motos
          </Link>
          <Link className="homeBtn" to="/prendarios">
            Créditos Prendarios
          </Link>
        </div>
      </div>
    </div>
  );
}