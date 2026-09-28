---
name: github-project-tasks
description: Use when working on a task tracked in the DocuWatcher GitHub Project board (owner NowyPG97, project number 1, items keyed T-XXX) and you need to fetch its current state before starting, or update its Status/Priority/Area/Repository/etc. as work progresses — "pobierz zadanie z GitHub", "odśwież zadanie", "zacznij zadanie T-220", "oznacz jako In Progress", "przejdź zadanie do Done", "zaktualizuj status w projekcie", "zarządzaj cyklem życia zadania", "GitHub Project item update", "gh project item-edit". Not for repo-level GitHub Issues workflow (branching, PRs, code review) — this is specifically about the Project board fields/lifecycle.
version: 1.0.0
---

# GitHub Project Tasks — pobieranie i aktualizacja zadań

## Cel

Ustandaryzować sposób, w jaki Claude Code wchodzi w interakcję z tablicą
**GitHub Projects** DocuWatcher (`NowyPG97` / projekt nr 1):
pobranie świeżego stanu zadania przed rozpoczęciem pracy oraz zarządzanie
jego cyklem życia (status i inne pola) w trakcie i po zakończeniu realizacji.
Zawsze przez te same skrypty — nigdy przez ręcznie sklejane zapytania
GraphQL czy zgadywanie ID pól.

Tablica jest docelowym następcą `tickets.md`/`PROGRESS.md` (np.
`kzr-mass-balance-tickets.md` + `PROGRESS.md` w
`C:\DocuWatcherWorkspace`) — dopóki migracja nie jest ukończona, oba źródła
mogą chwilowo współistnieć; w razie rozbieżności zapytaj użytkownika, które
jest aktualne, zamiast zgadywać.

## Kiedy używać

- Użytkownik prosi o rozpoczęcie/kontynuowanie konkretnego zadania z tablicy
  (np. "zajmij się T-220", "co jest do zrobienia w module mass-balance").
- Trzeba potwierdzić aktualny stan zadania przed rozpoczęciem pracy (ktoś mógł
  zmienić status/priorytet od czasu ostatniego eksportu).
- Praca nad zadaniem się kończy (albo przechodzi w fazę review) i status na
  tablicy powinien to odzwierciedlać.
- Trzeba przejrzeć listę zadań o danym statusie/module, żeby zaplanować kolejność pracy.

## Wymagania wstępne

Skrypty korzystają z `gh` CLI (musi być zainstalowany i zalogowany) oraz z
`node`. Do **odczytu** wystarczy scope `read:project`. Do **zapisu** (zmiana
statusu/pól) token musi mieć scope `project` (pełny, nie tylko read).

Przed pierwszą próbą zapisu sprawdź:

```bash
gh auth status
```

Jeśli w `Token scopes` nie ma `project` (tylko `read:project`), **nie da się
zapisywać** — poinformuj o tym użytkownika i poproś o dogranie scope:

```bash
gh auth refresh -s project -h github.com
```

To wymaga interakcji w przeglądarce, więc musi to zrobić użytkownik — nie
próbuj tego obejść.

**Jednorazowo, przed pierwszym użyciem tego skilla:** projekt (`NowyPG97` /
nr 1) trzeba skonfigurować i wygenerować `reference/field-map.json` — patrz
[`reference/SETUP.md`](reference/SETUP.md). Bez tego kroku wszystkie skrypty
poza `fetch-task.js`/`list-tasks.js` (te dwa nie wymagają field-map) zwrócą
błąd "Brak field-map.json".

## Kluczowe pojęcia

- **Key** (np. `T-220`) — czytelny identyfikator zadania, ustawiony jako pole
  tekstowe w projekcie. To po nim identyfikujemy zadania w rozmowie z
  użytkownikiem, **nie** po numerze GitHub Issue (item może być Draft Issue
  bez numeru). Numeracja jest **jedną wspólną sekwencją** dla całego
  DocuWatcher (backend + frontend + inne moduły), tak jak dotychczas w
  `tickets.md` — kontynuuj od najwyższego istniejącego numeru, nie zaczynaj
  osobnej sekwencji per moduł/repo.
- **Item ID** (`PVTI_...`) — wewnętrzny GraphQL ID pozycji w projekcie,
  wymagany przez `gh project item-edit --id`. Skrypty same go znajdują po
  Key — nigdy nie wpisuj go ręcznie.
- **Field map** (`reference/field-map.json`) — zcache'owana mapa ID pól i
  opcji single-select dla tego projektu (Status, Priority, Area,
  Repository...). Odśwież ją (`refresh-field-map.js`), jeśli w projekcie
  dodano/zmieniono pole lub wartości statusu — inaczej skrypty będą się
  odwoływać do nieaktualnych ID. Plik jest wygenerowany, nie ręcznie
  utrzymywany — nie edytuj go bezpośrednio.
- Status ma dokładnie 3 wartości: `Todo` → `In Progress` → `Done`.

## Proponowany schemat pól (do skonfigurowania na tablicy)

Zobacz [`reference/SETUP.md`](reference/SETUP.md) po dokładne instrukcje
konfiguracji. W skrócie, poza wbudowanymi (`Title`, `Status`, `Assignees`,
`Labels`...) projekt powinien mieć:

| Pole | Typ | Wartości |
|---|---|---|
| `Key` | tekst | `T-<numer>`, ciągła sekwencja z `tickets.md` |
| `Repository` | single-select | `backend` (`DeadlineGuradBackend`), `frontend` (`akademiasaas-boilerplate`), `both` |
| `Area` | single-select | np. `mass-balance-kzr`, `assets`, `deadlines`, `auth`, `infra` — dodawaj opcje w miarę powstawania nowych modułów |
| `Priority` | single-select | `P0`, `P1`, `P2`, `P3` |
| `Depends on` | tekst | Key(e) zależności, rozdzielone przecinkiem |
| `Estimate` | liczba | opcjonalnie, w godzinach lub punktach |
| `Start` / `Target` | data | opcjonalnie |

## Workflow

Wszystkie skrypty wywołuj przez `${CLAUDE_SKILL_DIR}` — to zawsze
rozwija się do katalogu tego skilla, niezależnie od tego, w jakim
repozytorium/katalogu roboczym aktualnie pracuje Claude (a przy realizacji
zadań programistycznych będzie to katalog docelowego projektu — backendu lub
frontendu DocuWatcher — nie repo skilli). Nigdy nie zakładaj ścieżki
względnej typu `skills/github-project-tasks/...` liczonej od bieżącego
katalogu — to zadziała tylko przypadkiem.

1. **Przed rozpoczęciem zadania** — zawsze odśwież jego stan z GitHub, nie
   ufaj wcześniejszemu eksportowi/pamięci:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fetch-task.js" T-220
   ```
   Sprawdź `status`, `priority`, treść (`content.body`) i ewentualne
   zależności (`Depends on`) zanim zaczniesz.

2. **Rozpoczynając pracę** — ustaw status na `In Progress`, żeby tablica
   odzwierciedlała rzeczywistość (nie zostawiaj tego na koniec):
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/set-status.js" T-220 "In Progress"
   ```

3. **W trakcie** (opcjonalnie) — jeśli w toku pracy zmienia się np.
   `Priority` czy `Area`, aktualizuj przez ten sam mechanizm:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/set-field.js" T-220 Priority P1
   ```

4. **Po zakończeniu** — dopiero gdy praca faktycznie jest skończona (kod
   scalony do brancha zadania / kryteria "Done when" spełnione), przełącz
   status:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/set-status.js" T-220 Done
   ```
   Nie ustawiaj `Done` na wyrost — jeśli zadanie czeka na review/deploy,
   zostaw `In Progress` i powiedz o tym użytkownikowi zamiast zgadywać.

5. **Planowanie/przegląd** — do wylistowania zadań wg statusu:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/list-tasks.js" "In Progress"
   ```

6. **Sprawdzenie gotowości zadania** (status + zależności) — zwraca JSON i
   kod wyjścia `0` gdy gotowe, `2` gdy zablokowane/zajęte/zrobione:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/check-readiness.js" T-220
   ```

7. **Aktualizacja tytułu/opisu zadania** (Draft Issue lub prawdziwy Issue —
   skrypt sam rozpoznaje typ i użyje odpowiedniej mutacji):
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/update-content.js" T-220 --body-file nowy-opis.md
   ```

## Skrypty

| Skrypt | Do czego |
|---|---|
| `fetch-task.js <KEY>` | Pełny, świeży JSON jednego zadania po Key |
| `list-tasks.js [status]` | Skrócona lista zadań, opcjonalnie filtrowana po statusie |
| `check-readiness.js <KEY>` | Czy zadanie gotowe do startu: status Todo + wszystkie zależności Done |
| `set-status.js <KEY> <status>` | Zmiana pola Status (Todo/In Progress/Done) |
| `set-field.js <KEY> <pole> <wartość>` | Zmiana dowolnego innego pola (Priority, Area, Repository, Estimate, Start, Target, ...) |
| `update-content.js <KEY> [--title] [--body\|--body-file]` | Aktualizacja tytułu/opisu zadania (Draft Issue lub powiązany Issue) |
| `refresh-field-map.js` | Regeneruje `reference/field-map.json`, gdy zmieniła się konfiguracja pól projektu |

Domyślnie skrypty celują w `NowyPG97` / projekt nr `1`. Da się to nadpisać
zmiennymi środowiskowymi `GH_PROJECT_OWNER` i `GH_PROJECT_NUMBER`, jeśli
kiedyś trzeba będzie obsłużyć inny projekt tym samym skillem.

Inny skill w tym pluginie, który chce wywołać te skrypty, odwołuje się do
nich przez `${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/...` (skille
leżą jako rodzeństwo w katalogu `skills/`).

## Zasady

1. **Zawsze fetch przed update, jeśli minęło więcej niż chwila.** Ktoś inny
   mógł ręcznie zmienić status w tym czasie — nie nadpisuj w ciemno.
2. **Status zmieniaj świadomie, nie automatycznie na starcie każdej wiadomości.**
   `In Progress` ustawiaj, gdy realnie zaczynasz pracę nad danym zadaniem, nie
   przy każdej wzmiance o nim.
3. **Nigdy nie wpisuj ręcznie ID pól/opcji/itemów w rozmowie czy komendach ad
   hoc.** Zawsze przez `lib.js`/`field-map.json` — to jedyne źródło prawdy dla
   tych ID, żeby nie rozjechały się między zadaniami.
4. **Jeśli `set-status.js`/`set-field.js` zwróci błąd uprawnień (brak scope
   `project`), nie próbuj obejścia** (np. surowe `gh api graphql` z innym
   tokenem) — zgłoś to użytkownikowi.
5. **Nie zgaduj wartości pól single-select.** Jeśli podana wartość nie
   pasuje do żadnej opcji, skrypt wypisze dozwolone wartości — użyj jednej
   z nich, nie twórz nowej ad hoc (dodanie nowej opcji `Area` dla nowego
   modułu jest w porządku, ale rób to świadomie na tablicy, nie przez
   przypadkową literówkę w komendzie).
6. **Nowy Key kontynuuje istniejącą sekwencję `T-XXX`.** Przed założeniem
   nowego zadania sprawdź najwyższy istniejący numer (na tablicy, a dopóki
   migracja trwa — również w `tickets.md`), żeby uniknąć kolizji numeracji.

## Czego unikać

- Nie mieszaj tego skilla z workflow realnych GitHub Issues (branch, PR,
  code review) — jeśli zadanie ma powiązane issue/PR w repo, ich cyklem
  życia zajmują się standardowe narzędzia (`gh issue`, `gh pr`), a ten skill
  odpowiada wyłącznie za pola na tablicy projektu.
- Nie ustawiaj `Done`, dopóki kryteria "Done when" z opisu zadania nie są
  faktycznie spełnione.
- Nie zakładaj, który z dwóch repozytoriów (`DeadlineGuradBackend` /
  `akademiasaas-boilerplate`) dotyczy zadania bez sprawdzenia pola
  `Repository` — o to opiera się dobór skilla implementacyjnego w
  `github-task-delivery`.
