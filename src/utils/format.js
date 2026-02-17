export const formatARS = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
};

export const formatNumber = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
};