import { useEffect } from "react";
import CreditCalculator from "../components/CreditCalculator";

export default function Motos() {
  useEffect(() => {
    document.title = "Acrecentar - Financiación Motos";
  }, []);

  return (
    <>
      <header className="header">
        <div className="headerTextOnly">
          <h1>Financiación Motos</h1>
          <p className="subtitle">Simulación rápida</p>
        </div>
      </header>

      <CreditCalculator defaultTasaPct={8} />
    </>
  );
}