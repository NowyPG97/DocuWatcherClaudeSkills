---
name: github-task-delivery
description: Use when asked to implement/deliver a specific development task tracked as an item on the DocuWatcher GitHub Project board (e.g. "zrealizuj T-220", "weź T-233 z tablicy", "zajmij się zadaniem T-220", "wykonaj task X od początku do końca") — the full standardized lifecycle from claiming the task, through branching off main in the right repo (backend DeadlineGuradBackend or frontend akademiasaas-boilerplate), implementation, writing unit/integration/frontend tests, optional black-box verification, committing and pushing a feature branch, to closing out the task on GitHub after user confirmation. Not for ad hoc coding requests unrelated to a tracked board item, and not for merging/deploying to main — that is explicitly out of scope of this skill.
version: 1.0.0
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
- [`backend-development`](../backend-development/SKILL.md) — konwencje i standardy pisania kodu, gdy zadanie dotyka backendu DocuWatcher (`DeadlineGuradBackend`, Spring Boot); ładowany automatycznie w kroku implementacji
- [`frontend-development`](../frontend-development/SKILL.md) — konwencje i standardy pisania kodu, gdy zadanie dotyka frontendu DocuWatcher (`akademiasaas-boilerplate`, React/TypeScript); ładowany automatycznie w kroku implementacji
- [`blackbox-verification`](../blackbox-verification/SKILL.md) — weryfikacja na żywo, gdy zadanie tego wymaga
- skill `run` (wbudowany) — uruchomienie aplikacji lokalnie, jeśli trzeba

Skrypty pierwszego z nich wywołuj przez
`"${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/<skrypt>.js"`.

## Twarda zasada (nie do złamania)

**Zakaz mergowania zmian do brancha `main`.** Ten skill kończy się na pushu
brancha zadania do zdalnego repo (backendowego lub frontendowego, zależnie
od zadania). Merge do `main` (czy to `git merge`, czy `gh pr merge`, czy
jakikolwiek bezpośredni push na `main`) jest **poza zakresem tego skilla** i
nigdy nie jest wykonywany w jego ramach — niezależnie od tego, jak bardzo
wszystko wygląda na gotowe. O merge decyduje użytkownik, osobno. Ta zasada
obowiązuje niezależnie od tego, czy praca odbywa się w
`DeadlineGuradBackend`, czy w `akademiasaas-boilerplate`.

## Kiedy używać

- Użytkownik prosi o realizację konkretnego zadania z Key z tablicy (np.
  "zrealizuj T-220").
- Trzeba przeprowadzić zadanie przez pełny cykl: branch → kod → testy →
  (opcjonalnie) black-box → commit/push → zamknięcie na tablicy.

Jeśli użytkownik prosi tylko o rzut oka na zadanie albo o zmianę jednego pola
("jaki jest status T-220", "ustaw priorytet na P1") — to zakres
`github-project-tasks`, nie tego skilla.

## Warunki realizacji (Definition of Done)

Zadanie można uznać za gotowe do zamknięcia **tylko** gdy wszystko poniżej
jest prawdą jednocześnie:

1. Implementacja realizuje dokładnie to, co opisano w zadaniu — kryteria
   akceptacji / sekcję "Done when" z treści zadania (albo z ticketu w
   `tickets.md`, dopóki migracja na tablicę trwa), bez pomijania punktów i
   bez wykraczania poza "Out of scope", jeśli taka sekcja istnieje.
2. Napisano wszystkie testy wymienione w zadaniu (np. tabela "Test
   scenarios") — unit, integracyjne i frontendowe/E2E, tam gdzie dotyczy.
3. Napisano dodatkowe testy ponad te wymienione, jeśli podczas realizacji
   okazało się, że są potrzebne (np. przypadek brzegowy, którego opis
   zadania nie przewidział) — nie ograniczaj się mechanicznie do listy.
4. Pełny lokalny zestaw testów przechodzi na zielono (`./mvnw test` dla
   backendu, `pnpm test`/`pnpm precommit` dla frontendu — zależnie od
   repo).
5. Jeśli zadanie tego wymagało (Ty podejmujesz decyzję, czy wymagało) —
   wykonano weryfikację black-box i nie pozostały niewyjaśnione
   rozbieżności między zachowaniem a intencją biznesową.
6. Stan zadania na tablicy (status, opis) jest zaktualizowany i spójny z tym,
   co faktycznie zrobiono.

Jeśli którykolwiek z tych punktów nie jest spełniony, zadanie **nie jest
gotowe** — nie przechodź do commit/push/zamknięcia, tylko wróć i dokończ.

## Workflow

### 0. Ustal repozytorium docelowe

DocuWatcher to **dwa oddzielne repozytoria**, nie monorepo:

| Repo | Ścieżka lokalna | Stack |
|---|---|---|
| Backend | `C:\DocuWatcherWorkspace\DeadlineGuradBackend` | Spring Boot / Java |
| Frontend | `C:\DocuWatcherWorkspace\akademiasaas-boilerplate` | React / TypeScript |

Sprawdź pole `Repository` zadania na tablicy (`backend`/`frontend`/`both`) —
patrz [`github-project-tasks`](../github-project-tasks/SKILL.md). Jeśli
zadanie jest `both` albo pole nie jest ustawione (typowe dla zadań wciąż
opisanych tylko w `tickets.md`), oceń na podstawie treści zadania, którego
repo dotyczy; jeśli dotyczy obu, będziesz potrzebować **dwóch osobnych
branchy**, po jednym w każdym repo — nie mieszaj zmian obu repozytoriów w
jednym branchu/commicie. W razie niejednoznaczności **zapytaj
użytkownika**, w którym repo ma powstać branch — nie zgaduj.

### 1. Odśwież stan zadania i sprawdź gotowość

```bash
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/fetch-task.js" <KEY>
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/check-readiness.js" <KEY>
```

- Exit code `0` / `ready: true` → można zaczynać.
- `reason: "already_in_progress"` → ktoś (lub inna sesja Claude) już nad tym
  pracuje. **Zatrzymaj się i zapytaj użytkownika**, czy na pewno kontynuować
  (mogło dojść do przerwanej wcześniejszej sesji) — nie zaczynaj po cichu
  równoległej pracy nad tym samym zadaniem.
- `reason: "already_done"` → poinformuj użytkownika, zapytaj czy chodzi o
  inne zadanie.
- `reason: "blocked_by_dependencies"` → pokaż które zależności nie są
  `Done` i zapytaj użytkownika, jak chce postąpić.

Jeśli zadanie jeszcze nie istnieje na tablicy (żyje tylko w `tickets.md`),
sprawdź jego opis i zależności tam — i rozważ zaproponowanie użytkownikowi
migracji tego konkretnego ticketu na tablicę przed startem (patrz
[`reference/SETUP.md`](../github-project-tasks/reference/SETUP.md) w
`github-project-tasks`), zamiast realizować je w całkowitym oderwaniu od
docelowego procesu.

### 2. Zastrzeż zadanie

```bash
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> "In Progress"
```

### 3. Przygotuj branch

W repozytorium ustalonym w kroku 0:

1. Sprawdź `git status` — jeśli są niezacommitowane zmiany niezwiązane z tym
   zadaniem, zatrzymaj się i zapytaj użytkownika (nie gub cudzej pracy).
2. `git checkout main`, `git pull`.
3. `git checkout -b <KEY>` — nazwa brancha to **dokładnie** Key zadania
   (np. `T-220`). Jeśli taki branch już istnieje lokalnie lub zdalnie,
   zatrzymaj się i zapytaj użytkownika, czy wznowić pracę na nim, czy zacząć
   od nowa — nie usuwaj istniejącego brancha samodzielnie.

### 4. Implementacja

- Realizuj dokładnie to, co opisuje zadanie — kryteria akceptacji jako
  źródło prawdy, nie domysły. Trzymaj się sekcji "Out of scope", jeśli
  istnieje.
- Nie poszerzaj zakresu poza to, co zadanie opisuje ("refactor przy okazji"
  zostaw na osobne zadanie).
- **Jeśli zadanie dotyka backendu** (`DeadlineGuradBackend`) — zastosuj
  skill [`backend-development`](../backend-development/SKILL.md). Reguluje
  on m.in. strukturę per-feature, wzorzec serwisu (konkretna klasa vs.
  interfejs+impl), mapowanie DTO przez statyczne `*Factory`, kontrakt
  błędów (`ErrorResponseDTO`/`GlobalExceptionHandler`), manualny ownership
  check przez `workspaceService.getWorkspaceEntity`, soft delete przez
  `Status`, konwencję migracji Flyway oraz obowiązkowy self code review.
- **Jeśli zadanie dotyka frontendu** (`akademiasaas-boilerplate`) —
  zastosuj skill [`frontend-development`](../frontend-development/SKILL.md).
  Reguluje on m.in. język kodu, tłumaczenia UI, konwencje React/stanu
  globalnego/formularzy tego repo, oraz obowiązkowy self code review.
- **Jeśli zadanie dotyka obu repozytoriów** — zaimplementuj każdą część w
  jej repo z właściwym skillem, jako osobne branche/commity/push (patrz
  krok 0); jasno zaznacz w podsumowaniu (krok 9), że zadanie obejmowało oba
  repo.

### 5. Testy

- Napisz testy dokładnie tak, jak opisuje to zadanie (np. tabela "Test
  scenarios": poziom, scenariusz, oczekiwany wynik) — unit, integracyjne,
  a jeśli zadanie dotyka UI/frontend, także testy frontendowe.
- Dopisz dodatkowe testy, jeśli podczas implementacji zauważysz przypadki,
  których opis zadania nie pokrył.
- Uruchom cały lokalny zestaw testów właściwego repo i upewnij się, że jest
  zielony, zanim przejdziesz dalej. Jeśli coś nie przechodzi — napraw przed
  kontynuacją, nie odkładaj na później.

### 6. Zdecyduj o weryfikacji black-box

Zadanie wymaga weryfikacji black-box, gdy zmienia obserwowalne zachowanie
systemu (nowy/zmieniony endpoint, przepływ UI, efekt uboczny między
modułami) na tyle, że samo przejście testów jednostkowych/integracyjnych nie
jest wystarczającym dowodem — dokładnie te sytuacje, które opisuje skill
`blackbox-verification` w sekcji "Kiedy używać". Czysto wewnętrzny
refaktor/konfiguracja bez obserwowalnego efektu zwykle tego nie wymaga.

Jeśli tak:

1. Upewnij się, że środowisko lokalne działa (backend `http://localhost:9090`
   z Firebase Auth Emulator, frontend przez `pnpm dev` — jeśli już
   uruchomione, wykorzystaj je; jeśli nie, uruchom skillem `run` albo
   standardowym sposobem startu danego repo).
2. Przeprowadź weryfikację zgodnie z workflow skilla
   `blackbox-verification`, porównując zachowanie z kryteriami akceptacji
   zadania (nie z kodem).
3. Jeśli znajdziesz bug — napraw go i **powtórz** testy z kroku 5 oraz
   weryfikację black-box, zanim pójdziesz dalej. Nie commituj ze znanym
   niedziałającym scenariuszem.

### 7. Commit i push brancha zadania

Dopiero gdy testy są zielone (i black-box, jeśli dotyczy, potwierdza
zgodność z intencją):

1. Przejrzyj `git status`/`git diff` — stage tylko pliki związane z tym
   zadaniem.
2. Commit z opisowym komunikatem odwołującym się do Key zadania — w
   `akademiasaas-boilerplate` **musi** to być format `type(scope): opis
   (T-XXX)` wymuszany przez commitlint (`feat`/`fix`/`refactor`/`chore`;
   `mass-balance` jako scope dla zmian modułu KZR) — plain `T-XXX: opis`
   zostanie odrzucony przez hook `commit-msg`. W `DeadlineGuradBackend`
   wystarczy `T-<numer>: opis` (repo nie ma commitlint), ale format
   `type(scope): opis (T-XXX)` też jest zgodny z historią i preferowany dla
   spójności między repo. **Nigdy nie omijaj hooka `--no-verify`**, jeśli
   commit zostanie odrzucony — napraw format/lint/testy i pozwól hookowi
   przejść samodzielnie.
3. `git push -u origin <KEY>`.

Nie wykonuj żadnej operacji scalającej z `main` (patrz "Twarda zasada"
wyżej). Otwarcie Pull Requesta jest opcjonalne i poza domyślnym zakresem
tego skilla — rób to tylko, jeśli użytkownik wyraźnie o to poprosi.

### 8. Potwierdzenie i zamknięcie zadania

1. Podsumuj użytkownikowi: co zaimplementowano, w którym repo/branchu,
   jakie testy napisano i czy przeszły, czy i jak przeprowadzono black-box.
2. **Zapytaj wprost, czy zadanie jest gotowe do zamknięcia.** Nie zamykaj
   automatycznie na podstawie własnej oceny.
3. Po potwierdzeniu zaktualizuj tablicę przez `github-project-tasks`:
   ```bash
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> Done
   node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/update-content.js" <KEY> --body-file <opis-z-podsumowaniem>.md
   ```
   Opis warto uzupełnić o krótkie podsumowanie realizacji (co zrobiono, w
   którym repo, link do brancha) — nie nadpisuj oryginalnych kryteriów
   akceptacji, dopisz do nich.
4. Jeśli użytkownik **nie** potwierdzi gotowości — zostaw status
   `In Progress`, zapisz czego brakuje, nie zgaduj kolejnego kroku bez niego.

## Czego unikać

- Nie zaczynaj implementacji przed ustawieniem statusu `In Progress`.
- Nie pomijaj `check-readiness.js` "bo przecież wiadomo, że zadanie jest
  wolne" — to właśnie ma zapobiegać dwóm równoległym realizacjom tego
  samego zadania.
- Nie mieszaj zmian backendu i frontendu w jednym branchu/commicie, gdy
  zadanie obejmuje oba repo — to dwa osobne repozytoria git, nie monorepo.
- Nie commituj/pushuj z czerwonymi testami albo z niewyjaśnionym wynikiem
  black-box.
- Nie mergeuj, nie rebase'uj na `main`, nie pushuj bezpośrednio na `main` —
  zero wyjątków w ramach tego skilla, w żadnym z dwóch repo.
- Nie oznaczaj zadania jako `Done` bez wyraźnego potwierdzenia użytkownika.
- Nie poszerzaj zakresu zadania poza kryteria akceptacji "przy okazji".
- Nie pomijaj skilla `backend-development`/`frontend-development` właściwego
  dla dotkniętego repo — to one definiują konwencje kodu i wymóg self code
  review, których ten skill nie duplikuje.
- Nie używaj `--no-verify`, gdy hook `commit-msg`/`precommit` w
  `akademiasaas-boilerplate` odrzuci commit — napraw przyczynę.
