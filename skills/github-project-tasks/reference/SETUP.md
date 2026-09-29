# Konfiguracja tablicy GitHub Projects

Projekt docelowy: `https://github.com/users/NowyPG97/projects/1` (owner
`NowyPG97`, projekt nr `1`). Tablica jest skonfigurowana, a 230 ticketów z
`tickets.md`/`PROGRESS.md` zmigrowano 2026-09-28. Ten plik opisuje, co zrobić
na **nowej maszynie** albo po **zmianie pól** tablicy.

## 1. GitHub CLI

```powershell
winget install --id GitHub.cli
```

Instalator kładzie `gh` w `C:\Program Files\GitHub CLI`. Jeśli `gh` nie jest
widoczny w bieżącej powłoce, otwórz nową (PATH odświeża się dopiero w nowym
procesie).

Zaloguj się ze scope'em `project` (odczyt + zapis pól tablicy):

```bash
gh auth login
gh auth refresh -s project -h github.com
gh auth status   # Token scopes musi zawierać `project`, nie tylko `read:project`
```

## 2. Zmiana pól na tablicy

Po dodaniu/zmianie pola albo opcji single-select (np. nowa wartość `Area`):

```bash
node "${CLAUDE_SKILL_DIR}/scripts/refresh-field-map.js"
```

i **zacommituj** zaktualizowany `reference/field-map.json` do repo
`DocuWatcherClaudeSkills`. Plugin po instalacji leży w cache Claude Code,
który jest nadpisywany przy aktualizacji — plik wygenerowany tylko lokalnie
zniknie.

Jeśli zmiana dotyczy pola `Status` albo nazw pól zwykłych (tekst/liczba/data),
zaktualizuj też:

- `STATUS` i `EDITABLE_PLAIN_FIELDS` w [`../scripts/lib.js`](../scripts/lib.js),
- tabelę pól i cykl życia w [`../SKILL.md`](../SKILL.md),
- kroki statusu w [`../../github-task-delivery/SKILL.md`](../../github-task-delivery/SKILL.md).

Rozjazd między dokumentacją a tablicą psuje `check-readiness.js`, na którym
opiera się start każdego zadania.
