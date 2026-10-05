// The shared atmosphere behind every screen — pale sky fading into deeper
// water, slow drifting light, rising bubbles, and a soft sandy seabed. Fixed
// and behind everything (-z-10), pointer-events off so it never intercepts taps.

// Rising bubbles, hand-placed so the motion feels composed rather than random.
const bubbles = [
  { left: '8%', size: 21, delay: '0s', duration: '13s' },
  { left: '22%', size: 14, delay: '2.5s', duration: '15s' },
  { left: '47%', size: 28, delay: '1s', duration: '14s' },
  { left: '68%', size: 18, delay: '3.5s', duration: '16s' },
  { left: '85%', size: 23, delay: '0.8s', duration: '13.5s' },
  { left: '92%', size: 12, delay: '4s', duration: '17s' },
]

// Specks in the sand: a fixed scatter (seeded, so it never shifts between
// renders) of small, soft dots. x is a % of the width; y is px from the top of
// a 56px band at the very bottom, which always sits inside the seabed mound.
const specks = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: 34 }, () => ({
    x: `${(rand() * 100).toFixed(1)}%`,
    y: 6 + rand() * 46,
    r: 0.8 + rand() * 1.2,
    dark: rand() > 0.35,
  }))
})()

export function OceanBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Depth gradient — pale sky surface fading into deeper water */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(198,72%,97%)] via-[hsl(193,58%,90%)] to-[hsl(189,48%,82%)]" />
      {/* Soft caustics / sunlight, slowly drifting */}
      <div className="animate-drift absolute -left-16 -top-10 size-72 rounded-full bg-white/50 blur-3xl" />
      <div
        className="animate-drift absolute -right-10 top-40 size-80 rounded-full bg-[hsl(186,70%,80%)]/40 blur-3xl"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="animate-drift absolute bottom-10 left-1/4 size-72 rounded-full bg-[hsl(200,80%,88%)]/45 blur-3xl"
        style={{ animationDelay: '6s' }}
      />
      {/* Rising bubbles */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-0 rounded-full border border-white/60 bg-white/40"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
      {/* Sandy seabed — a soft mound settling the scene at the very bottom */}
      <svg
        className="absolute inset-x-0 bottom-0 h-56 w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 104 C 480 72, 960 72, 1440 96 L 1440 160 L 0 160 Z"
          fill="hsl(40 56% 86%)"
        />
      </svg>
      {/* Specks — unscaled pixels, so dots stay round at any width */}
      <svg className="absolute inset-x-0 bottom-0 h-14 w-full" aria-hidden="true">
        {specks.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.dark ? 'hsl(34 34% 64%)' : 'hsl(42 70% 96%)'}
            opacity={p.dark ? 0.55 : 0.8}
          />
        ))}
      </svg>
    </div>
  )
}
