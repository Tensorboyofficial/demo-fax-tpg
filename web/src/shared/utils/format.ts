export function percent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function currency(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
