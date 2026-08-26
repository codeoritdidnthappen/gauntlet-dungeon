# Gauntlet Dungeon

A turn-based card battler about surviving a job interview loop, played as a
descent into a dungeon. You are the candidate. The cards are interview tactics.
The monsters are interviewers.

**Play:** [gauntlet.daviddean.dev](https://gauntlet.daviddean.dev)

## Run locally

Requires Node 22+.

```bash
git clone git@github.com:codeoritdidnthappen/gauntlet-dungeon.git
cd gauntlet-dungeon
npm install
npm run dev
```

Then open http://localhost:3486.

```bash
npm run build     # production build to dist/
npm run preview   # serve the build on 3486
```

## Layout

```
src/          React app — screens, audio, save system
data/         Cards, enemies, character options (JSON)
assets/       Art and backgrounds, imported as modules
audio/        Music
public/       Static files served as-is (favicon)
```

## Docs

| File | Contents |
|---|---|
| `PRD.md` | Design decisions, screens, mechanics |
| `ARCHITECTURE.md` | Stack, state, screen flow, persistence |
| `SCHEMA.md` | Card and character data shapes |
| `CARDS.md` | Card design intent |
| `CHANGES.log` | Every decision, dated, with rationale |

## Saves

Progress lives in browser localStorage — no accounts, no backend. Clearing
browser data deletes the game.
