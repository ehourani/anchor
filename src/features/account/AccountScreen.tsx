import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, KeyRound, Loader2, Trash2 } from 'lucide-react'

import { useAuth } from '@/features/auth/AuthProvider'
import {
  deleteAccount,
  hasPasswordLogin,
  updatePassword,
} from '@/features/auth/auth'
import {
  exportJson,
  exportReflectionsCsv,
  exportSkillsCsv,
} from './exportData'

const cardClass =
  'rounded-2xl border border-white/60 bg-white/55 p-5 backdrop-blur-md'
const labelClass =
  'text-xs font-medium uppercase tracking-wide text-foreground/40'

// The account & data screen: who you're signed in as, change your password,
// export everything you've recorded, and (carefully) delete your account.
export function AccountScreen() {
  const { user } = useAuth()
  const canChangePassword = hasPasswordLogin(user)

  return (
    <>
      <div className="mt-5">
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-foreground">
          Account & data
        </h1>
        <p className="mt-1 text-sm text-foreground/50">
          Manage your account and your information — it's all yours.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className={cardClass}>
          <p className={labelClass}>Signed in as</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {user?.email ?? 'your account'}
          </p>
        </div>

        {canChangePassword && <ChangePassword />}
        <ExportData />
        <DangerZone />
      </div>
    </>
  )
}

function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  const inputClass =
    'w-full rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  const save = async () => {
    setMessage(null)
    if (password.length < 6) {
      setMessage({ ok: false, text: 'Please choose at least 6 characters.' })
      return
    }
    if (password !== confirm) {
      setMessage({ ok: false, text: "Those passwords don't match." })
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirm('')
      setMessage({ ok: true, text: 'Your password has been updated.' })
    } catch {
      setMessage({
        ok: false,
        text: "We couldn't update your password just now. Try again in a moment.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cardClass}>
      <p className={labelClass}>Change password</p>
      <div className="mt-3 space-y-2.5">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className={inputClass}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={inputClass}
        />
        {message && (
          <p
            className={`text-sm ${
              message.ok ? 'text-primary' : 'text-destructive'
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          onClick={save}
          disabled={saving || !password || !confirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Update password
        </button>
      </div>
    </div>
  )
}

function ExportData() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setError(false)
    setBusy(key)
    try {
      await fn()
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  const options: { key: string; label: string; fn: () => Promise<void> }[] = [
    { key: 'json', label: 'Everything (JSON)', fn: exportJson },
    { key: 'skills', label: 'Skills (CSV)', fn: exportSkillsCsv },
    { key: 'reflections', label: 'Reflections (CSV)', fn: exportReflectionsCsv },
  ]

  return (
    <div className={cardClass}>
      <p className={labelClass}>Export your data</p>
      <p className="mt-1.5 text-sm text-foreground/60">
        Download a copy of your toolkit and reflections, anytime.
      </p>
      <div className="mt-3 space-y-2.5">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={run(o.key, o.fn)}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/70 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-white hover:text-foreground disabled:opacity-50"
          >
            {busy === o.key ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {o.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2.5 text-sm text-destructive">
          We couldn't prepare your export just now. Try again in a moment.
        </p>
      )}
    </div>
  )
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(false)

  const close = () => {
    setConfirming(false)
    setTyped('')
    setError(false)
  }

  const confirmDelete = async () => {
    setError(false)
    setDeleting(true)
    try {
      await deleteAccount()
      // The auth listener clears the session, returning the app to sign-in.
    } catch {
      setError(true)
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-destructive/70">
        Delete account
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
        Permanently delete your account and everything in it — your skills and
        all your reflections. This can't be undone.
      </p>
      <button
        onClick={() => setConfirming(true)}
        className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
        Delete my account
      </button>

      {confirming &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm"
              onClick={deleting ? undefined : close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Delete your account"
              className="animate-fade-rise fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)]"
            >
              <h2 className="font-display text-lg font-semibold text-foreground">
                Delete your account?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                This removes your account and all of your data for good. If you'd
                like a copy first, you can close this and export your data. To
                confirm, type <span className="font-semibold">delete</span> below.
              </p>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="delete"
                autoFocus
                className="mt-4 w-full rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
              />
              {error && (
                <p className="mt-2.5 text-sm text-destructive">
                  We couldn't delete your account just now. Try again in a moment.
                </p>
              )}
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={confirmDelete}
                  disabled={typed.trim().toLowerCase() !== 'delete' || deleting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive py-3.5 font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Permanently delete
                </button>
                <button
                  onClick={close}
                  disabled={deleting}
                  className="w-full rounded-2xl border border-white/70 bg-white/70 py-3 font-semibold text-foreground/75 transition-colors hover:bg-white hover:text-foreground disabled:opacity-50"
                >
                  Keep my account
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
