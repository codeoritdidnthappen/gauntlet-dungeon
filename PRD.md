# PRD — Gauntlet Game (working title: TBD)

**Status:** pre-production. Last updated 2026-08-24.
**Deadline:** Thursday 2026-08-27, midnight.

---

## 1. Competition context

From `requirements/Game_Week_Rules_and_Awards.pdf`:

- Must be **playable and demoable in under 5 minutes**.
- Judged by a **combination of staff and student votes**.
- Prize categories: Best Overall ($200), Best Visuals / Art Direction ($100),
  Most Creative / Fun Gameplay ($100), Staff Pick / Technical Achievement ($100).

**Primary target:** Most Creative / Fun Gameplay.
**Secondary target:** Best Overall.
**Explicitly not chasing:** Staff Pick / Technical Achievement (no 3D, no multiplayer).

**Constraints:** solo developer, new to Godot, ~3.5 days, in-person demo where
judges play the game themselves.

---

## 2. The pitch

A turn-based card battler about surviving a job interview loop, played as a
descent into a dungeon. You are the candidate. The cards are interview tactics.
The monsters are interviewers.

**Why it wins the room:** the voters *are* the subject matter. Students are
interviewing right now; staff have run interviews. A game about interviews is a
game about them. In a popular-vote competition, resonance beats spectacle.

---

## 3. Locked decisions

### D1 — Structure is a gauntlet: a custom linear map (RATIFIED, revised)
"Run the gauntlet" is a **straight-line horizontal passage** (Swedish *gatlopp*,
"lane-run") — a corridor of people who each get one swing as you walk past. It is
not a tower climb. Progress is **distance, not altitude**.

The map is **our own, and it is one straight line** — not Slay the Spire's
branching graph.

- Rooms / interviews are **circles on the line**.
- Only the **current node and past nodes** are visible. The line ahead is
  unrevealed — you never see what is coming.
- Navigation works like Spire: you **click the next room** to advance.

Consequence to be aware of: with a single line and no forward visibility, the map
carries no routing decision. It is a progress bar and a mood device, not a
strategic layer. That is a deliberate trade — it is thematically correct for an
interview loop and it removes a system there is no time to build — but design
effort should not be spent on map choices that do not exist.

Completed nodes display the name or icon of the enemies that were there (D5).

### D2 — 2D, Darkest Dungeon art direction
Side-view 2D. High-contrast ink-and-charcoal, heavy chiaroscuro, gothic framing,
torchlight. Not 3D. Not pixel art.

Rationale: the strongest art-per-hour ratio available to a solo dev with no
modeling pipeline, and it makes the "interview as horror" joke land visually
before a single card is read.

### D3 — The gauntlet takes place in a dungeon
The hiring process *is* the dungeon. Deeper = more senior interviewer.

- **Screen 1 — the Dungeon Entrance.** The only scene outside the dungeon. Run
  setup / framing / the joke lands here.
- **Every other screen is inside the dungeon.** No office scenes, no overworld,
  no map screen above ground.

### D6 — Slay the Spire is the mechanical base (AMENDED by D16)
The game is a real single-player roguelike, not a card game shaped like one.

**Still in from Spire:**
- fixed energy budget per turn
- telegraphed enemy intent
- pick-1-of-3 card rewards after each room
- permanent passives outside the loadout (relic equivalents)
- run structure and permadeath

**No longer in — removed by D16:**
- ~~a deck you draw from~~ — all 10 loadout cards are always available
- ~~draw / discard / shuffle / reshuffle~~
- ~~card removal as a lever~~ — meaningless when the loadout is chosen fresh each
  room

Darkest Dungeon now contributes **style *and* the combat availability model**
(D16). It still contributes none of its ranks, positioning, party, or initiative
systems.

### D7 — Every card is a real attack with interview subtext
The mechanics layer is a genuine card game: damage, block, debuffs, scaling.
The interview layer sits on top as subtext on each card.

Example: a Confusion attack whose subtext is *"Roast my setup!"*. A basic attack
whose subtext is *"What sort of role are you looking for?"*.

The game must be fully playable and satisfying as a card game by someone who
never reads the subtext. The interview content is a veneer over a deeper,
working game — not a substitute for one.

### D8 — Single-player only, always
One player versus one or more enemies. No multiplayer, no co-op, no hot-seat,
no asymmetric two-player mode. This is final and not revisited.

### D4 — Health persists; rest nodes exist and can be cancelled (RATIFIED, revised)
Health carries across the entire run. There is **no reset** between encounters.

**There are no dedicated rest nodes.** The choice happens **after every room**,
always the same: **heal**, or **take a card** (1 of 3 offered — D15).

So every map node is a room. Rest is not a node type; it is the reward step that
follows every encounter.

Healing is **food and potions** — diegetic items, not an abstract "rest."

**Healing can be cancelled, every time, at ~15%.** The player chooses to heal and
it simply does not happen.

**The cancel is explicit.** The game says so directly:

> *"Your Dungeon Dash food and potions were cancelled."*

**Tuning note — the odds changed.** The earlier ~48% figure assumed roughly four
rest nodes. At one roll per room, over a ~10-room run:

- chance of **at least one** cancel: 1 − 0.85¹⁰ ≈ **80%**
- expected cancels per run: **1.5**

So this is no longer a rare gag — it is something most players hit, often more
than once. That may be exactly right for a running joke, but it is a different
feel from the earlier number and the rate should be chosen knowing it.

### D9 — Ally scenes (RATIFIED)
Depending on how an interview went, the player may get a scene with an **NPC who
is on their side** — the one person in the building who wants them to succeed.

This is the emotional counterweight to an otherwise relentlessly hostile run, and
it is something Darkest Dungeon deliberately never does. Cheap to build: a static
scene, a portrait, a few lines, a small mechanical gift.

**Open:** is the ally scene a *reward* for performing well, or a *mercy* for
performing badly? Reward escalates success. Mercy rubber-bands and keeps
struggling players in the run — which matters more than usual here, because
strangers will be playing this cold at a demo station.

### D5 — Completed rooms are done; enemies belong to camps (RATIFIED)
**Supersedes the earlier D5 entirely.** Interviewers do NOT linger, do not follow
you, and never re-enter a later encounter. That idea is dead.

- Once a room is completed, **that is it.** The exact enemies from that room are
  gone forever.
- On the map, a room displays the **name of its enemies, or their logo / icon**.
- Enemies belong to **camps**. You may meet *other* members of the same camp
  later on the line — never the same individuals again.

Camps give the map thematic continuity and let recurring factions be recognized
by icon alone, without any enemy persisting across rooms.

### D10 — Classes are two layers: role → class (RATIFIED)
Character creation asks for a **role**. The role resolves to a mechanical
**class**. Seven roles, four classes.

| Role (player picks) | Class (mechanics) |
|---|---|
| Backend | Wizard |
| Database | Wizard |
| Full Stack | Fighter |
| Frontend | Rogue |
| Mobile | Rogue |
| DevOps | Duelist |
| Analyst | Duelist |

Why this is the right shape: the role is what the audience identifies with and
what gets said out loud at a demo station ("I'm playing the DevOps guy"), while
the class is what actually has to be built and balanced. Seven identities, four
card pools.

It also makes partial shipping trivial — all seven roles can appear on the select
screen with unbuilt classes greyed out, and the structure still reads as
intentional.

**Role is cosmetic for now.** Two roles that resolve to the same class play
identically — a Wizard is a Wizard whether the player picked Backend or Database.
No unique cards, no unique relics, no stat differences.

A future version maps roles **1:1 to classes**. Build the data model so role and
class are separate fields from the start, so that expansion is additive rather
than a refactor.

### D11 — No class starts weak (RATIFIED)
Every class must be **viable from turn one**. No ramp classes, no "bad for the
first third then great," no low-HP glass cannons that die before their identity
comes online.

Classes are differentiated by the **shape of their output** — variance, timing,
commitment, and what they need from the situation — not by being handed a weak
opening in exchange for a strong finish.

Revised signature mechanics under this rule:

- **Wizard** (Backend, Database) — fewer, bigger, slower-resolving plays. Strong
  immediately, but **committed**: you telegraph and can't take it back. The cost
  is commitment, not weakness.
- **Fighter** (Full Stack) — consistency. Highest baseline, no gimmick, can play
  other pools' cards at reduced effect.
- **Rogue** (Frontend, Mobile) — **spiky, not fragile.** Solid expected damage,
  delivered in bursts that need a turn of setup. The risk is variance, not a small
  health pool.
- **Duelist** (DevOps, Analyst) — reactive. Riposte counters that punish the
  enemy's action. Strong when read correctly; **conditional, not weak**.

**Scaling engines are explicitly allowed.** The earlier consequence line — that
ramps are too slow to be a class identity — was derived from the 5-minute demo
cap and is revoked. Design for the game, not for the demo.

The two rules are compatible and this is the intended shape: a class has a solid
baseline from turn one **and** a scaling engine layered on top. Scaling is
additive to a working floor, never a substitute for one. Ironclad is the
reference — perfectly functional on turn one, and a Strength deck still
multiplies into the hundreds by the end.

So the prohibition is narrow: no class may be *bad early in order to be good
late*. A class that is fine early and becomes terrifying late is correct.

### D12 — Four races; build comes from class, features come from race (RATIFIED)
Races: **Elf, Dwarf, Human, Half-Orc.**

**Size and build are determined by CLASS, not race.** A Half-Orc Fighter is large
and muscular; a Half-Orc Duelist is smaller and thinner. An Elf Fighter and a
Half-Orc Fighter are the same size as each other.

Class-to-class variation stays **modest** — differences read as build and
proportion (muscular vs. lean), not as dramatic scale. Roughly all classes occupy
about the same footprint.

**Race supplies identifying features only**, and they stay constant across every
class: hair, ears, teeth / tusks, skin tone, brow, and so on. A Dwarf reads as a
Dwarf whether they are a Wizard or a Rogue.

Production consequence, and the reason this is the right rule: 4 classes × 4
races is 16 characters, but only **4 bodies and 4 feature sets** ever get drawn.
Race features are an overlay layer composited onto a class silhouette. Anything
that breaks this — a race that needs its own body, a class whose proportions
can't take a given feature set — costs 4× the art, so it does not happen.

**Race does not enhance abilities in v1.** No stat bonuses, no racial powers, no
class interaction. Picking Dwarf over Elf changes nothing about what your
character can do.

**But race is mechanically visible.** There will be **cards that affect certain
races**. Race is therefore a real, queryable property that card effects can read
and target — not a display-only label like `role` (D10).

Specifics deferred to the cards discussion.

### D13 — Pets (RATIFIED)
The player picks a **pet**: a **dog or a cat**, with a few options of each.

Pet art assets are **provided by the developer** (David), not generated or
sourced as part of the build.

**The player names their pet.** Free-text input at character creation.

**The pet revives the player on death.** When the player dies they see their pet
with a minimal animation, and the pet brings them back.

This is the game's death mechanic — the equivalent of Darkest Dungeon's Death's
Door, but warm instead of cruel, and it pairs with D9's ally scenes as the other
place the game is on the player's side.

The naming is what makes it land: a generic pet reviving you is a mechanic, and
*Mr. Whiskers* reviving you is a moment. The revive scene should use the name.

**Three revives per run.** The pet can bring you back three times. On the fourth
death the run is over: you start again from the beginning and **lose everything**
— deck, items, progress down the line.

So the run is permadeath with three cushions. The revive count should be visible
at all times (three pet icons that go dark as they are spent) — it is the
player's real health bar across the run, and the tension of watching it drop to
one is the point.

Pet is chosen and named on **Screen 3** (see §3b).

**Open:**
- Revived at what health?
- Does anything carry between runs (meta-progression / unlocks), or is every run
  from a clean slate?
- Where else does the pet appear — map, encounters, or only the revive scene?

### D14 — Character creation is selection, not customization (RATIFIED)
**Race, class, and pet are all chosen from pre-existing sets.** The player picks
from fixed options. There is no character creator: no sliders, no colour pickers,
no part-mixing.

The free-text fields are the **character's name** and the **pet's name** (D13).
Everything else is a selection.

Every combination is therefore known in advance and authorable as fixed art
(consistent with D12's body + overlay composition).

---

## 3b. Screens

### Screen 1 — Welcome (RATIFIED)
The first screen. Not part of the dungeon.

- **Artwork**, with **minimal animation** (consistent with the stack decision:
  CSS only, no tween or particle systems).
- **Start New Game** — always shown.
- **Continue Game** — shown **only** if a valid key exists in localStorage.
- **The localStorage warning**: clearing browser data destroys the save.

"Valid" means it passes the HMAC checksum (ARCHITECTURE §1b). A tampered or
corrupt save is not valid, so Continue does not appear for one.

**Open:** if a save exists but fails validation, does Continue simply not appear,
or does the screen say something? Silent disappearance is cleaner; saying
something is more honest and makes the tamper-detection visible. Currently
unresolved — ARCHITECTURE §1b says "fail loudly," which points at the latter.

### Screen 2 — Character creation (RATIFIED)
Reached from **Start New Game**.

Four inputs, in this order:

1. **Name** — a text field. The player's own character name.
2. **Race** — chosen from **cards**. Elf, Dwarf, Human, Half-Orc (D12).
3. **Gender**.
4. **Role / job title** — chosen from **cards**. Maps to a class (D10).

**The role cards depict the race and gender already chosen.** Pick Elf, and the
role cards show an Elf in each role. This is what D12's composition model exists
for — class body plus overlays — so the cards render the real combination the
player is about to play.

Consequence: **race and gender are both selected before role.** The order is fixed
by the fact that role cards need them to render.

**Art cost — needs a decision.** D12's whole point was 4 bodies + 4 race overlays
instead of 16 characters. Gender multiplies whichever layer it touches:

- **Cosmetic only** (a label, pronouns in text, no visual change) — zero art cost.
- **A feature overlay**, like race — hair and detail differences composited onto
  the same body. Adds one overlay set, not new bodies. Cheap.
- **A different body silhouette** — doubles the body count, 4 → 8, and every race
  overlay must then anchor correctly against both. This is the expensive option.

**Gender is mechanically targetable.** Like race (D12), there will be **enemy
cards that attack based on gender**. So gender is a real queryable property that
card effects read — not a display-only label like `role` (D10).

Race and gender targeting together are the mechanical home of the
**Discrimination** attack type from the enemy taxonomy, which is already mapped to
**unblockable** — damage that ignores defences and has no counter. That gives both
fields one coherent purpose rather than two ad-hoc special cases.

**Open:** which of the three art models above, and what the gender options are.
Note these are independent questions — gender can be mechanically targetable while
being visually cosmetic.

Using cards as the selection UI reuses the card component and keeps the framing
consistent — the game is made of cards from the first screen onward.

### Screen 3 — Pet (RATIFIED)
Follows character creation. Three inputs, same shape as Screen 2:

1. **Name** — a text field.
2. **Type** — dog or cat.
3. **The pet itself** — the options within the chosen type are **cards**, and the
   player selects one.

Type is chosen before the pet cards, mirroring race-before-role on Screen 2.

Both creation screens therefore follow one pattern: **text field, then a narrowing
choice, then cards.** One component, one layout, twice.

### Screen 4 — Choose your cards (RATIFIED)
The player selects their cards. **The available pool is filtered by the class**
they resolved to on Screen 2.

Card-to-class breakdown is stubbed in **CARDS.md** — structure only, no content.

**Note: this deviates from D6.** Slay the Spire hands you a fixed starting deck;
it does not let you build one. Choosing your own cards up front is closer to a
constructed/TCG model. That is a legitimate change, but D6 is the stated
mechanical base, so it should be a deliberate deviation rather than drift.

### D15 — Deck economy (RATIFIED)

- **Collection cap: 20 cards.** The most a player can own.
- **Loadout: 10 cards.** You take exactly 10 into a room.
- **Hand limit: 10.**
- **Starting deck: 10 cards** — 5 attack, 4 defend, 1 power.
- **Card management happens only outside a room**, from a button on the map.
- **After each room:** three new cards are offered, **pick one — or heal instead.**

The interesting part is the 20-vs-10 gap: you own up to twenty and carry ten, so
choosing the loadout before each room is a real recurring decision, and it is
genuinely distinct from Spire (where the whole deck always comes with you).

#### Terminology (fixed)

- **Inventory** — 20 cards. Everything owned.
- **Loadout** — exactly 10. What is carried into a room. Not 9, not 11.

There is no separate "hand limit." That phrasing was an incorrect import from
Spire and is retired.

#### D16 — All 10 are always available (RATIFIED)

Inside a room, **all 10 loadout cards are available every turn**, playable in any
order, at any time.

There is **no deck, no draw pile, no discard pile, no shuffle**. Nothing is
hidden.

The only restrictions come from **the card itself**:
- **once per room** — usable a single time in that encounter
- **cooldown** — unavailable for N turns after use

This is the Darkest Dungeon fixed-loadout model, not the Spire draw model.

Why it fits: with no draw randomness, the player is always choosing the *right
answer to the question in front of them* rather than playing whatever they
happened to draw. For a game about interviews that is the more truthful loop —
you always have access to everything you know, and the difficulty is picking
correctly under pressure.

#### D4 reconciled

Resolved: **rest nodes are gone.** The heal-or-card choice follows every room, and
the ~15% cancel rolls every time. See D4.

#### Other open

- At 20 cards with one gained per room, the cap binds after ten rooms. Then what —
  swap one out, forced skip, or offers stop?
  Note D16 inverts Spire's logic here: a bigger inventory is never a dilution,
  only more options to pick a loadout from. So hitting the cap should be a *swap*
  prompt, not a punishment.
- Pool size per class.

### Map screen — continuing a run (RATIFIED)
**Continue Game goes to the map**, showing current progress down the line.

**Only the next room is selectable.** Cleared rooms are history — they display
their camp icon and enemy name (D5) but cannot be clicked. Unrevealed rooms
cannot be clicked. Exactly one node is interactive at a time.

Implication now written into ARCHITECTURE: **the save point is the map.** A
resumed run never restores mid-encounter, so combat state is never serialised.
Closing the tab mid-interview costs that interview, not the run.

---

## 4. Proposed mechanics (UNDER DISCUSSION — not locked)

### M1 — Composure (the health bar)
Your resource. Drains from interviewer attacks and from some of your own risky
plays. Does not reset between encounters (D4).

### M2 — Afflictions instead of death
At zero Composure you do not die — you acquire an **Affliction** that rewrites
your deck's behavior for the rest of the run (e.g. *Rambling*, *Defensive*,
*Desperate*, *Overexplaining*). Darkest Dungeon's stress-break system, adapted.
Funnier than a game-over and it extends the run instead of ending it.

### M3 — The Bullshit Meter (the signature mechanic)
Every card has a damage value and a **bullshit cost**. High-impact cards
("Cite a Metric I Made Up", "That Was Basically My Project", "Name-Drop") load
the meter. Past a threshold, an interviewer leans in: **"Tell me more about
that."** If you cannot back the claim up with a supporting card, you take heavy
damage.

Note: this no longer connects to D5. Enemies never return, so any callback to an
earlier claim has to come from the *current* room's enemies, not a past one.

### M4 — Archetypes with tells
Each interviewer has a hidden preference. The same card lands differently
depending on who is across the table. Tells are surfaced through portrait
reactions and dialogue. Implementation is a multiplier table; perceived depth is
much larger than the code.

Draft roster: The Recruiter Screen (tutorial), The Culture Fit Bro, The Pedant,
The Silent Nodder (takes no action; your Composure drains while it stares), The
Panel (three at once, each with a different weakness), and a final boss.

### M5 — Outcome as score, not win/lose
The run does not end in victory or defeat. It ends in an **offer**, on a ladder:
*"We'll be in touch"* → *Junior* → *Mid* → *Senior* → *Staff*. Gives the game a
score, a joke, and a replay hook in one system.

---

## 5. Scope cut line

**In:** dungeon entrance screen, one corridor, 4–5 encounters, ~30–40 cards,
one card draft between encounters, Composure + Bullshit meters, afflictions,
offer-ladder ending, title screen.

**Out (do not build):** map branching, shops, relics, meta-progression between
runs, multiplayer, save files, settings menus, more than one corridor.

---

## 6. Demo notes (NOT design constraints)

**The 5-minute cap does not drive design.** Design and build the game. The
submission requirement is a *presentation* problem — show a slice, start from a
prepared state, cut the demo where it makes sense — and it is solved at demo time,
not by shrinking the game.

Retained only as presentation reminders, none of which constrain systems:

- No tutorial gate before the player is playing.
- Card text legible at a glance.
- Fast restart from the ending screen.

Superseded by D11's revision: the earlier "full run under 4 minutes" target and
the 5-encounters × 4-turns × hand-of-3 pacing math were demo-derived and are no
longer binding.

---

## 7. Resolved forks

- **Cards, not a skill tree.** Resolved by D6.
- **Positional ranks.** Cut — D6 takes style from Darkest Dungeon, not combat.
- **Energy per turn.** Adopted from Spire per D6.
- **Draft between encounters.** Adopted from Spire per D6.
- **Multiplayer.** Permanently out — D8.
- **Campfires / rest nodes.** OUT — D4. The heal-or-card choice follows every
  room instead, so every node is a room.
- **Map structure.** Custom single straight line — D1.

## 8. Open questions

- ~~Engine / library~~ — RESOLVED: React + Tailwind, localStorage, no backend.
  See ARCHITECTURE.md §1.
- Classes: what they are and how many. Under discussion.
- Whether the Bullshit Meter (M3) survives as the signature mechanic.
- Ally scenes: reward for doing well, or mercy for doing badly? (D9)
- Exact heal-cancel rate — tune against the final rest-node count (D4).
- Deck / encounter / turn counts — now driven by what the game needs, not by a
  5-minute cap (see §6).
- Narrator voice-over: Darkest Dungeon's most famous feature, and a large
  Most-Creative asset. Cost vs. payoff not yet assessed.
