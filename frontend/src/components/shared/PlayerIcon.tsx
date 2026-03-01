export function PlayerIcon({
  icon,
  color,
  size,
}: {
  icon: string;
  color: string;
  size: number;
}) {
  const half = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {icon === "cube" && (
        <rect
          x="3"
          y="3"
          width={size - 6}
          height={size - 6}
          fill={color}
          stroke={color}
          strokeWidth="1"
          opacity="0.9"
          rx="2"
        />
      )}
      {icon === "diamond" && (
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill={color}
          stroke={color}
          strokeWidth="1"
          opacity="0.9"
        />
      )}
      {icon === "star" && (
        <polygon
          points={starPoints(half, half, half - 1, half * 0.4, 5)}
          fill={color}
          stroke={color}
          strokeWidth="1"
          opacity="0.9"
        />
      )}
      {icon === "triangle" && (
        <polygon
          points={`${half},2 ${size - 2},${size - 2} 2,${size - 2}`}
          fill={color}
          stroke={color}
          strokeWidth="1"
          opacity="0.9"
        />
      )}
    </svg>
  );
}

export function starPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    coords.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
  }
  return coords.join(" ");
}
