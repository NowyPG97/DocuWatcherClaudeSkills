---
name: github-project-tasks
description: Use when working on a task tracked in the DocuWatcher GitHub Project board (owner NowyPG97, project number 1, items keyed T-XXX) and you need to fetch its current state before starting, or update its Status/Priority/Size/Area/Codebase/etc. as work progresses — "pobierz zadanie z GitHub", "odśwież zadanie", "zacznij zadanie T-220", "oznacz jako In progress", "przejdź zadanie do Done", "zaktualizuj status w projekcie", "zarządzaj cyklem życia zadania", "GitHub Project item update", "gh project item-edit". Not for repo-level GitHub Issues workflow (branching, PRs, code review) — this is specifically about the Project board fields/lifecycle.
version: 2.0.0
---

# GitHub Project Tasks — pobieranie i aktualizacja zadań

## Cel

Ustandaryzować sposób, w jaki Claude Code wchodzi w interakcję z tablicą
**GitHub Projects** DocuWatcher (`NowyPG97` / projekt nr 1):
pobranie świeżego stanu zadania przed rozpoczęciem pracy oraz zarządzanie
jego cyklem życia (status i inne pola) w trakcie i po zakończeniu realizacji.
Zawsze przez te same skrypty — nigdy przez ręcznie sklejane zapytania
GraphQL czy zgadywanie ID pól.

Tablica jest **jedynym źródłem prawdy** o zadaniach. Wszystkie tickety z
`tickets.md`/`PROGRESS.md` zostały zmigrowane 2026-09-28; te pliki leżą w
`Archiwum/` i są nieaktualne — nie czytaj ich jako stanu zadań.

## Kiedy używać

- Użytkownik prosi o rozpoczęcie/kontynuowanie konkretnego zadania z tablicy
  (np. "zajmij się T-220", "co jest do zrobienia w module mass-balance").
- Trzeba potwierdzić aktualny stan zadania przed rozpoczęciem pracy (ktoś mógł
  zmienić status/priorytet od czasu ostatniego odczytu).
- Praca nad zadaniem się kończy (albo przechodzi w fazę review) i status na
  tablicy powinien to odzwierciedlać.
- Trzeba przejrzeć listę zadań o danym statusie/module, żeby zaplanować kolejność pracy.

## Wymagania wstępne

Skrypty korzystają z `gh` CLI (zainstalowany w `C:\Program Files\GitHub CLI`,
musi być zalogowany) oraz z `node`. Do **odczytu** wystarczy scope
`read:project`. Do **zapisu** (zmiana statusu/pól) token musi mieć scope
`project` (pełny, nie tylko read).

Przed pierwszą próbą zapisu sprawdź:

```bash
gh auth status
```

Jeśli w `Token scopes` nie ma `project` (tylko `read:project`), **nie da się
zapisywać** — poinformuj o tym użytkownika i poproś o dogranie scope
(interakcja w przeglądarce, musi to zrobić użytkownik — nie próbuj obejścia):

```bash
gh auth refresh -s project -h github.com
```

`reference/field-map.json` jest commitowany w repo skilli. Jeśli go brakuje
albo zmieniono pola na tablicy — patrz [`reference/SETUP.md`](reference/SETUP.md).

## Kluczowe pojęcia

- **Key** (np. `T-220`) — czytelny identyfikator zadania, pole tekstowe w
  projekcie. To po nim identyfikujemy zadania w rozmowie z użytkownikiem,
  **nie** po numerze GitHub Issue (wszystkie itemy to Draft Issues bez
  numeru). Numeracja jest **jedną wspólną sekwencją** dla całego DocuWatcher
  (backend + frontend) — nowy Key to najwyższy istniejący numer + 1.
- **Item ID** (`PVTI_...`) i **Draft ID** (`DI_...`) — wewnętrzne GraphQL ID.
  Skrypty same je znajdują po Key — nigdy nie wpisuj ich ręcznie.
- **Field map** (`reference/field-map.json`) — wygenerowana mapa ID pól i
  opcji single-select. Nie edytuj ręcznie; regeneruj `refresh-field-map.js`.

## Pola tablicy (stan rzeczywisty)

| Pole | Typ | Wartości |
|---|---|---|
| `Status` | single-select | `Backlog`, `Ready`, `In progress`, `In review`, `Done` |
| `Key` | tekst | `T-<numer>` |
| `Codebase` | single-select | `backend` (`DeadlineGuradBackend`), `frontend` (`akademiasaas-boilerplate`), `both` |
| `Area` | single-select | `mass-balance-kzr`, `assets`, `deadlines`, `documents`, `auth`, `notifications`, `infra` |
| `Priority` | single-select | `P0`, `P1`, `P2` |
| `Size` | single-select | `XS`, `S`, `M`, `L`, `XL` |
| `Depends on` | tekst | Key(e) zależności, rozdzielone przecinkiem/średnikiem |
| `Estimate` | liczba | opcjonalnie |
| `Start date` / `Target date` | data | opcjonalnie, `YYYY-MM-DD` |

**Uwaga:** `Repository` to *wbudowane* pole GitHuba (repo powiązanego
issue/PR) — puste dla draftów i nieedytowalne. Repo zadania wskazuje `Codebase`.

### Cykl życia statusu

```
Backlog / Ready ──(start pracy)──▶ In progress ──(push brancha)──▶ In review ──(potwierdzenie użytkownika)──▶ Done
```

- `Backlog` i `Ready` — oba oznaczają "można zaczynać" (większość zadań żyje
  w `Backlog`; `Ready` = świadomie wybrane na najbliższą pracę).
- `In progress` — ktoś (lub sesja Claude) realnie nad tym pracuje.
- `In review` — kod wypchnięty na branch zadania, czeka na ocenę/merge przez
  użytkownika.
- `Done` — tylko po wyraźnym potwierdzeniu użytkownika.

## Workflow

Wszystkie skrypty wywołuj przez `${CLAUDE_SKILL_DIR}` — rozwija się do
katalogu tego skilla niezależnie od bieżącego katalogu roboczego (przy
realizacji zadań będzie to backend lub frontend, nie repo skilli).

1. **Przed rozpoczęciem zadania** — zawsze odśwież jego stan z GitHub, nie
   ufaj pamięci:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fetch-task.js" T-220
   node "${CLAUDE_SKILL_DIR}/scripts/check-readiness.js" T-220
   ```
   `check-readiness.js` zwraca JSON i kod wyjścia `0` gdy gotowe (status
   `Backlog`/`Ready` + wszystkie zależności `Done`), `2` gdy nie; `reason`:
   `already_in_progress`, `in_review`, `already_done`,
   `blocked_by_dependencies`, `unknown_status:<x>`.

2. **Rozpoczynając pracę**:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/set-status.js" T-220 "In progress"
   ```

3. **W trakcie** (opcjonalnie) — zmiana innych pól:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/set-field.js" T-220 Priority P1
   ```

4. **Po wypchnięciu brancha** — `"In review"`. **Po potwierdzeniu
   użytkownika** — `Done`. Nie ustawiaj `Done` na wyrost.

5. **Planowanie/przegląd**:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/list-tasks.js" Backlog
   ```

6. **Aktualizacja tytułu/opisu** (skrypt sam wybiera właściwe ID draftu):
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/update-content.js" T-220 --body-file nowy-opis.md
   ```

## Skrypty

| Skrypt | Do czego |
|---|---|
| `fetch-task.js <KEY>` | Pełny, świeży JSON jednego zadania po Key |
| `list-tasks.js [status]` | Skrócona lista zadań, opcjonalnie filtrowana po statusie |
| `check-readiness.js <KEY>` | Czy zadanie gotowe do startu: status Backlog/Ready + zależności Done |
| `set-status.js <KEY> <status>` | Zmiana pola Status |
| `set-field.js <KEY> <pole> <wartość>` | Zmiana innego pola (Priority, Size, Area, Codebase, Key, Depends on, Estimate, Start date, Target date) |
| `update-content.js <KEY> [--title] [--body\|--body-file]` | Aktualizacja tytułu/opisu zadania |
| `refresh-field-map.js` | Regeneruje `reference/field-map.json` |

Domyślnie skrypty celują w `NowyPG97` / projekt nr `1` (nadpisywalne
zmiennymi `GH_PROJECT_OWNER` i `GH_PROJECT_NUMBER`). Inny skill w tym pluginie
wywołuje je przez `${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/...`.

## Zasady

1. **Zawsze fetch przed update, jeśli minęło więcej niż chwila.** Ktoś inny
   mógł ręcznie zmienić status — nie nadpisuj w ciemno.
2. **Status zmieniaj świadomie.** `In progress` ustawiaj, gdy realnie
   zaczynasz pracę, nie przy każdej wzmiance o zadaniu.
3. **Nigdy nie wpisuj ręcznie ID pól/opcji/itemów.** Zawsze przez
   `lib.js`/`field-map.json`.
4. **Błąd uprawnień (brak scope `project`) — nie obchodź** (np. surowym
   `gh api graphql` z innym tokenem); zgłoś użytkownikowi.
5. **Nie zgaduj wartości single-select.** Przy złej wartości skrypt wypisze
   dozwolone. Nowe opcje (np. `Area` dla nowego modułu) dodaje się świadomie
   na tablicy, potem `refresh-field-map.js` + commit `field-map.json`.
6. **Nowy Key kontynuuje sekwencję `T-XXX`** — sprawdź najwyższy numer na
   tablicy przed założeniem zadania.

## Czego unikać

- Nie mieszaj tego skilla z workflow realnych GitHub Issues/PR — ten skill
  odpowiada wyłącznie za pola na tablicy projektu.
- Nie ustawiaj `Done`, dopóki kryteria ukończenia z opisu zadania nie są
  spełnione i użytkownik tego nie potwierdził.
- Nie zakładaj repo zadania bez sprawdzenia pola `Codebase` — na nim opiera
  się dobór skilla implementacyjnego w `github-task-delivery`.
- Nie czytaj `tickets.md`/`PROGRESS.md` jako aktualnego stanu — to archiwum.
