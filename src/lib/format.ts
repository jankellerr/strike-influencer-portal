export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumberBR(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

export function formatPercentBR(value: number, maximumFractionDigits = 1): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits, signDisplay: "exceptZero" })}%`;
}

/** "DD/MM/YYYY" in Brazil's timezone, for table cells (not form inputs -- see formatDateKeyBrazil for those). */
export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
