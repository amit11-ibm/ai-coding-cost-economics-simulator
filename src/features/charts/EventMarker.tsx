// EventMarker is rendered via Recharts ReferenceLine label
// This component provides the label content for event marker lines.

interface EventMarkerProps {
  month: number
  labels: string[]
}

export function EventMarkerLabel({ month, labels }: EventMarkerProps) {
  return (
    <g>
      <text
        x={0}
        y={-4}
        textAnchor="middle"
        fontSize={9}
        fill="#f59e0b"
        fontWeight="600"
      >
        ⚡
      </text>
    </g>
  )
}
