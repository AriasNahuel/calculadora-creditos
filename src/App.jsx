import { useEffect, useState } from "react";
import Simulador from "./components/Simulador";

// Ajustá esta ruta al archivo real del logo:
import logo from "./assets/Logo Acrecentar con fondo.png";

export default function App() {
  const [modo, setModo] = useState("moto"); // "moto" | "prendario"

  const [precioTotal, setPrecioTotal] = useState("");
  const [entrega, setEntrega] = useState("");
  const [tasaMensualPct, setTasaMensualPct] = useState(8);

  const maxCuotas = modo === "moto" ? 20 : 36;

  useEffect(() => {
    setTasaMensualPct(modo === "moto" ? 8 : 5);
  }, [modo]);

  return (
    <div className="page">
      {/* Logo (sin títulos) */}
      <header className="header headerTextOnly" style={{ paddingBottom: 10 }}>
  <div
    className="headerInner"
    style={{
      justifyContent: "flex-start",
      alignItems: "center",
    }}
  >
    <img src={logo} alt="Acrecentar" className="brandLogo" />

    <div style={{ display: "flex", alignItems: "center" }}>
      <h1 style={{ margin: 0, fontSize: "1.35rem", lineHeight: 1.2 }}>
        Simulador de Financiación Acrecentar
      </h1>
    </div>
  </div>
</header>

      {/* Tabs centradas, más grandes y con separación */}
      <div className="card tabsCard">
        <div className="tabsRow">
          <button
            type="button"
            onClick={() => setModo("moto")}
            className={`tabBtn ${modo === "moto" ? "tabBtnActive" : ""}`}
          >
            Motos (8%)
          </button>

          <button
            type="button"
            onClick={() => setModo("prendario")}
            className={`tabBtn ${modo === "prendario" ? "tabBtnActive" : ""}`}
          >
            Prendario (5%)
          </button>
        </div>
      </div>

      <Simulador
        modo={modo}
        precioTotal={precioTotal}
        setPrecioTotal={setPrecioTotal}
        entrega={entrega}
        setEntrega={setEntrega}
        tasaMensualPct={tasaMensualPct}
        setTasaMensualPct={setTasaMensualPct}
        maxCuotas={maxCuotas}
      />
    </div>
  );
}