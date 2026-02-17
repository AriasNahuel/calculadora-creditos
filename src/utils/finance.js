export function buildPlanRows({ precioTotal, entrega, tasaMensualPct, maxCuotas }) {
  const precio = Number(precioTotal) || 0;
  const anticipo = Number(entrega) || 0;

  const financiado = Math.max(precio - anticipo, 0);
  const tasa = (Number(tasaMensualPct) || 0) / 100; // 8 => 0.08

  const rows = [];
  for (let n = 1; n <= maxCuotas; n++) {
    const total = financiado * (1 + tasa * n);       // interés simple
    const cuota = n > 0 ? total / n : 0;
    const interesTotal = total - financiado;

    rows.push({
      n,
      financiado,
      tasaMensualPct: Number(tasaMensualPct) || 0,
      cuota,
      total,
      interesTotal,
    });
  }

  return { financiado, rows };
}