/**
 * What an attack actually does.
 *
 * One rule, run in both directions: block absorbs the blow before health does,
 * and whatever the block cannot cover is what the target loses. Block is spent
 * absorbing — CARDS.md §Block calls it "standard damage absorption", and
 * startTurn resetting it to the class default every turn only means anything if
 * a turn can use it up.
 *
 * This is a pure function and it has to be. The player's health lives in the
 * store because it is saved between rooms; the interviewer's lives on the
 * battle screen because ARCHITECTURE.md §4 keeps combat state out of the save.
 * The two sides share no state, so the arithmetic is the only thing they can
 * share — and it is the part that must agree.
 */

/**
 * @param card the card being played. `damage` is the blow, `blockDamage` strips
 *   guard before it lands, `unblockable` ignores guard entirely (PRD line 363).
 *   All three are optional: a card with no numbers on it deals nothing, which
 *   is how the cards whose riders are not built yet behave.
 * @param block the target's block before the hit.
 * @param health the target's health before the hit.
 * @returns the target's block and health after it, plus how much the guard ate
 *   and how much got through — Wallop needs the latter to know what it gained.
 */
export function resolveAttack({ card, block = 0, health = 0 }) {
  const damage = card.damage ?? 0

  // Stripped first: Smite's "-2 block" is the whole reason to play it into a
  // guard, so it has to land before the blow it is clearing the way for.
  const guard = Math.max(0, block - (card.blockDamage ?? 0))

  const absorbed = card.unblockable ? 0 : Math.min(guard, damage)
  const dealt = damage - absorbed

  return {
    block: guard - absorbed,
    health: Math.max(0, health - dealt),
    absorbed,
    dealt,
  }
}
