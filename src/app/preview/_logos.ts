// TEMPORARY. Never committed. Plain text "logos" drawn as SVG, standing in for uploaded ones.
export function sampleLogo(text: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120"><rect width="400" height="120" rx="14" fill="none"/><circle cx="52" cy="60" r="26" fill="${color}"/><text x="94" y="74" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="#f2f2f4">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
