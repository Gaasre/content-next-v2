interface TrendSparklineProps {
  data: number[];
  color?: string;
}

export function TrendSparkline({
  data,
  color = "currentColor",
}: TrendSparklineProps) {
  // Handle empty data array
  if (!data || data.length === 0) {
    return (
      <svg width={40} height={16} className="opacity-60" viewBox="0 0 40 16">
        <line
          x1="0"
          y1="8"
          x2="40"
          y2="8"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const max = Math.max(...data);
  // Handle case where all values are 0 - show flat line in middle
  const normalized =
    max === 0 ? data.map(() => 0) : data.map((val) => (val / max) * 100);

  const width = 40;
  const height = 16;
  const step = width / (data.length - 1);

  const pathData = normalized
    .map((point, i) => {
      const x = i * step;
      const y = height - (point / 100) * height;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className="opacity-60"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
