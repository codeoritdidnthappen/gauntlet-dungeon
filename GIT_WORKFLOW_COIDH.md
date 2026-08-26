# Git workflow

Follow these rules for all work in this repo.

- **Never commit directly to `main`.** All changes land on a dedicated branch and reach `main`
  only via a pull request.
- **One branch per logical unit of work.** Multiple commits per branch are fine and encouraged
  (small, focused commits). Use [Conventional Commits](https://www.conventionalcommits.org)
  for messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`).
- **Branch naming** — Conventional prefix + kebab-case description:
  - `feat/<description>` — new feature
  - `fix/<description>` — bug fix
  - `chore/<description>` — tooling, config, deps, housekeeping
  - `docs/<description>` — docs only
  - `refactor/<description>` — behavior-preserving code change
  - `test/<description>` — tests only
  - `perf/<description>` — performance work
- **Do NOT reuse an existing branch** (e.g. a prior feature branch) for new or unrelated work
  **without asking first.** Default to cutting a fresh branch off up-to-date `main`.
- **Merge style:** rebase merge, delete the branch on merge
  (`gh pr merge --rebase --delete-branch`). Individual conventional commits land on `main`;
  history stays linear.

## Required local setup (per clone)

The one piece of machine-local setup the remote depends on is an SSH host alias: `origin` is
`git@github_coidh:codeoritdidnthappen/gauntlet-dungeon.git`, so `~/.ssh/config` needs a matching
`Host github_coidh` entry pointing at `github.com` with the right key. Verify with
`git remote -v` and `ssh -T git@github_coidh`.

## GitHub CLI quirk

Remotes use an SSH host alias (here, `git@github_coidh:...`), which `gh` does not recognize as
GitHub — a bare `gh pr list` fails with "none of the git remotes configured for this repository
point to a known GitHub host." **Every `gh` command must name the repo explicitly**, but *how*
depends on the subcommand:

- Commands acting on things **inside** a repo (`gh pr`, `gh issue`, `gh run`) take `-R`:

  ```
  gh pr create -R codeoritdidnthappen/gauntlet-dungeon ...
  gh pr merge  -R codeoritdidnthappen/gauntlet-dungeon ...
  ```

- `gh repo` commands take the repo **positionally** — they have no `-R` flag, and passing one
  fails with `unknown shorthand flag: 'R'`:

  ```
  gh repo view codeoritdidnthappen/gauntlet-dungeon
  ```

## Delivery loop

Report progress at each step as usual.

1. Sync: `git checkout main && git fetch --prune && git pull`.
2. Cut a fresh branch off `main` (naming rules above).
3. Implement in small, focused conventional commits.
4. Push and open a PR: `gh pr create -R codeoritdidnthappen/gauntlet-dungeon` with a summary of
   changes in the body.
5. Merge: `gh pr merge --rebase --delete-branch -R codeoritdidnthappen/gauntlet-dungeon`.
6. Sync `main` again (step 1), delete the local branch, and begin the next unit of work.

## Verification first

Never claim work is done without demonstrating it. Exercise the change directly — run it, read
the file back, observe the behavior — and report what you actually saw, not what you expect.
"Done" means the change was seen working, not "the code looks right."  Report failures
faithfully, with output.

## When to ask

Always ask first:

- Adding new dependencies.
- Deleting files or data; destructive git operations (`reset --hard`, `push --force`, ...).
- Changing the scope of the task, or reworking behavior that already merged.
- Anything touching credentials, secrets, API keys, or money.
- Reusing an existing branch for new work.
