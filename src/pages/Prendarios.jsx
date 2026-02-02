import { useEffect } from "react";
import CreditCalculator from "../components/CreditCalculator";

export default function Prendarios() {
  useEffect(() => {
    document.title = "Acrecentar - Créditos Prendarios";
  }, []);

  return (
    <>
      <header className="header">
        <div className="headerTextOnly">
          <h1>Créditos Prendarios</h1>
          <p className="subtitle">Simulación rápida</p>
        </div>
      </header>

      <CreditCalculator defaultTasaPct={5} />
    </>
  );
}