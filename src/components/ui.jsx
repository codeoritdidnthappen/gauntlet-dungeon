/**
 * Shared creation-screen furniture — semi-transparent panels, small option
 * buttons, and the Back/Proceed actions. Used by Screen 2 and Screen 3 so the
 * two stay visually identical.
 */

export function Panel({ title, children, className = '' }) {
  return (
    <section
      className={[
        'max-h-full overflow-y-auto rounded-sm border border-gold-500/30',
        'bg-soot-950/72 p-4 backdrop-blur-[3px] shadow-[0_0_40px_rgba(0,0,0,0.6)]',
        className,
      ].join(' ')}
    >
      <h2 className="mb-3 border-b border-gold-500/25 pb-2 text-center font-display text-sm font-bold uppercase tracking-[0.22em] text-gold-300">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Field({ label, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-gold-200/45">
        {label}
      </div>
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, maxLength, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gold-500/25 bg-soot-950/70 px-3 py-2 font-body text-sm text-gold-200 placeholder:text-gold-200/25 outline-none focus:border-gold-500/70"
    />
  )
}

export function ButtonRow({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={[
              'cursor-pointer rounded-[2px] border px-2.5 py-1 font-body text-xs',
              'transition-colors duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1 focus-visible:ring-offset-soot-950',
              active
                ? 'border-gold-400/80 bg-gold-500/20 text-gold-200'
                : 'border-gold-500/25 bg-soot-900/50 text-gold-200/55 hover:border-gold-500/55 hover:text-gold-200',
            ].join(' ')}
          >
            {item.name}
          </button>
        )
      })}
    </div>
  )
}

export function ActionButton({ children, onClick, primary = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-sm border px-8 py-2.5 font-display text-sm font-bold uppercase tracking-[0.18em]',
        'backdrop-blur-[3px] transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-soot-950',
        disabled
          ? 'cursor-not-allowed border-gold-500/15 bg-soot-950/60 text-gold-200/25'
          : primary
            ? 'cursor-pointer border-gold-500/70 bg-soot-900/85 text-gold-300 hover:border-gold-400 hover:text-gold-200'
            : 'cursor-pointer border-gold-500/30 bg-soot-950/70 text-gold-300/70 hover:border-gold-500/60 hover:text-gold-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/** Shown in the centre when a figure has no art drawn for it yet. */
export function MissingArt({ path }) {
  return (
    <div className="mb-16 flex h-3/5 w-56 flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-gold-500/25 bg-soot-950/40 p-6 text-center">
      <span className="font-display text-xs uppercase tracking-[0.18em] text-gold-200/40">
        No art yet
      </span>
      <code className="font-body text-[11px] break-all text-gold-200/30">{path}</code>
    </div>
  )
}

/** Full-bleed background image plus the standard vignette. */
export function ScreenBackdrop({ src }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 80% at 50% 55%, transparent 25%, rgba(10,8,5,0.6) 75%, rgba(10,8,5,0.95) 100%)',
        }}
      />
    </>
  )
}
