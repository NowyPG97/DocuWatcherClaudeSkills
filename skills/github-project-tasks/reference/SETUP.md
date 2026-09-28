# Konfiguracja tablicy GitHub Projects — jednorazowo

Ten plik opisuje kroki potrzebne **raz**, zanim skrypty w `../scripts/` zaczną
działać. Projekt docelowy: `https://github.com/users/NowyPG97/projects/1`
(owner `NowyPG97`, projekt nr `1`).

## 1. Zainstaluj i zaloguj GitHub CLI

Ta maszyna (Windows) **nie ma jeszcze zainstalowanego `gh`** — sprawdzone
podczas tworzenia tego skilla (`gh` nieznane zarówno w PowerShell, jak i Git
Bash). Zainstaluj przed pierwszym użyciem:

```powershell
winget install --id GitHub.cli
```

Potem zaloguj się ze scope'em `project` od razu (odczyt + zapis pól tablicy):

```bash
gh auth login
gh auth refresh -s project -h github.com
```

Sprawdź wynik:

```bash
gh auth status
```

`Token scopes` musi zawierać `project` (nie tylko `read:project`), inaczej
`set-status.js`/`set-field.js` będą zwracać błąd uprawnień.

## 2. Skonfiguruj pola projektu na GitHub

Wejdź na tablicę (`https://github.com/users/NowyPG97/projects/1`) → ikona
"+" przy nagłówkach kolumn / Settings → dodaj pola, jeśli ich jeszcze nie
ma (poza wbudowanymi `Title`, `Status`, `Assignees`, `Labels`):

| Pole | Typ | Opcje |
|---|---|---|
| `Key` | Text | np. `T-220` — kontynuacja numeracji z `tickets.md` |
| `Repository` | Single select | `backend`, `frontend`, `both` |
| `Area` | Single select | zacznij od: `mass-balance-kzr`, `assets`, `deadlines`, `documents`, `auth`, `notifications`, `infra` — dodawaj kolejne w miarę potrzeb |
| `Priority` | Single select | `P0`, `P1`, `P2`, `P3` |
| `Depends on` | Text | Key(e) zależności, rozdzielone przecinkiem/średnikiem |
| `Estimate` | Number | opcjonalnie |
| `Start` | Date | opcjonalnie |
| `Target` | Date | opcjonalnie |

Domyślny wbudowany `Status` w GitHub Projects zwykle ma opcje `Todo`,
`In Progress`, `Done` — jeśli Twój ma inne/dodatkowe (np. `Backlog`,
`In Review`), zaktualizuj [`../SKILL.md`](../SKILL.md) i
[`../../github-task-delivery/SKILL.md`](../../github-task-delivery/SKILL.md),
żeby się zgadzały, zamiast zostawiać rozjazd między dokumentacją a
rzeczywistością.

## 3. Wygeneruj field-map.json

Dopiero teraz (pola istnieją na tablicy) uruchom:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/refresh-field-map.js"
```

Powinno to zapisać `reference/field-map.json` z ID wszystkich pól i opcji.
Uruchom ponownie za każdym razem, gdy zmienisz konfigurację pól na tablicy.

## 4. Migracja z tickets.md / PROGRESS.md

Dotychczasowe tickety (np. `kzr-mass-balance-tickets.md`,
`PROGRESS.md` w `C:\DocuWatcherWorkspace`) mają numerację `T-XXX` i pola
`Zależności`, opis, kryteria akceptacji. Przy migracji pojedynczego ticketu
na tablicę:

1. Utwórz Draft Issue z tytułem = tytuł ticketu.
2. Ustaw `Key` = istniejący numer `T-XXX` (nie nadawaj nowego — zachowaj
   ciągłość z historią commitów, które już odwołują się do tego numeru).
3. Przenieś treść (opis, kryteria "Done when", scenariusze testowe) do opisu
   itemu (`update-content.js ... --body-file`).
4. Ustaw `Status` zgodnie z rzeczywistym stanem (✅ w `PROGRESS.md` → `Done`,
   nierozpoczęte → `Todo`, w toku → `In Progress`).
5. Ustaw `Repository`/`Area`/`Depends on` na podstawie treści ticketu.

Nie trzeba migrować wszystkiego naraz — dopóki oba źródła współistnieją,
traktuj tablicę jako źródło prawdy dla zadań już przeniesionych, a
`tickets.md`/`PROGRESS.md` dla reszty; w razie wątpliwości zapytaj
użytkownika, które źródło jest aktualne dla danego zadania.
