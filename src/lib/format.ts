/** 26_200_000 -> "26.2M", 950_000 -> "950K", 1_100_000 -> "1.1M". Client-safe. */
export function compactViews(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}
