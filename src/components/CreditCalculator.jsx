import { useMemo, useState } from "react";

function parseNumberAR(raw) {
  if (raw === null || raw === undefined) return 0;

  let s = String(raw).trim();
  s = s.replace(/\s/g, "");

  if (s.includes(",")) {
    s = s.replace(/\./g, "");
    s = s.replace(",", ".");
  } else {
    s = s.replace(/\./g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function clampNumber(value) {
  return parseNumberAR(value);
}

function formatMoneyARS(value) {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function CreditCalculator({ defaultTasaPct = 5 }) {
  const [montoValue, setMontoValue] = useState(0);
  const [montoText, setMontoText] = useState("");       // vacío visual
  const [tasa, setTasa] = useState(String(defaultTasaPct)); // "8" o "5"
  const [cuotas, setCuotas] = useState(12);
  const [periodo, setPeriodo] = useState("mensual");

  const results = useMemo(() => {
    const P = Math.max(0, montoValue);
    const n = Math.max(1, Math.floor(clampNumber(cuotas)));
    const tasaPct = Math.max(0, clampNumber(tasa));

    const rMensual = (periodo === "anual" ? tasaPct / 12 : tasaPct) / 100;

    const cuotaSinInteres = P / n;
    const interesPorCuota = P * rMensual; // plano
    const cuotaCompleta = cuotaSinInteres + interesPorCuota;

    const totalPagado = cuotaCompleta * n;
    const totalInteres = interesPorCuota * n;

    return { P, n, tasaPct, rMensual, cuotaSinInteres, interesPorCuota, cuotaCompleta, totalPagado, totalInteres };
  }, [montoValue, cuotas, tasa, periodo]);

  const hasInvalid = results.P <= 0 || results.n <= 0;

  return (
    <main className="grid">
      <section className="card" aria-labelledby="form-title">
        <h2 id="form-title">Datos del crédito</h2>

        <div className="formGrid">
          <div className="field">
            <label htmlFor="monto">Monto del crédito</label>
            <input
              id="monto"
              inputMode="decimal"
              type="text"
              value={montoText}
              onChange={(e) => {
                const raw = e.target.value;
                setMontoText(raw);
                setMontoValue(parseNumberAR(raw));
              }}
              onBlur={() => {
  if (montoValue > 0) setMontoText(formatMoneyARS(montoValue));
  else setMontoText("");
}}
              placeholder="Ej: 10.000.000,00"
              aria-describedby="montoHelp"
            />
            <small id="montoHelp">Ingresá el capital (en pesos).</small>
          </div>

          <div className="field">
            <label htmlFor="cuotas">Cantidad de cuotas</label>
            <input
              id="cuotas"
              inputMode="numeric"
              type="number"
              min="1"
              step="1"
              value={cuotas}
              onChange={(e) => setCuotas(e.target.value)}
            />
            <small>Ej: 12, 18, 24…</small>
          </div>

          <div className="field">
            <label htmlFor="tasa">Tasa de interés (%)</label>
            <input
              id="tasa"
              inputMode="decimal"
              type="text"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              placeholder="Ej: 5"
              aria-describedby="tasaHelp"
            />
          </div>

          <div className="field">
            <label htmlFor="periodo">Periodo de la tasa</label>
            <select id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
            <small>Por defecto: mensual.</small>
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="res-title">
        <h2 id="res-title">Resultados</h2>

        {hasInvalid ? (
          <div className="alert" role="alert">
            Ingresá un monto mayor a 0 y al menos 1 cuota.
          </div>
        ) : (
          <div className="kpis" role="list">
            <div className="kpi" role="listitem">
              <div className="kpiLabel">Cuota sin interés</div>
              <div className="kpiValue">{formatMoneyARS(results.cuotaSinInteres)}</div>
            </div>

            <div className="kpi" role="listitem">
              <div className="kpiLabel">Interés por cuota</div>
              <div className="kpiValue">{formatMoneyARS(results.interesPorCuota)}</div>
            </div>

            <div className="kpi kpi--primary" role="listitem">
              <div className="kpiLabel">Cuota completa</div>
              <div className="kpiValue">{formatMoneyARS(results.cuotaCompleta)}</div>
            </div>

            <div className="kpi" role="listitem">
              <div className="kpiLabel">Total pagado</div>
              <div className="kpiValue">{formatMoneyARS(results.totalPagado)}</div>
            </div>

            <div className="kpi" role="listitem">
              <div className="kpiLabel">Total interés pagado</div>
              <div className="kpiValue">{formatMoneyARS(results.totalInteres)}</div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}