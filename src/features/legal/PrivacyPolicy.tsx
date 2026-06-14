// The privacy policy, shown as a screen from the profile menu. This is a
// plain-language starting draft — have it reviewed before relying on it legally,
// and fill in the contact email below.

const EFFECTIVE_DATE = 'June 14, 2026'
const CONTACT_EMAIL = 'eesam1998@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-semibold text-foreground">
        {title}
      </h2>
      <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-foreground/70">
        {children}
      </div>
    </section>
  )
}

export function PrivacyPolicy() {
  return (
    <>
      <div className="mt-5">
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-foreground">
          Privacy policy
        </h1>
        <p className="mt-1 text-sm text-foreground/50">
          Effective {EFFECTIVE_DATE}
        </p>
      </div>

      <div className="mt-5 space-y-6 rounded-2xl border border-white/60 bg-white/55 p-6 backdrop-blur-md">
        <p className="text-sm leading-relaxed text-foreground/70">
          Anchor is a personal tool for finding and tracking healthy coping skills.
          The information you keep here is sensitive, and protecting it is built into
          how the app works. This policy explains what's collected, how it's used,
          and the control you have over it.
        </p>

        <Section title="What we collect">
          <p>
            <span className="font-semibold text-foreground/80">Account details:</span>{' '}
            the email address you sign up with, and a name if you choose to add one.
            If you sign in with Google, we receive your basic Google profile (name
            and email) to create your account — nothing more.
          </p>
          <p>
            <span className="font-semibold text-foreground/80">Your content:</span>{' '}
            the skills you add (titles, descriptions, tags), your crisis set, and the
            reflections you log (when you used a skill, an optional helpfulness rating,
            and any notes).
          </p>
          <p>
            We do not use analytics, advertising, or third-party trackers, and we
            don't collect your location, contacts, or any health metrics beyond what
            you choose to write down.
          </p>
        </Section>

        <Section title="How your information is used">
          <p>
            Your information is used only to provide the app to you — to show your
            toolkit, power crisis mode, and keep your reflections. It is never sold,
            never shared for advertising, and never used to train any models.
          </p>
        </Section>

        <Section title="Where it's stored and who can see it">
          <p>
            Your data lives in a Supabase (PostgreSQL) database and is protected by
            row-level security, so each account can only ever read or write its own
            data. It is encrypted in transit. Only you can see your information — it
            is not visible to other users, and not shared with clinicians or anyone
            else unless you choose to export and share it yourself.
          </p>
        </Section>

        <Section title="Service providers">
          <p>
            We rely on a small number of providers that process data on our behalf:
            Supabase (database and authentication), Vercel (hosting), and Google (only
            if you choose to sign in with Google). They process your data solely to
            run the service.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <p>
            From the Account &amp; data screen you can, at any time: export all of your
            data as JSON or CSV, change your password, and permanently delete your
            account along with all of your skills and reflections. Deletion is
            immediate and cannot be undone.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Your information is kept for as long as your account exists. When you
            delete your account, your data is removed.
          </p>
        </Section>

        <Section title="Safety">
          <p>
            Anchor is a self-help tool, not a medical device or a substitute for
            professional care, and it is not an emergency service. If you are in
            crisis, the app always offers support contacts (the National Alliance for
            Eating Disorders and the 988 Suicide &amp; Crisis Lifeline). If you are in
            immediate danger, call 988 or 911.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Anchor is not intended for children under 13, and we do not knowingly
            collect information from them.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes, the effective date above will be updated. Material
            changes will be communicated within the app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about your privacy? Reach out at{' '}
            <span className="font-medium text-foreground/80">{CONTACT_EMAIL}</span>.
          </p>
        </Section>
      </div>
    </>
  )
}
