# CARDS

**Status:** 36 player cards + 37 enemy cards written.

- `data/cards.json` — player cards
- `data/enemy-cards.json` — enemy (interviewer) cards
- `SCHEMA.md` — field definitions and the player/enemy separation rule

Those files are the source of truth for content. This document covers design
intent. Last updated 2026-08-26.

Companion to PRD.md (design) and ARCHITECTURE.md (schema).

---

## Card shape (per D7)

Every card carries a **mechanical payload** and **interview subtext**. The subtext
is display-only and never affects resolution, so content and balance are edited
independently.

| Field | Meaning |
|---|---|
| `id` | stable key — a v4 UUID; read cards by `name` |
| `name` | mechanical name — e.g. "Confusion" |
| `text` | mechanical effect, one short line |
| `subtext` | the interview line — e.g. *"Roast my setup!"* |
| `cost` | energy |
| `oncePerRoom` | usable once per encounter (D16) |
| `cooldown` | turns unavailable after use (D16) |
| `type` | attack / skill / power / status / curse |
| `class` | wizard / fighter / rogue / duelist — or `neutral` |
| `targets` | may reference `race` / `gender` (D12, Screen 2 spec) |

Full schema lives in ARCHITECTURE.md §2.

---

## Class card pools

Signature mechanics per D11. Each pool needs cards that express its shape and
nothing that expresses another's.

Six cards each. Content in `data/cards.json`.

### Neutral — 10
Available to every class. Carries the basics (Strike, Defend) and the starting
Power.

### Wizard — 7 (Backend, Database)
*Big committed plays.* Deep Dive and The Migration resolve on a **later turn** —
you commit before you know what is coming. Index and Query Plan are the setup.
Cold Start is the cheap spammable floor so the class is never stuck (D11).

### Fighter — 6 (Full Stack)
*Consistency.* Highest unrestricted baseline — Ship It and Steady Hands have no
cooldown at all. Whatever's Needed copies any other card at 60%, which is the
class identity and the joke in the same mechanic.

### Rogue — 6 (Frontend, Mobile)
*Spiky, not fragile.* **Flourish** is the setup currency: Polish and Portfolio
build it, The Reveal spends all of it at once. App Store Review is the platform-
constraint card — enormous damage, then you lose a turn to approval.

### Duelist — 7 (DevOps, Analyst)
*Reactive.* **Riposte** deals its value back to anything that hits you. Root Cause
doubles if you took damage last turn, so the class is rewarded for absorbing
rather than initiating. Blameless reflects everything for one turn.

### New keywords introduced
- **Block** — standard damage absorption.
- **Flourish** (Rogue) — stacking setup counter, spent by The Reveal.
- **Riposte** (Duelist) — reflects its value at any attacker.

---

## Deck economy (D15)

| | |
|---|---|
| Inventory | 20 cards owned |
| Loadout | carried into a room; starts at 5 and grows |
| Starting loadout | 5 — 3 attack, 1 defend, 1 power, **granted, not chosen** |
| Management | only outside a room, via a map button |
| Post-room | offered 3 cards, pick 1 — **or** heal instead |

**The whole loadout is always available (D16).** No deck, no draw, no discard, no shuffle.
Play them in any order at any time. The only restrictions are per-card:
`oncePerRoom` and `cooldown`.

Design consequence for card writing: **scarcity has to be authored into individual
cards**, since it no longer comes from the shuffle. A card that would be
overpowered if spammed needs `oncePerRoom` or a `cooldown` — there is no draw luck
to rate-limit it.

The starting five are neutral — 3× Strike, 1× Defend, 1× Confidence — so the
class pools do **not** have to supply basics. They supply what a class *becomes*,
and every card in them is earned in the dungeon rather than picked at creation.

---

## Open

- ~~**Energy per turn is assumed to be 3.**~~ **Confirmed: 3**, for every class,
  refilled each turn (2026-08-26). Every cost in `cards.json` is balanced against
  it. Starting Block is likewise set — 0 for all, 1 for the Fighter.
- ~~**Starting loadout** — should each class be granted its own flavoured
  basics?~~ **Answered: yes** (2026-08-26). `notes.startingLoadout` is keyed by
  class; a class without an entry gets `default`. The Fighter is the only one
  flavoured so far, opening with Wallop in place of a Strike. Still granted, not
  drafted. Open: what the other three trade, and whether one card each is enough
  to read as a class.
- Duplicates: can the inventory hold two copies of the same card?
- Pool size per class — 6 each. Less pressing now that the loadout is earned
  rather than drafted, but it caps how far a class can diverge over a run.
- Which cards are draftable mid-run vs. starting-pool only.
- Card removal — does it exist, and where?
- What happens when the 20-card cap is reached (one card per room means it binds
  after ten rooms).
- Race/gender-targeting cards (Discrimination type) — enemy side, see below.

---

## Enemy cards — 37, in `data/enemy-cards.json`

The nine-category taxonomy is the `subtype` field, and it drives behaviour:

| subtype | move archetype | n |
|---|---|---|
| intro | Mark | 7 |
| hypothetical | wind-up | 1 |
| passive_aggressive | debuff (Doubt) | 4 |
| unhinged | random effect | 2 |
| trap | dilemma | 11 |
| discrimination | unblockable | 4 |
| technical | skill check | 4 |
| silence | **defend** — Block + no telegraph | 2 |
| outro | execute, scales off Doubt + Mark | 2 |

35 attack, 2 defend. Three Trap entries appeared twice in the source list
(craziest thing, hardest thing, five/ten years) and were kept once each.

**On the Discrimination cards.** Written as recognisable real-world
microaggressions rather than slurs, and all four are unblockable — no card
counters them, they cannot be reduced or evaded or riposted, and the player can
only absorb them and keep walking. That is the point. It says the thing without a
line of dialogue explaining it.

**Enemy-side keywords:** Mark (tags the player for later bonus damage), Doubt
(accumulates, Outro cards scale off it), Unblockable, Dilemma.

The two Outro cards are the tally — they turn everything the interviewer noticed
into damage at the end. `Any Questions` inverts it: it only hurts if you do
nothing.
