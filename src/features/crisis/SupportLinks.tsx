// Crisis-support contacts: ED-specific (Alliance for Eating Disorders) and
// general (988). Surfaced at the bottom of crisis mode so support is always
// reachable in the moment. Kept current per CLAUDE.md — never the NEDA line.
export function SupportLinks() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70">
      <a
        href="https://www.allianceforeatingdisorders.com/find-help/"
        target="_blank"
        rel="noreferrer"
        className="block p-4 transition-colors hover:bg-white"
      >
        <p className="font-semibold text-foreground">
          National Alliance for Eating Disorders
        </p>
        <p className="mt-0.5 text-sm text-foreground/60">
          Eating-disorder helpline · 1-866-662-1235
        </p>
      </a>
      <div className="mx-4 h-px bg-foreground/10" />
      <a
        href="tel:988"
        className="block p-4 transition-colors hover:bg-white"
      >
        <p className="font-semibold text-foreground">
          988 Suicide &amp; Crisis Lifeline
        </p>
        <p className="mt-0.5 text-sm text-foreground/60">
          Call or text 988 · 24/7, US
        </p>
      </a>
    </div>
  )
}
