import { createLucideIcon } from 'lucide-react'

// Custom icons drawn in lucide's style (24px grid, 2px round strokes), for
// shapes lucide doesn't ship.

// An outward spiral of half-circles. Used for "Slow the spiral". It sits a
// little low on the grid (bottom edge ~2px from the edge, like lucide's
// buoy) because its heaviest loop is on top; centered, it read as floating
// further above its label than the other wheel icons.
export const Spiral = createLucideIcon('Spiral', [
  [
    'path',
    {
      d: 'M10.2 14.4a1.8 1.8 0 0 1 3.6 0a3.6 3.6 0 0 1-7.2 0a5.4 5.4 0 0 1 10.8 0a7.2 7.2 0 0 1-14.4 0a9 9 0 0 1 18 0',
      key: 'spiral',
    },
  ],
])
