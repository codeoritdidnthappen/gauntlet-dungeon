import { resolveCardArt } from '../config/assets'

/**
 * A player card, drawn as a physical playing card — portrait, 5:7, rounded, with
 * an art window above the text.
 *
 * `name` + `text` are the mechanics; `subtext` is the interview line (D7) and is
 * display-only. Art is not drawn yet, so the window shows the filename the image
 * will be loaded from; dropping the file into `assets/cards/` is all it takes.
 *
 * Sizing comes from the parent — the card fills the width it is given.
 *
 * Card copy may address the player by name — `${playerName}` in cards.json is
 * substituted here, so writing a card that greets the candidate needs no code.
 */
const TYPE_STYLE = {
  attack: { border: 'border-red-900/70', pip: 'bg-red-900/40', label: 'text-red-200/50' },
  defend: { border: 'border-sky-900/60', pip: 'bg-sky-900/40', label: 'text-sky-200/50' },
  power: { border: 'border-gold-500/60', pip: 'bg-gold-500/25', label: 'text-gold-200/50' },
}

const TYPE_LABEL = { attack: 'Attack', defend: 'Defend', power: 'Power' }

const fill = (copy, playerName) => copy.replaceAll('${playerName}', playerName)

export default function GameCard({ card, playerName }) {
  const art = resolveCardArt(card)
  const style = TYPE_STYLE[card.type] ?? TYPE_STYLE.power
  const artPath = `${card.image?.path ?? 'assets/cards/'}${card.image?.filename ?? `${card.id}.png`}`

  return (
    <article
      className={[
        'flex aspect-[5/7] w-full flex-col gap-1.5 overflow-hidden rounded-xl border-[3px] p-2',
        'bg-soot-900 shadow-[0_8px_24px_rgba(0,0,0,0.7)]',
        style.border,
      ].join(' ')}
    >
      {/* ------------------------------------------------------------- title */}
      <div className="flex items-start justify-between gap-1.5">
        <span className="font-display text-2xs leading-tight font-bold text-gold-200">
          {card.name}
        </span>
        <span
          title={`${card.cost} energy`}
          className={[
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            'border border-gold-500/60 font-display text-2xs text-gold-300',
            style.pip,
          ].join(' ')}
        >
          {card.cost}
        </span>
      </div>

      {/* --------------------------------------------------------------- art */}
      <div className="h-[42%] w-full shrink-0 overflow-hidden">
        {art ? (
          <img src={art} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-gold-500/20 bg-soot-950 p-1.5 text-center">
            <span className="font-display text-3xs tracking-[0.14em] text-gold-200/35 uppercase">
              No art yet
            </span>
            <code className="font-body text-3xs break-all text-gold-200/20">{artPath}</code>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------- text */}
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="font-body text-3xs leading-snug text-gold-200/75">{fill(card.text, playerName)}</p>
        <p className="mt-1 font-body text-3xs leading-snug text-gold-200/35 italic">
          “{fill(card.subtext, playerName)}”
        </p>
        {(card.oncePerRoom || card.cooldown > 0) && (
          <p className="mt-1 font-display text-3xs tracking-[0.1em] text-gold-200/30 uppercase">
            {card.oncePerRoom ? 'Once per room' : `Cooldown ${card.cooldown}`}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------ footer */}
      <div
        className={[
          'shrink-0 border-t border-gold-500/15 pt-1 text-center',
          'font-display text-3xs font-bold tracking-[0.18em] uppercase',
          style.label,
        ].join(' ')}
      >
        {TYPE_LABEL[card.type] ?? card.type}
      </div>
    </article>
  )
}
