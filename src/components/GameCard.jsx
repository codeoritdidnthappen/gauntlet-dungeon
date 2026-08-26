/**
 * A player card.
 *
 * `name` + `text` are the mechanics; `subtext` is the interview line (D7) and
 * is display-only. No card art exists yet, so the card is drawn in DOM — which
 * suits a game whose joke lives in the text.
 */
const TYPE_ACCENT = {
  attack: 'border-l-red-900/70',
  defend: 'border-l-sky-900/60',
  power: 'border-l-gold-500/70',
}

const RARITY_RING = {
  basic: 'border-gold-500/20',
  common: 'border-gold-500/30',
  uncommon: 'border-sky-700/45',
  rare: 'border-gold-400/60',
}

export default function GameCard({ card, count = 0, onAdd, onRemove, disabled = false }) {
  const picked = count > 0

  return (
    <div
      className={[
        'group relative flex w-full flex-col rounded-sm border border-l-4 bg-soot-950/85 p-2.5 text-left',
        'backdrop-blur-[2px] transition-colors duration-150',
        TYPE_ACCENT[card.type] ?? '',
        picked ? 'border-gold-400/70 bg-soot-800/85' : (RARITY_RING[card.rarity] ?? 'border-gold-500/25'),
      ].join(' ')}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-display text-sm leading-tight font-bold text-gold-200">
          {card.name}
        </span>
        <span
          title={`${card.cost} energy`}
          className="shrink-0 rounded-full border border-gold-500/50 px-1.5 font-display text-2xs leading-4 text-gold-300"
        >
          {card.cost}
        </span>
      </div>

      <p className="font-body text-2xs leading-snug text-gold-200/75">{card.text}</p>
      <p className="mt-1 font-body text-2xs leading-snug text-gold-200/35 italic">
        “{card.subtext}”
      </p>

      {(card.oncePerRoom || card.cooldown > 0) && (
        <p className="mt-1 font-display text-3xs tracking-[0.1em] text-gold-200/30 uppercase">
          {card.oncePerRoom ? 'Once per room' : `Cooldown ${card.cooldown}`}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gold-500/15 pt-2">
        <span className="font-body text-2xs text-gold-200/45">
          {picked ? `×${count}` : ''}
        </span>
        <div className="flex gap-1">
          <StepButton onClick={onRemove} disabled={!picked} label={`Remove one ${card.name}`}>
            −
          </StepButton>
          <StepButton onClick={onAdd} disabled={disabled} label={`Add one ${card.name}`}>
            +
          </StepButton>
        </div>
      </div>
    </div>
  )
}

function StepButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        'h-6 w-6 rounded-[2px] border font-display text-sm leading-none',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1 focus-visible:ring-offset-soot-950',
        disabled
          ? 'cursor-not-allowed border-gold-500/15 text-gold-200/20'
          : 'cursor-pointer border-gold-500/40 text-gold-300 hover:border-gold-400 hover:bg-gold-500/15 hover:text-gold-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
