import { useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import logo from "../assets/Logo Acrecentar con fondo.png";

import { buildPlanRows } from "../utils/finance";
import { formatARS } from "../utils/format";

export default function Simulador({
  modo, // "moto" | "prendario"
  precioTotal,
  setPrecioTotal,
  entrega,
  setEntrega,
  tasaMensualPct,
  setTasaMensualPct,
  maxCuotas,
}) {
  const exportRef = useRef(null);

  const [precioText, setPrecioText] = useState(String(precioTotal ?? ""));
  const [entregaText, setEntregaText] = useState(String(entrega ?? ""));
  const [isExportLight, setIsExportLight] = useState(false);

  // Snapshot para export (evita que los valores “desaparezcan” en la captura)
  const [exportSnap, setExportSnap] = useState(null);

  const toNumberAR = (raw) => {
    if (raw === null || raw === undefined) return 0;
    let s = String(raw).trim().replace(/\s/g, "");
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/\./g, "");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const moneyInputBlur = (raw) => {
    const n = toNumberAR(raw);
    if (n <= 0) return "";
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatCurrencyARS = (value) => {
    const n = Number(value);
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  };

  const precioNum = toNumberAR(precioText);
  const entregaNum = toNumberAR(entregaText);

  const { financiado, rows } = useMemo(() => {
    return buildPlanRows({
      precioTotal: precioNum,
      entrega: entregaNum,
      tasaMensualPct,
      maxCuotas,
    });
  }, [precioNum, entregaNum, tasaMensualPct, maxCuotas]);

  const error =
    precioNum <= 0
      ? "Ingresá un precio total mayor a 0."
      : entregaNum < 0
      ? "La entrega no puede ser negativa."
      : entregaNum > precioNum
      ? "La entrega no puede ser mayor al precio total."
      : null;

  const subtitle =
    (modo === "moto" ? "Financiación de motos" : "Crédito prendario") +
    ` · Cuotas 1 a ${maxCuotas}`;

  // Espera doble frame (evita capturar un DOM “a medio pintar”)
  const waitPaint = async () => {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
  };

  // Ajuste seguro para evitar canvas muy alto (seams)
  const getSafeScale = (el, desired = 2) => {
    const rect = el.getBoundingClientRect();
    const MAX_CANVAS_PX = 14000;
    const maxByHeight = MAX_CANVAS_PX / Math.max(1, rect.height);
    return Math.max(1, Math.min(desired, maxByHeight));
  };

  const withSolidExportBackground = async (fn, bg = "#ffffff") => {
    const el = exportRef.current;
    if (!el) return;

    const prevBgImage = el.style.backgroundImage;
    const prevBg = el.style.background;
    const prevBgColor = el.style.backgroundColor;

    el.style.backgroundImage = "none";
    el.style.background = bg;
    el.style.backgroundColor = bg;

    await waitPaint();

    try {
      return await fn(el);
    } finally {
      el.style.backgroundImage = prevBgImage;
      el.style.background = prevBg;
      el.style.backgroundColor = prevBgColor;
    }
  };

  const buildSnapshot = () => ({
    title: modo === "moto" ? "Financiación de Motos" : "Crédito Prendario",
    precio: precioNum,
    entrega: entregaNum,
    financiado,
    tasa: Number(tasaMensualPct) || 0,
    cuotasMax: maxCuotas,
  });

  const handleExportImage = async () => {
    const el = exportRef.current;
    if (!el || error) return;

    setExportSnap(buildSnapshot());
    setIsExportLight(true);
    await waitPaint();

    const pixelRatio = getSafeScale(el, 2);

    const dataUrl = await withSolidExportBackground(
      async (node) =>
        htmlToImage.toPng(node, {
          pixelRatio,
          backgroundColor: "#ffffff",
        }),
      "#ffffff"
    );

    setIsExportLight(false);
    setExportSnap(null);

    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `${modo}-simulacion.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleExportPDF = async () => {
    const el = exportRef.current;
    if (!el || error) return;

    setExportSnap(buildSnapshot());
    setIsExportLight(true);
    await waitPaint();

    const scale = getSafeScale(el, 2);

    const canvas = await withSolidExportBackground(
      async (node) =>
        html2canvas(node, {
          scale,
          backgroundColor: "#ffffff",
        }),
      "#ffffff"
    );

    setIsExportLight(false);
    setExportSnap(null);

    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 10;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    const x = 5;
    const y = 10;
    const fitHeight = pageHeight - 20;

    if (imgHeight <= fitHeight) {
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    } else {
      const scaledWidth = (imgWidth * fitHeight) / imgHeight;
      const centerX = (pageWidth - scaledWidth) / 2;
      pdf.addImage(imgData, "PNG", centerX, y, scaledWidth, fitHeight);
    }

    pdf.save(`${modo}-simulacion.pdf`);
  };

  // Datos a mostrar en export (snapshot si existe)
  const meta = exportSnap ?? {
    title: modo === "moto" ? "Financiación de Motos" : "Crédito Prendario",
    precio: precioNum,
    entrega: entregaNum,
    financiado,
    tasa: Number(tasaMensualPct) || 0,
    cuotasMax: maxCuotas,
  };

  const mid = Math.ceil(rows.length / 2);
  const rowsLeft = rows.slice(0, mid);
  const rowsRight = rows.slice(mid);

  return (
    <main style={{ display: "grid", gap: 16 }}>
      {/* CARD IZQUIERDA */}
      <section className="card" aria-labelledby="form-title">
        <h2 id="form-title">Datos del crédito</h2>

        <div className="formGrid">
          <div className="field">
            <label htmlFor="precioTotal">Precio total del vehículo</label>
            <div className="moneyInput">
              <span className="moneyPrefix">$</span>
              <input
                id="precioTotal"
                inputMode="decimal"
                type="text"
                value={precioText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setPrecioText(raw);
                  setPrecioTotal(toNumberAR(raw));
                }}
                onBlur={() => setPrecioText(moneyInputBlur(precioText))}
                placeholder="Ej: 7.500.000,00"
                className="moneyField"
              />
            </div>
            <small style={{ opacity: 0.6, fontSize: 13, lineHeight: 1.2 }}>
              Ingresá el precio en pesos.
            </small>
          </div>

          <div className="field">
            <label htmlFor="entrega">Entrega (anticipo)</label>
            <div className="moneyInput">
              <span className="moneyPrefix">$</span>
              <input
                id="entrega"
                inputMode="decimal"
                type="text"
                value={entregaText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setEntregaText(raw);
                  setEntrega(toNumberAR(raw));
                }}
                onBlur={() => setEntregaText(moneyInputBlur(entregaText))}
                placeholder="Ej: 200.000,00"
                className="moneyField"
              />
            </div>
            <small style={{ opacity: 0.6, fontSize: 13, lineHeight: 1.2 }}>
              Podés dejarlo en 0 si no hay entrega.
            </small>
          </div>

          <div className="field">
            <label htmlFor="tasa">Tasa mensual (%)</label>
            <input
              id="tasa"
              inputMode="decimal"
              type="text"
              value={String(tasaMensualPct)}
              onChange={(e) => setTasaMensualPct(e.target.value)}
              placeholder={modo === "moto" ? "Ej: 8" : "Ej: 5"}
            />
            <small style={{ opacity: 0.6, fontSize: 13, lineHeight: 1.2 }}>
              Por defecto: {modo === "moto" ? "8" : "5"}%.
            </small>
          </div>

          <div className="field">
            <label>Capital financiado</label>
            <div className="valueBox">{formatARS(financiado)}</div>
            <small style={{ opacity: 0.6, fontSize: 13, lineHeight: 1.2 }}>
              Financiado = Precio − Entrega.
            </small>
          </div>
        </div>

        {error && (
          <div className="alert" role="alert" style={{ marginTop: 10 }}>
            {error}
          </div>
        )}
      </section>

      {/* CARD DERECHA */}
      <section className="card" aria-labelledby="tabla-title" style={{ width: "100%" }}>
        <div className="tableHeader">
          <div>
            <h2 id="tabla-title" style={{ marginBottom: 6 }}>
              Tabla de cuotas
            </h2>
            <p className="subtitle" style={{ margin: 0 }}>
              {subtitle}
            </p>
          </div>

          <div className="tableActions">
            <button
              type="button"
              className="btn"
              onClick={handleExportImage}
              disabled={!!error}
            >
              Guardar imagen
            </button>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={handleExportPDF}
              disabled={!!error}
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {/* BLOQUE EXPORTABLE */}
        <div
          ref={exportRef}
          className={`exportBlock ${isExportLight ? "isExportLight" : ""}`}
        >
                    <div
            className="exportHead"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28,
              alignItems: "center", 
              justifyItems: "center",
              marginBottom: 18,
            }}
          >
            <div
              className="exportBrand"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {isExportLight && (
                <img
                  src={logo}
                  alt="Acrecentar"
                  className="exportLogo"
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: "contain",
                    display: "block",
                    marginBottom: 8,
                  }}
                />
              )}
              <div className="exportTitle">{meta.title}</div>
            </div>

            {/* Derecha: montos */}
            <div
              className="exportMetaTable"
              style={{
                justifySelf: "center",
                width: "auto",
                textAlign: "center",
              }}
            >
              <div
                className="exportMetaRow"
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content max-content",
                  columnGap: 10,
                  alignItems: "baseline",
                  justifyContent: "center",
                }}
              >
                <div className="exportMetaLabel" style={{ textAlign: "right" }}>Precio</div>
                <div className="exportMetaValue">{formatCurrencyARS(meta.precio)}</div>
              </div>
              <div
                className="exportMetaRow"
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content max-content",
                  columnGap: 10,
                  alignItems: "baseline",
                  justifyContent: "center",
                }}
              >
                <div className="exportMetaLabel" style={{ textAlign: "right" }}>Entrega</div>
                <div className="exportMetaValue">{formatCurrencyARS(meta.entrega)}</div>
              </div>
              <div
                className="exportMetaRow"
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content max-content",
                  columnGap: 10,
                  alignItems: "baseline",
                  justifyContent: "center",
                }}
              >
                <div className="exportMetaLabel" style={{ textAlign: "right" }}>Financiado</div>
                <div className="exportMetaValue">{formatCurrencyARS(meta.financiado)}</div>
              </div>
              {!isExportLight && (
                <div
                  className="exportMetaRow"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "max-content max-content",
                    columnGap: 10,
                    alignItems: "baseline",
                    justifyContent: "center",
                  }}
                >
                  <div className="exportMetaLabel" style={{ textAlign: "right" }}>Tasa</div>
                  <div className="exportMetaValue">{meta.tasa}% mensual</div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Cant. cuotas</th>
                    <th style={{ textAlign: "center" }}>
                      <span>Monto</span>
                      <span style={{ marginLeft: 6 }}>cuota</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsLeft.map((r, idx) => (
                    <tr
                      key={r.n}
                      style={{
                        background:
                          idx % 2 === 0
                            ? "transparent"
                            : isExportLight
                            ? "rgba(17, 24, 39, 0.04)"
                            : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <td style={{ textAlign: "center" }}>{r.n}</td>
                      <td style={{ textAlign: "center" }}>
                        {formatCurrencyARS(r.cuota)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Cant. cuotas</th>
                    <th style={{ textAlign: "center" }}>
                      <span>Monto</span>
                      <span style={{ marginLeft: 6 }}>cuota</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsRight.map((r, idx) => (
                    <tr
                      key={r.n}
                      style={{
                        background:
                          idx % 2 === 0
                            ? "transparent"
                            : isExportLight
                            ? "rgba(17, 24, 39, 0.04)"
                            : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <td style={{ textAlign: "center" }}>{r.n}</td>
                      <td style={{ textAlign: "center" }}>
                        {formatCurrencyARS(r.cuota)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}