interface QrPlaceholderProps {
  /** Token used as a deterministic seed for the placeholder pattern. */
  seed: string;
  size?: number;
}

// 21×21 module placeholder with three locator squares — visually a QR, never
// scannable. Real QR will come from the backend (`offer.qr_code` data URL).
export function QrPlaceholder({ seed, size = 248 }: QrPlaceholderProps) {
  const grid = 21;
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const inLocator = (x: number, y: number) =>
    (x < 7 && y < 7) || (x > grid - 8 && y < 7) || (x < 7 && y > grid - 8);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (inLocator(x, y)) continue;
      if (next() > 0.5) cells.push({ x, y });
    }
  }
  const locator = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#0A0A0A" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#FFFFFF" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0A0A0A" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${grid} ${grid}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR-Code"
    >
      <rect width={grid} height={grid} fill="#FFFFFF" />
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={1} height={1} fill="#0A0A0A" />
      ))}
      {locator(0, 0)}
      {locator(grid - 7, 0)}
      {locator(0, grid - 7)}
    </svg>
  );
}
