import { helpOptions, type Helpfulness } from './logging'

// The optional, skippable reflection — shared by the skill-detail log and the
// quick "log a skill" sheet. Never required, never framed as a score.
export function LogReflection({
  helpfulness,
  note,
  onChange,
}: {
  helpfulness: Helpfulness | null
  note: string
  onChange: (helpfulness: Helpfulness | null, note: string) => void
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 p-5 backdrop-blur-md">
      <p className="text-sm text-foreground/60">
        Want to add a reflection? No pressure — this is just for you.
      </p>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-foreground/40">
        Did it help?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {helpOptions.map((opt) => {
          const selected = helpfulness === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(selected ? null : opt.value, note)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white/70 text-foreground/70 hover:bg-white'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <textarea
        value={note}
        onChange={(e) => onChange(helpfulness, e.target.value)}
        placeholder="Anything you'd like to remember? (optional)"
        rows={2}
        className="mt-4 w-full resize-none rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}
