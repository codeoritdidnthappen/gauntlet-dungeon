# SCHEMA

Data shapes for the game. Content lives in:

- `data/cards.json` — 30 player cards
- `data/enemy-cards.json` — 37 enemy (interviewer) cards
- `data/character-options.json` — the selectable sets for character creation
- `data/enemies.json` — enemies and camps (structure only; unpopulated)

Sections 1–7 cover **cards**. Sections 8–15 cover **characters** — default player
stats in §14, gender in §15.

Last updated 2026-08-24.

---

## 1. The separation rule

**Players cannot use enemy cards. Enemies cannot use player cards.**

Every card carries a `side` field. It is the enforcement point:

```
side: "player" | "enemy"
```

Rules:

- A card may enter a player **inventory** or **loadout** only if `side === "player"`.
- A card may enter an enemy's move set only if `side === "enemy"`.
- No card may change its `side` at runtime.
- Any effect that would move, copy, steal or generate a card must assert the
  target's `side` matches the destination. The two pools are never merged, never
  shuffled together, and never drawn from a common list.

The two files stay physically separate so the rule is hard to violate by accident.

---

## 2. Shared fields

Present on every card, both sides.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | stable unique key |
| `side` | `"player"` \| `"enemy"` | the separation rule, §1 |
| `name` | string | mechanical label — e.g. "Strike", "Price Check" |
| `type` | string | see §3 / §4 — the type sets differ by side |
| `subtype` | string | narrower category within `type`; may be `""` |
| `cost` | int | energy |
| `text` | string | mechanical effect, one short line. This resolves. |
| `subtext` | string | the interview line. **Display only — never resolves** (D7) |
| `image` | object | `{ filename, path }` — placeholder until art exists |

`cost` is **player-side only**. Enemies have no energy — see §4.

**On `subtext` (D7).** The two sides use it differently, and both are correct:

- **Player cards:** `name` is the mechanic, `subtext` is what the *candidate says*.
- **Enemy cards:** `name` is the mechanic, `subtext` is what the *interviewer
  asks*. The question is the content — it is the reason the card exists.

Either way it is inert. Resolution reads `text`, never `subtext`, so writing and
balancing stay independent.

---

## 3. Player cards — additional fields

| Field | Type | Meaning |
|---|---|---|
| `cost` | int | energy. Player side only. |
| `class` | `neutral` \| `wizard` \| `fighter` \| `rogue` \| `duelist` | pool it belongs to (D10) |
| `rarity` | `basic` \| `common` \| `uncommon` \| `rare` | Slay the Spire tiers |
| `oncePerRoom` | bool | usable a single time per encounter (D16) |
| `cooldown` | int | turns unavailable after use; `0` = none (D16) |

`type` is **`attack` | `defend` | `power`**, matching D15's starting loadout of
5 attack / 4 defend / 1 power.

`subtype` is mechanical flavour — `burst`, `delayed`, `riposte`, `setup`,
`engine`, `scaling`, `combo`, `hybrid`, `flexible`, `ramp`, `evade`,
`conditional`, `cost-health`, `buff` — or `""`.

**Scarcity is authored per card.** D16 removed the deck and draw, so nothing is
rate-limited by a shuffle. Anything that would be broken if spammed needs
`oncePerRoom` or a `cooldown`. Cards with neither are deliberately spammable and
priced low.

---

## 4. Enemy cards — additional fields

| Field | Type | Meaning |
|---|---|---|
| `unblockable` | bool | ignores Block, evade, riposte and all mitigation |
| `targets` | object \| null | `{ field, values[] }` — see §5 |

**Enemies have no energy budget**, matching Slay the Spire. There is no `cost`
field on this side and no resource pool of any kind.

An enemy takes **one telegraphed intent per turn**, selected from a weighted move
list with anti-repeat rules (cannot use the same move twice in a row, or three
times in a row — tuned per enemy). The player sees the intent before committing.

Variety comes from **compound intents** — a single card that does several things
("deal damage and gain Block") — not from spending a budget on multiple cards.
Anything that would have been "two cards in one turn" is authored as one card.

`type` is **`attack` | `defend`**. Silence cards are `defend`.

`subtype` is the nine-category enemy taxonomy, and it is load-bearing — it
determines how the card behaves, not just how it reads:

| subtype | move archetype | count |
|---|---|---|
| `intro` | Mark — tags the player for later bonus damage | 7 |
| `hypothetical` | Wind-up — telegraphed heavy next turn | 1 |
| `passive_aggressive` | Debuff — small damage plus Doubt | 4 |
| `unhinged` | Random effect — rolls on a table | 2 |
| `trap` | Dilemma — player chooses which resource to pay | 11 |
| `discrimination` | Unblockable — no counter exists | 4 |
| `technical` | Skill check — binary, no partial credit | 4 |
| `silence` | Defend — Block, and no telegraph next turn | 2 |
| `outro` | Execute — scales off accumulated Doubt and Marks | 2 |

---

## 5. Targeting

```
targets: { field: "race" | "gender", values: string[] } | null
```

`null` means the card applies to everyone.

Only `race` and `gender` are targetable. **`role` is never branchable** — it is a
display-only identity that resolves to `class` (D10). `class` is branchable.

`values` is currently `[]` on the two discrimination cards that carry a `targets`
field, meaning they fire universally until values are chosen. See §7.

---

## 6. Keywords

| Keyword | Side | Meaning |
|---|---|---|
| **Block** | both | standard damage absorption |
| **Flourish** | player (Rogue) | stacking setup counter; The Reveal spends all of it |
| **Riposte** | player (Duelist) | deals its value back to any attacker |
| **Mark** | enemy | tags the player; later cards deal bonus damage against it |
| **Doubt** | enemy | accumulating debuff; Outro cards scale off it |
| **Unblockable** | enemy | ignores Block, evade, Riposte, all mitigation |
| **Dilemma** | enemy | player picks which resource to pay; both branches cost |

---

## 7. Open

- **Enemy health has no values.** Player defaults are set (§14); enemy `maxHealth`
  is still unchosen for every enemy. It must be scaled against a **6-energy**
  player turn — roughly 4–5 cards per turn, not the 2 that 3 energy allowed.
- **Discrimination targeting values.** `e_disc_gender` and `e_disc_race` have
  empty `values` arrays. Options: fire universally (current behaviour), fire only
  against matching characters, or fire universally with bonus damage on a match.
  Deliberately left unset.
- **Duplicates** — can a player inventory hold two copies of the same card?
- **Technical card tag.** Skill-check cards check whether the player holds a
  "Technical card". No player card currently carries that tag. Either a
  `tags: []` field is needed, or the check keys off `class`.

---
---

# CHARACTERS

## 8. Combatant — the shared base

Anything that can take damage in a room. Both the player and every enemy are
Combatants. This is **runtime state**, created when a room begins.

```
Combatant {
  health:      int          // current
  maxHealth:   int
  block:       int          // resets each turn
  statuses:    { [id]: int } // stacking counters — Mark, Doubt, Flourish, Riposte…
}
```

Rules:

- `block` is transient and zeroed at the start of the owner's turn.
- `statuses` is a flat counter map so new keywords need no schema change.
- **Player `health` persists across the whole run** (D4). Enemy `health` is
  discarded when the room ends (D5 — enemies never return).
- **Energy is not here.** Only the player has energy (§9); enemies have none (§4).

### Health and energy are not the same kind of pair

Both are `current` + `max`, but they behave differently and the code should not
treat them alike:

| | refills | persists |
|---|---|---|
| `health` / `maxHealth` | never automatically — only via heal nodes (D4) | across the entire run |
| `energy` / `maxEnergy` | **to full at the start of every turn** | not at all |

So "current health" is a real running total, while "current energy" is just how
much of this turn's budget is left.

---

## 9. PlayerCharacter

Created on Screens 2 and 3, then carried for the entire run.

```
PlayerCharacter extends Combatant {
  // identity — set at creation, never changes
  name:       string        // free text, length-capped
  race:       RaceId        // elf | dwarf | human | half_orc
  gender:     GenderId      // male | female | nonbinary
  role:       RoleId        // 7 options, player-facing identity
  class:      ClassId       // wizard | fighter | rogue | duelist — DERIVED from role

  // pet (D13)
  petType:    "dog" | "cat"
  pet:        PetId
  petName:    string        // free text, length-capped

  // energy — player only; enemies have none (§4)
  energy:     int           // current; refills to maxEnergy at the start of every turn
  maxEnergy:  int           // base budget per turn

  // run progression
  revivesRemaining: int     // starts at 3 (D13)
  inventory:  CardId[]      // owned, max 20 (D15) — all side:"player"
  loadout:    CardId[]      // carried into a room, exactly 10 (D15)
}
```

### Branchability — the rule that matters

| Field | Branchable? | Why |
|---|---|---|
| `class` | **yes** | it is the mechanics (D10) |
| `race` | **yes** | enemy cards target it (D12) |
| `gender` | **yes** | enemy cards target it (Screen 2 spec) |
| `role` | **NO** | display-only identity; resolves to `class` and nothing else |
| `pet` / `petType` | **no** | cosmetic; `petName` is rendered in the revive scene |

`role` must never appear in a conditional in resolution code. It exists so that
the planned 1:1 role→class expansion is additive rather than a refactor (D10).

### Invariants

- `energy` is set to `maxEnergy` at the start of every player turn, and unspent
  energy does **not** carry over.
- `maxEnergy` is the base. Effects may raise it **within a room only** — Full
  Stack grants +1 per turn — and it reverts when the room ends. Keep the base and
  the in-room modified value distinct so a room never permanently alters the
  character.
- `loadout.length === 10` exactly — not 9, not 11 (D15).
- `inventory.length <= 20` (D15).
- `loadout ⊆ inventory`.
- Every card in either list has `side === "player"` (§1).
- `class === ROLE_TO_CLASS[role]` — always derived, never independently set.
- `revivesRemaining` starts at 3; at 0 the next death ends the run and discards
  all of the above (D13).
- Loadout may only be edited **outside a room**, from the map button (D15).

---

## 10. RoleId → ClassId (D10)

Seven roles, four classes. Role is cosmetic in v1; a future version maps 1:1.

| RoleId | ClassId |
|---|---|
| `backend` | `wizard` |
| `database` | `wizard` |
| `fullstack` | `fighter` |
| `frontend` | `rogue` |
| `mobile` | `rogue` |
| `devops` | `duelist` |
| `analyst` | `duelist` |

---

## 11. Enemy

An interviewer. **Mirrors PlayerCharacter** — same Combatant base, same identity
fields — plus a `camp`, and with a move set where the player has an inventory.

```
Enemy extends Combatant {
  id:         string
  name:       string

  // identity — mirrors the player (§9)
  race:       RaceId        // elf | dwarf | human | half_orc
  gender:     GenderId
  role:       RoleId        // their job title
  class:      ClassId       // DERIVED from role, same map as the player (§10)

  // enemy-only
  camp:       CampId        // D5 — drives the map icon and which enemies recur
  portrait:   { filename, path }

  // behaviour — where the player has inventory + loadout
  intents:    WeightedIntent[]
  antiRepeat: { maxInARow: int }
}

WeightedIntent {
  cardId:   string          // must be side:"enemy"
  weight:   number
}
```

### What mirrors, and what doesn't

| PlayerCharacter | Enemy |
|---|---|
| Combatant base | same |
| `name`, `race`, `gender`, `role`, `class` | same, same map (§10) |
| `inventory` + `loadout` | `intents` — a weighted move list |
| energy budget | **none** (§4) |
| `pet`, `petName`, `revivesRemaining` | none |
| — | `camp`, `portrait` |

**Why mirroring pays for itself: enemies reuse the sprite pipeline.** D12's
composition is `body(class) + race overlay`. Because an enemy has a `class` and a
`race`, it renders through the exact same four bodies and four overlays already
built for the player. No separate enemy art pipeline exists or is needed.

`class` on an enemy is **visual and thematic only.** Enemy behaviour comes
entirely from `intents` — nothing in resolution branches on an enemy's class. As
with the player, nothing branches on `role` either.

`race` and `gender` on an enemy exist for identity and art. No card currently
targets an enemy by either — the Discrimination cards point at the player — but
the fields are real and queryable, so a symmetric card could be written later.

### Rules

- **No energy, no resource pool.** One telegraphed intent per turn, picked from
  `intents` by weight and constrained by `antiRepeat` (§4).
- Multi-part turns are **compound intents** — one card doing several things —
  never two cards in a turn.
- Every `cardId` must resolve to a card with `side === "enemy"` (§1).
- `class === ROLE_TO_CLASS[role]` — derived, never independently set, same as the
  player.
- Enemies do not persist between rooms (D5). Other members of the same `camp` may
  appear later; the same enemy never does.
- Enemy `health` is discarded at room end. Only the player's persists (D4).

### Camp

```
Camp { id, name, icon: { filename, path } }
```

A camp is a faction of interviewers. It is the only thing that recurs across the
map: cleared nodes render the camp icon and enemy name, and later nodes may hold
*different* members of the same camp (D5).

Cleared map nodes render the camp icon and enemy name (D5).

---

## 12. Pet

```
Pet {
  id:      string
  type:    "dog" | "cat"
  name:    string           // display name of the breed/variant, not the player's petName
  image:   { filename, path }
}
```

**Pets have no stats.** Those four fields are the whole record — no health, no
energy, no modifiers, nothing that touches combat maths. A Pet is not a
Combatant and never enters a room as an entity.

Art is **supplied by the developer**, not generated (D13). The pipeline accepts
drop-in files.

Its only mechanical role is the revive (D13): on player `health` reaching 0, if
`revivesRemaining > 0`, decrement it and play the revive scene using `petName`.
Choosing one pet over another changes nothing except which image appears.

---

## 13. Open

- **Gender art model.** The options are set (§15), but it is still undecided
  whether gender is a cosmetic label, a feature overlay, or a separate body
  silhouette (Screen 2 spec). Independent of the fact that it is targetable.
- **Enemy health.** No `maxHealth` value exists for any enemy. Player defaults
  are set (§14).
- **Revive health** — what `health` is restored to on a revive (D13).
- **Enemy roles.** Enemies currently draw from the same seven roles as the player
  (§10). Interviewer-specific roles — Recruiter, Hiring Manager, Founder — have no
  entry and no class mapping. Add them, or accept that every interviewer is one of
  the seven engineering roles.
- **Duplicates** — may `inventory` hold two copies of the same `CardId`? If yes it
  is a multiset and `loadout ⊆ inventory` needs counting, not set semantics.
- **Technical card tag** — skill-check enemy cards test for "a Technical card" and
  no player card carries such a tag. Needs a `tags: []` field or a `class` check.

---

## 14. Default player stats

**Set by CLASS only.** Race and gender do not affect stats at all — they are
identity and art (D12), plus a card-targeting surface. Values live in
`data/character-options.json` under `classes[].stats`.

| Class | Roles | maxHealth | maxEnergy |
|---|---|---|---|
| **Fighter** | Full Stack | 82 | 6 |
| **Rogue** | Frontend, Mobile | 78 | 6 |
| **Wizard** | Backend, Database | 74 | 6 |
| **Duelist** | DevOps, Analyst | 72 | 6 |

`health` starts at `maxHealth`. `energy` refills to `maxEnergy` at the start of
every turn (§8).

### Why the health spread is narrow

72–82 is about a 14% band. D11 forbids fragility as a class identity, so this is
a nudge rather than a role. Fighter is highest because consistency is its whole
kit and it has no escape valve. Duelist is lowest and is therefore the sharpest
edge of the four — both its signature mechanics (Riposte, and Root Cause doubling
after damage) *want* it to be hit, so it has the least health and the most reason
to spend it.

### Why energy is 6

Average card cost across the 30 player cards is **1.4**, so 6 energy buys about
**4.3 cards per turn**. At 3 it would have been 2.1 — fewer than the three-card
turn the design calls for.

There is a structural reason too. In Slay the Spire energy is not the only
limiter; a 5-card hand also gates the turn. **D16 removed that** — all 10 loadout
cards are available every turn — so energy is the *only* gate besides cooldowns,
and it has to be larger than Spire's 3 to compensate.

Card costs were priced **relative to each other**, so raising the budget did not
invalidate them. It raises output per turn, which enemy health absorbs.

### Run-level budget

Health persists across the run (D4) and there are 3 revives (D13), so the real
budget is roughly `4 × maxHealth` plus healing:

| Class | ~run HP before the run ends |
|---|---|
| Fighter | 328 |
| Rogue | 312 |
| Wizard | 296 |
| Duelist | 288 |

These numbers are **coupled to room count**, which is still undecided. At 6 rooms
this is generous; at 15 it is punishing. Choose room count against this table.

---

## 15. Gender

Three options, in `data/character-options.json` under `genders`.

| id | name | pronouns |
|---|---|---|
| `male` | Male | he / him / his / himself |
| `female` | Female | she / her / her / herself |
| `nonbinary` | Non-binary | they / them / their / themselves |

**"Non-binary" rather than "They"** so all three options are the same kind of
label. *They* is a pronoun, not a descriptor, and sitting beside *Male* and
*Female* it reads as an afterthought.

**Pronouns are stored separately** on each option because the label and the
pronoun do different jobs. The text layer needs the pronoun — revive scene,
narrator lines, endings — and should read `genders[x].pronouns`, never infer one
from the `id`.

Gender **does not affect stats** (§14). It **is** card-targetable (§5).
