---
name: github-task-delivery
description: Use when asked to implement/deliver a specific development task tracked as an item on the DocuWatcher GitHub Project board (e.g. "zrealizuj T-220", "weź T-233 z tablicy", "zajmij się zadaniem T-220", "wykonaj task X od początku do końca") — the full standardized lifecycle from claiming the task, through branching off main in the right repo (backend DeadlineGuradBackend or frontend akademiasaas-boilerplate, per the board's Codebase field), implementation, writing unit/integration/frontend tests, optional black-box verification, committing and pushing a feature branch, to moving the task to In review and closing it on GitHub after user confirmation. Not for ad hoc coding requests unrelated to a tracked board item, and not for merging/deploying to main — that is explicitly out of scope of this skill.
version: 2.0.0
---

# Realizacja zadania z tablicy GitHub (task delivery)

## Cel

Jeden, zawsze taki sam przebieg realizacji pojedynczego zadania z tablicy
GitHub Projects DocuWatcher — od odświeżenia jego stanu, przez branch,
implementację i testy, po zamknięcie zadania na tablicy — tak, żeby
niezależnie od tego kto (który Claude, kiedy) je realizuje, proces wyglądał
identycznie i nie było wątpliwości na jakim etapie jest zadanie.

Ten skill **orkiestruje**, ale nie duplikuje logiki innych skilli:

- [`github-project-tasks`](../github-project-tasks/SKILL.md) — cały odczyt/zapis tablicy (fetch, status, pola, treść)
- [`backend-development`](../backend-development/SKILL.md) — jak pisać kod w `DeadlineGuradBackend`
- [`frontend-development`](../frontend-development/SKILL.md) — jak pisać kod w `akademiasaas-boilerplate`
- [`blackbox-verification`](../blackbox-verification/SKILL.md) — weryfikacja na żywo, gdy zadanie tego wymaga
- skill `run` (wbudowany) — uruchomienie aplikacji lokalnie, jeśli trzeba

Skrypty tablicy wywołuj przez
`"${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/<skrypt>.js"`.

## Twarda zasada (nie do złamania)

**Zakaz mergowania zmian do brancha `main`.** Ten skill kończy się na pushu
brancha zadania do zdalnego repo. Merge do `main` (`git merge`,
`gh pr merge`, bezpośredni push na `main`) jest **poza zakresem tego
skilla** i nigdy nie jest wykonywany w jego ramach — niezależnie od tego, jak
bardzo wszystko wygląda na gotowe. O merge decyduje użytkownik, osobno. Dotyczy
obu repozytoriów.

## Kiedy używać

- Użytkownik prosi o realizację konkretnego zadania z Key z tablicy (np.
  "zrealizuj T-220").
- Trzeba przeprowadzić zadanie przez pełny cykl: branch → kod → testy →
  (opcjonalnie) black-box → commit/push → zamknięcie na tablicy.

Rzut oka na zadanie albo zmiana jednego pola ("jaki jest status T-220",
"ustaw priorytet na P1") — to zakres `github-project-tasks`, nie tego skilla.

## Zakres zadania a dług w kodzie

Kod DocuWatcher ma sporo długu (monolity typu `RegisterBatch.tsx`, lokalne
`@ExceptionHandler`, zduplikowane klienty HTTP). Skille implementacyjne każą
pisać **nowy** kod czysto — ale to nie jest licencja na przepisywanie
sąsiedniego kodu w ramach zadania. Obowiązuje jedna reguła:

1. **Reguła skauta tylko w plikach, które zadanie i tak zmienia.** Drobne
   porządki (wydzielenie funkcji, usunięcie duplikatu, poprawa typu, przeniesienie
   handlera do `GlobalExceptionHandler`) w plikach, które edytujesz — tak, jeśli
   są małe i pokryte testami.
2. **Wszystko większe → propozycja nowego zadania**, nie realizacja "przy
   okazji". Zapisz w podsumowaniu (krok 8) konkretną propozycję ticketu
   (tytuł, zakres, Codebase) i zapytaj, czy założyć go na tablicy.
3. **Brakujący fundament (np. wspólny `httpClient`, `QueryClientProvider`,
   MSW) to osobne zadanie fundamentowe**, nie efekt uboczny zadania
   funkcjonalnego. Jeśli skill implementacyjny wymaga fundamentu, którego
   jeszcze nie ma — zatrzymaj się i zapytaj użytkownika, czy najpierw zrobić
   zadanie fundamentowe, czy świadomie napisać kod po staremu (i zanotować dług).

## Warunki realizacji (Definition of Done)

Zadanie można uznać za gotowe do zamknięcia **tylko** gdy wszystko poniżej
jest prawdą jednocześnie:

1. Implementacja realizuje dokładnie kryteria ukończenia z treści zadania,
   bez pomijania punktów i bez wykraczania poza sekcję "NIE WCHODZI" / "Out of
   scope", jeśli istnieje.
2. Napisano wszystkie testy wymienione w zadaniu — unit, integracyjne i
   frontendowe/E2E, tam gdzie dotyczy.
3. Napisano dodatkowe testy, jeśli podczas realizacji okazało się, że są
   potrzebne (przypadek brzegowy, którego opis nie przewidział).
4. Pełny lokalny zestaw testów przechodzi na zielono (`./mvnw test` dla
   backendu, `pnpm precommit` dla frontendu).
5. Jeśli zadanie tego wymagało (Ty decydujesz) — wykonano weryfikację
   black-box i nie pozostały niewyjaśnione rozbieżności z intencją biznesową.
6. Stan zadania na tablicy (status, opis) jest spójny z tym, co zrobiono.

Jeśli którykolwiek punkt nie jest spełniony — nie przechodź do
commit/push/zamknięcia, wróć i dokończ.

## Workflow

### 0. Ustal repozytorium docelowe

DocuWatcher to **dwa oddzielne repozytoria**, nie monorepo:

| `Codebase` | Repo | Ścieżka lokalna | Stack |
|---|---|---|---|
| `backend` | `DeadlineGuradBackend` | `C:\DocuWatcherWorkspace\DeadlineGuradBackend` | Spring Boot / Java |
| `frontend` | `akademiasaas-boilerplate` | `C:\DocuWatcherWorkspace\akademiasaas-boilerplate` | React / TypeScript |

Repo wskazuje pole **`Codebase`** zadania (w JSON z `fetch-task.js`: klucz
`codebase`). Nie myl go z wbudowanym polem `Repository`, które dla draftów
jest puste. `both` albo brak wartości → oceń na podstawie treści; dla `both`
potrzebujesz **dwóch osobnych branchy**, po jednym w każdym repo. W razie
niejednoznaczności **zapytaj użytkownika** — nie zgaduj.

### 1. Odśwież stan zadania i sprawdź gotowość

```bash
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/fetch-task.js" <KEY>
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/check-readiness.js" <KEY>
```

- Exit `0` / `ready: true` (status `Backlog` lub `Ready`, zależności `Done`)
  → można zaczynać.
- `already_in_progress` → ktoś (lub inna sesja Claude) już nad tym pracuje.
  **Zatrzymaj się i zapytaj**, czy kontynuować (mogło dojść do przerwanej
  sesji) — nie zaczynaj po cichu równoległej pracy.
- `in_review` → branch prawdopodobnie już istnieje i czeka na ocenę. Zapytaj,
  czy chodzi o poprawki po review (wtedy kontynuuj na istniejącym branchu).
- `already_done` → poinformuj, zapytaj czy chodzi o inne zadanie.
- `blocked_by_dependencies` → pokaż niezamknięte zależności i zapytaj, jak
  postąpić.
- `unknown_status:<x>` → tablica ma status, którego skrypty nie znają —
  zgłoś użytkownikowi (patrz `github-project-tasks/reference/SETUP.md`).

### 2. Zastrzeż zadanie

```bash
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> "In progress"
```

### 3. Przygotuj branch

W repozytorium z kroku 0:

1. `git status` — niezacommitowane zmiany niezwiązane z zadaniem → zatrzymaj
   się i zapytaj (nie gub cudzej pracy).
2. `git checkout main`, `git pull`.
3. `git checkout -b <KEY>` — nazwa brancha to **dokładnie** Key (np.
   `T-220`). Branch już istnieje lokalnie lub zdalnie → zapytaj, czy wznowić,
   czy zacząć od nowa; nie usuwaj go samodzielnie.

### 4. Implementacja

- Kryteria ukończenia zadania to źródło prawdy, nie domysły.
- Zakres według sekcji "Zakres zadania a dług w kodzie" wyżej.
- **Backend** → zastosuj [`backend-development`](../backend-development/SKILL.md)
  (struktura per-feature, serwis + `@Transactional`, `*Factory`, kontrakt
  błędów, ownership check z testami, soft delete, Flyway, self code review).
- **Frontend** → zastosuj [`frontend-development`](../frontend-development/SKILL.md)
  (warstwa HTTP, React Query, podział komponentów, stylowanie, i18n, a11y,
  testy MSW, self code review).
- **Oba repo** → każda część w swoim repo z właściwym skillem, osobne
  branche/commity/push; zaznacz to w podsumowaniu.

### 5. Testy

- Napisz testy dokładnie tak, jak opisuje to zadanie, plus dodatkowe dla
  przypadków, których opis nie pokrył.
- Uruchom cały lokalny zestaw testów właściwego repo — zielony, zanim
  pójdziesz dalej. Czerwone → napraw teraz, nie odkładaj.

### 6. Zdecyduj o weryfikacji black-box

Wymagana, gdy zadanie zmienia obserwowalne zachowanie (nowy/zmieniony
endpoint, przepływ UI, efekt uboczny między modułami) na tyle, że testy nie są
wystarczającym dowodem. Czysto wewnętrzny refaktor zwykle nie wymaga.

Jeśli tak:

1. Środowisko lokalne: backend `http://localhost:9090` z Firebase Auth
   Emulator, frontend przez `pnpm dev`. Już działa → wykorzystaj; nie →
   uruchom skillem `run` albo standardowym startem repo. Nowa migracja Flyway
   → restart backendu.
2. Weryfikacja wg `blackbox-verification`, porównując z kryteriami zadania
   (nie z kodem).
3. Bug → napraw i **powtórz** krok 5 oraz black-box. Nie commituj ze znanym
   niedziałającym scenariuszem.

### 7. Commit i push brancha zadania

Dopiero gdy testy są zielone (i black-box potwierdza zgodność):

1. `git status`/`git diff` — stage **tylko** pliki związane z zadaniem
   (`git add <ścieżki>`, nie `git add .`/`-A`).
2. **Pułapka we froncie:** pre-commit w `akademiasaas-boilerplate` uruchamia
   `lint-staged`, którego konfiguracja kończy się `git add .` — dołączy do
   commita **wszystkie** zmienione pliki w repo, nie tylko Twoje. Przed
   commitem upewnij się, że w working tree nie ma obcych zmian (jeśli są —
   zapytaj użytkownika, czy je odłożyć `git stash`), a po commicie sprawdź
   `git show --stat HEAD`.
3. Komunikat commita:
   - `akademiasaas-boilerplate` — **musi** być `type(scope): opis (T-XXX)`
     (commitlint w hooku `commit-msg`; `mass-balance` jako scope dla KZR).
     Plain `T-XXX: opis` zostanie odrzucony.
   - `DeadlineGuradBackend` — brak commitlint; używaj tego samego formatu
     `type(scope): opis (T-XXX)` dla spójności między repo.
   - **Nigdy `--no-verify`.** Hook odrzucił → napraw przyczynę.
4. `git push -u origin <KEY>`.
5. ```bash
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> "In review"
   ```

Żadnej operacji scalającej z `main`. Pull Request tylko na wyraźną prośbę
użytkownika.

### 8. Potwierdzenie i zamknięcie zadania

1. Podsumuj: co zaimplementowano, w którym repo/branchu, jakie testy
   napisano i czy przeszły, czy i jak przeprowadzono black-box, oraz
   propozycje nowych ticketów na napotkany dług (patrz "Zakres zadania a dług").
2. **Zapytaj wprost, czy zadanie jest gotowe do zamknięcia.** Nie zamykaj na
   podstawie własnej oceny.
3. Po potwierdzeniu:
   ```bash
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/fetch-task.js" <KEY>   # aktualna treść do dopisania
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> Done
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/update-content.js" <KEY> --body-file <plik>.md
   ```
   Plik z opisem = **dotychczasowa treść zadania + dopisana sekcja
   "Realizacja"** (co zrobiono, repo, branch). Nie nadpisuj kryteriów.
4. Brak potwierdzenia → zostaw `In review`, zapisz czego brakuje, nie zgaduj
   kolejnego kroku.

## Czego unikać

- Implementacji przed ustawieniem `In progress`.
- Pomijania `check-readiness.js` "bo wiadomo, że zadanie jest wolne".
- Mieszania zmian backendu i frontendu w jednym branchu/commicie.
- Commit/push z czerwonymi testami albo niewyjaśnionym wynikiem black-box.
- Merge/rebase na `main`, push na `main` — zero wyjątków, w obu repo.
- `Done` bez wyraźnego potwierdzenia użytkownika.
- Refaktoru "przy okazji" poza regułą skauta — większy dług to nowy ticket.
- Pomijania `backend-development`/`frontend-development` dla dotkniętego repo.
- `git add .` i `--no-verify`.
- Czytania `tickets.md`/`PROGRESS.md` jako źródła zadań — tablica jest jedynym
  źródłem prawdy.
