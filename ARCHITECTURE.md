# ARCHITECTURE — Gauntlet Game

**Status:** pre-production. Last updated 2026-08-24.

---

## 1. Stack — DECIDED

**React + Tailwind.** DOM-rendered, not canvas. Godot and Phaser are both out.

Deciding factor: D7 gives every card two text fields (mechanical line + interview
subtext), on top of enemy names, dialogue, and meter labels. Canvas has no text
layout engine, so all of that becomes manual measurement and wrapping, and blurs
at fractional scale. A game whose joke lives in its text belongs in the DOM.

Sprite compositing (D12's 4 bodies × 4 race overlays) is `position: absolute`
layering. The Darkest Dungeon look — vignette, grain, contrast crush, torch
flicker — is CSS filters, blend modes, and keyframes.

**Animations are minimal.** No particle system, no tween engine, no sprite-sheet
frame animation. CSS transitions and keyframes only. If something needs more than
that, the design is wrong, not the stack.

### State — Redux Toolkit

`@reduxjs/toolkit` + `react-redux`. Two slices under `src/store/`:

| Slice | Holds |
|---|---|
| `player` | name, race, gender, role, class, pet, petType, petName, loadout |
| `ui` | current screen, music on/off |

**The rule for what goes where:** anything that outlives the component that set
it goes in Redux; anything only that component cares about stays in React
state. So the character is Redux (built across three screens, carried for the
whole run) while, say, the home screen's save-check status is local.

Two consequences worth knowing:

- **Screens dispatch `goTo` themselves** rather than being handed navigation
  callbacks, because every screen navigates.
- **The `<audio>` element is deliberately NOT in Redux** — it is an imperative,
  non-serialisable resource. Only the `musicEnabled` flag is state; the element
  lives in `MusicProvider` and reacts to it.

`class` is derived inside the `setRole` reducer, so it can never drift from
`role` (D10). The loadout is granted at creation from
`cards.json → notes.startingLoadout`, and is a flat array of card ids with
duplicates repeated, matching SCHEMA.md §9 — not a `{id: count}` map.

## 1b. Persistence — localStorage, no backend

**No Supabase, no server, no login, no accounts.** All state is local.

**The player is warned** that clearing browser data destroys their game. The
warning lives on the **welcome screen — the very first screen**, before anything
else.

Note on screen numbering: D3's "Screen 1 is the Dungeon Entrance" means the first
*gameplay* screen. The welcome screen sits ahead of it and is not part of the
dungeon.

Consequence: a cross-player leaderboard is off the table unless a backend is added
later. Nothing in the design should assume one.

### Tamper resistance

Goal, stated plainly: make casual save-editing cost one extra step. This is
obfuscation and tamper *detection*, not security. Anyone reading the bundle can
defeat it, and that is accepted.

Note on terminology, because it changes the implementation: a **hash** is one-way,
so a hashed save cannot be read back and is useless on its own. Two separate
mechanisms are wanted here:

1. **Obfuscation** — the payload is not human-readable at a glance. Base64 plus a
   light transform is enough; AES via Web Crypto if more is wanted.
2. **Tamper detection** — an **HMAC-SHA256 checksum** over the payload, keyed with
   a secret baked into the bundle. On load, recompute and compare. Mismatch means
   the save was edited, and the game breaks / refuses it.

`crypto.subtle` does HMAC-SHA256 natively — no library needed.

Store as `{ payload, checksum }`. Validate on every read, never trust a save that
fails, and fail loudly rather than silently resetting.

---

## 1a. Fixed shape (locked)

Single-player only (D8). One player entity versus 1..n enemy entities. No
network layer, no second input source, no turn arbitration between humans.

Mechanical base is Slay the Spire (D6): deck / draw / discard / reshuffle, fixed
energy per turn, telegraphed enemy intent, post-encounter card draft, permanent
run-scoped passives, card removal.

Every card carries both a mechanical payload and interview subtext (D7). These
are separate fields — subtext is display-only and never affects resolution, so
content and balance can be edited independently.

## 2. Data-driven content

All game content lives in data, not code. This is the single most important
architectural decision for a 3.5-day build: it means content iteration (the part
that actually consumes the week) never requires touching logic.

### Card

```
{
  id:          string
  name:        string          // mechanical name, e.g. "Confusion"
  text:        string          // mechanical effect, ONE line, short
  subtext:     string          // the interview line — display only, never resolves (D7)
  cost:        int             // if energy system is adopted
  effects:     Effect[]        // damage, block, draw, stall, etc.
  oncePerRoom: bool            // usable a single time per encounter (D16)
  cooldown:    int             // turns unavailable after use, 0 = none (D16)
  bullshit:    int             // how much this loads the Bullshit Meter
  backs_up:    string[]        // claim tags this card can substantiate
  claims:      string[]        // claim tags this card asserts
  archetype_mods: { [archetypeId]: float }   // M4 multiplier table
}
```

`claims` / `backs_up` is the mechanism behind M3 + D5: a card played in encounter
one writes a claim tag into run state; a later "Tell me more about that" checks
whether the hand can satisfy it.

### Interviewer

```
{
  id, name, portrait
  camp:          string        // faction id — D5; drives map icon and reuse
  hp:            int
  preference:    tag[]         // hidden; drives archetype_mods
  tells:         string[]      // surfaced lines/reactions
  intents:       Intent[]      // weighted move list; one telegraphed pick per turn
  antiRepeat:    { maxInARow: int }   // per-enemy, Spire-style
}
```

### Camp

```
{ id, name, icon }
```

Enemies are grouped into camps. A completed map node renders the camp icon and
enemy name. Other members of the same camp may appear in later nodes; the same
enemy instance never does (D5).
```

### Character (D10)

```
{
  name:    string   // free text, player-supplied — length-capped
  role:    string   // player-facing identity: backend | database | fullstack |
                    // frontend | mobile | devops | analyst
  class:   string   // mechanics: wizard | fighter | rogue | duelist
  race:    string   // elf | dwarf | human | half-orc  (D12)
  gender:  string   // options TBD; render model TBD. Card-targetable, like race.
  petType: string   // dog | cat  (D13)
  pet:     string   // id within the chosen type (D13)
  petName: string   // free text, player-supplied (D13) — length-capped
}
```

**Creation order is race → gender → role.** Role cards render the chosen race and
gender (class body + overlays), so both must be resolved before role cards can be
drawn. The role card art is therefore the same composition pipeline as the in-game
sprite — build it once, use it in both places.

Whether `gender` is a composition layer at all is undecided (PRD Screen 2). Treat
the sprite pipeline as `body(class) + overlays[]` so adding or not adding a gender
overlay is a data change rather than a rewrite.

**Death is not terminal until revives run out (D13).** Player HP reaching 0
routes to a pet revive scene, not a game-over — three times per run. The fourth
death ends the run and discards all run state.

So `revivesRemaining: int` (starts at 3) lives in run state, and HP-0 branches on
it: revive scene if > 0, run-over if 0. Keep the trigger (HP 0) separate from the
policy (how many, at what health) so tuning stays a data change.

`petName` is rendered in the revive scene.

All three of `class`, `race`, and `pet` are **selections from fixed enumerated
sets** (D14). No procedural or free-form character construction, so every
combination is known ahead of time and authorable as fixed art.

Pet art assets are supplied externally by the developer — the asset pipeline must
accept drop-in files rather than generating them.

**Sprite composition (D12).** The portrait/sprite is `class body` + `race feature
overlay`. Four bodies, four feature sets, sixteen combinations, no per-combination
art. Feature overlays must be authored against a shared anchor set (head, ears,
jaw) that every class body honours.

Role and class are **separate fields even though role is currently cosmetic**.
Nothing in resolution may branch on `role` — only on `class`. This keeps the
planned 1:1 role→class expansion additive rather than a refactor.

`race` and `gender` are different from `role`. They grant no stats or abilities in
v1, but **card effects read and target them** — race per D12, gender per the
Screen 2 spec — so both must be queryable properties on any entity a card can
touch, player and enemies alike, not display labels.

Nothing branches on `role`. Both `race` and `gender` are branchable.

These two are the mechanical substrate for the **Discrimination** enemy attack
type, which resolves as unblockable damage — it bypasses block and has no counter
card.

### Affliction

```
{ id, name, description, deck_rules: Rule[] }
```

---

## 3. Run state

One object, serializable, reset on restart:

```
{
  position:     int            // distance down the corridor
  composure:    int
  bullshit:     int
  inventory:    Card[]         // owned, cap 20 (D15)
  loadout:      Card[]         // carried into a room; starts at exactly 5 (D15)
  // NO deck / draw / discard / shuffle — the whole loadout is always available (D16)
  revivesRemaining: int        // starts at 3 (D13)
  afflictions:  Affliction[]
  open_claims:  { tag, encounterIndex }[]   // outstanding lies, current room only
  cleared:      { nodeIndex, camp, enemyNames }[]   // for map display only (D5)
}
```

---

## 4. Screen flow

```
Screen 1: Welcome           (artwork, minimal animation, localStorage warning)
  ├─ Continue Game           (rendered only if a valid save passes HMAC check)
  │     └─> Map              (always — never resumes mid-encounter)
  └─ Start New Game
        ├─> Screen 2: Character creation
        │     name (text) -> race (cards) -> gender -> role (cards, drawn as chosen)
        ├─> Screen 3: Pet
        │     petName (text) -> type (dog|cat) -> pet (cards within that type)
        └─> Screen 4: Starting loadout
              the granted 5 (3 attack / 1 defend / 1 power) — shown, not chosen

              └─> Dungeon Entrance     (first gameplay screen — D3)
                    └─> Linear Map     (D1: one straight line of node circles)
                          ├─ [Manage cards] button — loadout editing, map only (D15)
                          ├─ click next node ─> Encounter (turn loop)
                          │     └─> reward, EVERY room (D4/D15):
                          │           heal  — 15% roll cancels it, said explicitly
                          │           OR    pick 1 of 3 cards
                          │        (no rest-node type; every node is a room)
                          ├─ back to map, node cleared, next node revealed
                          └─ …to the final node ──> ending ──> restart
```

**Map model (D1).** Nodes are an ordered array, no branching. Each node has a
`revealed` state. On entering the map, nodes with index <= current are visible;
everything past `current` renders as unlit / unknown. Advancing sets
`current += 1`. There is no pathfinding and no routing choice — a single index
is the entire map state.

**Only the next room is selectable.** Cleared nodes render as history (camp icon
and enemy name, per D5) and are **not clickable**. Unrevealed nodes are not
clickable. Exactly one node — `current` — is interactive at any time.

**Continue always lands on the map.** A resumed run never restores mid-encounter.

**Reloading resumes too, not just Continue.** The game is written to localStorage
as it changes and read back before the first render, so refreshing the tab is not
a way to lose a character halfway through creating one. Where it lands follows
`runStarted`: before the run is underway, the screen they were on — creation, pet
or loadout, all still editable; once underway, the map, at the point reached.
Never back into a room.

Consequence, worth confirming: **the save point is the map.** State is written on
returning to the map, not during an encounter. That removes any need to serialise
combat state — hand, draw pile, discard, enemy intents, turn counter — which is
the largest and most fragile thing that would otherwise need persisting. Closing
the tab mid-interview costs that interview, not the run.

---

## 5. Encounter turn loop

Every loadout card is on screen and playable every turn (D16). Per-card
availability is tracked as encounter state, not as piles:

```
cardState: { [cardId]: { usedThisRoom: bool, cooldownRemaining: int } }
```

```
start of turn
  → refill energy to maxEnergy (3, no carry-over); reset block to startingBlock
    (0 — or 1 for the Fighter)
  → tick cooldowns down; re-enable anything that hit 0
  → interviewer telegraphs intent (visible before you commit)
  → player plays cards until out of energy / ends turn
  → resolve player effects
  → check Bullshit threshold → possible "Tell me more about that"
  → interviewer resolves telegraphed intent
  → check Composure → possible Affliction (M2)
  → end of turn
```

Telegraphed intent is load-bearing: it is what makes a turn a decision rather
than a coin flip. Do not cut it.

**Enemies have no energy budget** (matching Spire). No resource pool, no `cost`
field on the enemy side. Each turn the enemy picks exactly **one** intent from a
weighted move list, constrained by anti-repeat rules. Multi-part enemy turns are
authored as **compound intents** — one card doing several things — never as two
cards paid for from a budget. Enemy AI is therefore a weighted pick, not a
knapsack solve.

---

## 6. Build / delivery

- Ship a build every single day starting day one. Export problems discovered
  Thursday night have ended more jam submissions than bad gameplay has.
- Test on a machine that is not the dev machine before submission.
- Demo station needs: instant restart, gamepad *and* keyboard/mouse input,
  no window-size assumptions.
