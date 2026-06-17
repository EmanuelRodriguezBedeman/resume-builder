# Resume Builder

Personal web app for editing a CV that mirrors the user's existing PDF format and exports it through React-PDF. See [`CONTEXT.md`](./CONTEXT.md) for the domain glossary and [`docs/adr/`](./docs/adr/) for architectural decisions.

The `claude-skills/` directory holds Matt Pocock's skill plugin (sourced from `mattpocock/skills` on GitHub), registered as a local marketplace via `.claude/settings.json`. Those files are tooling for Claude Code, not Resume Builder code.

## Agent skills

### Issue tracker

Issues live in GitHub at `EmanuelRodriguezBedeman/resume-builder`. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical labels (defaults): `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.


### .env files

You cannot read or modify .env vars. If something must be modified, it must be indicated to the user to implement the change.