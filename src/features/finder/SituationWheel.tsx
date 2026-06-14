import { useState } from 'react'
import { Anchor } from 'lucide-react'

import { situations } from './situations'

// Geometry of the buoy ring. The SVG draws the colored wedges; an HTML overlay
// (pointer-events-none) sits on top for the icons + labels so clicks fall
// through to the wedge beneath. The center is hollow — the water shows through,
// with a white anchor floating in it.
const R = 100 // outer radius
const r = 50 // inner radius (the hollow center)
// Wedges butt together (no background gap); white "lashing" lines are painted
// on top so the ring stays continuous while each quadrant is still outlined.
const GAP = 0
const BANDS = [-45, 45, 135, 225] // boundary angles between the four quadrants
const MID = (R + r) / 2 // radius at which labels sit
const VIEW = 220 // viewBox is -110..110

// At rest the ring reads as a classic life buoy: alternating coral / white
// quadrants. On tap each segment recolors to its situation hue.
const BUOY_FILLS = ['hsl(10, 78%, 66%)', 'hsl(0, 0%, 100%)']

function polar(radius: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [radius * Math.cos(a), radius * Math.sin(a)]
}

function sectorPath(centerDeg: number): string {
  const a0 = centerDeg - 45 + GAP / 2
  const a1 = centerDeg + 45 - GAP / 2
  const [x1, y1] = polar(R, a0)
  const [x2, y2] = polar(R, a1)
  const [x3, y3] = polar(r, a1)
  const [x4, y4] = polar(r, a0)
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 0 0 ${x4} ${y4} Z`
}

function labelPos(centerDeg: number) {
  const [x, y] = polar(MID, centerDeg)
  return {
    left: `${((x + 110) / VIEW) * 100}%`,
    top: `${((y + 110) / VIEW) * 100}%`,
  }
}

export function SituationWheel({
  expanded,
  onToggle,
  onSelect,
}: {
  expanded: boolean
  onToggle: () => void
  onSelect: (key: string) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div
      className={`relative size-full [container-type:inline-size] ${
        expanded ? '' : 'animate-breathe'
      }`}
    >
      <svg
        viewBox="-110 -110 220 220"
        className="size-full overflow-visible drop-shadow-[0_12px_30px_hsl(200_50%_40%_/_0.18)]"
      >
        {situations.map((s, i) => {
          const fill = expanded
            ? hovered === s.key
              ? s.hover
              : s.fill
            : BUOY_FILLS[i % 2]
          return (
            <path
              key={s.key}
              d={sectorPath(s.angle)}
              fill={fill}
              stroke="none"
              className="cursor-pointer transition-[fill] duration-300"
              onMouseEnter={expanded ? () => setHovered(s.key) : undefined}
              onMouseLeave={
                expanded
                  ? () => setHovered((h) => (h === s.key ? null : h))
                  : undefined
              }
              onClick={expanded ? () => onSelect(s.key) : onToggle}
            />
          )
        })}
        {/* White life-buoy frame — outer + inner ring edges and the four
            lashings between quadrants. Decorative, so clicks pass through. */}
        <g
          stroke="white"
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          pointerEvents="none"
        >
          <circle cx={0} cy={0} r={R} />
          <circle cx={0} cy={0} r={r} />
          {BANDS.map((deg) => {
            const [x1, y1] = polar(r, deg)
            const [x2, y2] = polar(R, deg)
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
        </g>

        {/* Hollow center — transparent click target to bloom / un-bloom */}
        <circle
          cx={0}
          cy={0}
          r={r - 2}
          fill="transparent"
          className="cursor-pointer"
          onClick={onToggle}
        />
      </svg>

      {/* Icon + label overlay; clicks pass through to the SVG below */}
      <div className="pointer-events-none absolute inset-0">
        {situations.map((s) => (
          <div
            key={s.key}
            className="absolute flex max-w-[26cqw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[1.4cqw] text-center transition-opacity duration-300"
            style={{ ...labelPos(s.angle), opacity: expanded ? 1 : 0 }}
          >
            <s.Icon className="size-[8cqw]" strokeWidth={1.75} style={{ color: s.ink }} />
            <span
              className="text-[3.9cqw] font-semibold leading-tight"
              style={{ color: s.ink }}
            >
              {s.label}
            </span>
          </div>
        ))}
        <div
          className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-[width,height] duration-[360ms] ${
            expanded ? 'size-[21%]' : 'size-[27%]'
          }`}
        >
          <Anchor className="size-full text-foreground" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}
