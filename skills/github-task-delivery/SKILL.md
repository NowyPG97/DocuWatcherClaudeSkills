---
name: github-task-delivery
description: >-
  Use when asked to implement/deliver a specific development task tracked as an item on the DocuWatcher GitHub Project board (e.g. "zrealizuj T-220", "zrób zadanie T-220", "weź T-233 z tablicy", "zajmij się zadaniem T-220", "kontynuuj T-220", "wykonaj task X od początku do końca") — the full standardized lifecycle from claiming the task, through branching off the repo's main branch (`main` or `master`, depending on the repo) in the right repo (backend DeadlineGuradBackend or frontend akademiasaas-boilerplate, per the board's Codebase field), implementation, writing unit/integration/frontend tests, optional black-box verification, committing and pushing a feature branch, to moving the task to In review and closing it on GitHub after user confirmation; also pausing and resuming a task across sessions. Not for ad hoc coding requests unrelated to a tracked board item, and not for merging/deploying to the main branch (`main`/`master`) — that is explicitly out of scope of this skill.
version: 3.0.0
---

# Realizacja zadania z tablicy GitHub (task delivery)

## Cel i role

Jeden, zawsze taki sam przebieg realizacji zadania z tablicy GitHub Projects
DocuWatcher — od odświeżenia stanu, przez branch, implementację i testy, po
zamknięcie na tablicy.

**Ty (główna sesja, Opus) jesteś orkiestratorem:** planujesz, podejmujesz
decyzje, pilnujesz Definition of Done i rozmawiasz z użytkownikiem (Pawłem).
Wykonawstwo i mechanikę delegujesz do agentów pluginu:

| Agent | Model | Do czego |
|---|---|---|
| `code-researcher` | Sonnet | fakty z kodu (`plik:linia`) do planu |
| `backend-dev` / `frontend-dev` | Sonnet | implementacja + testy (preload `backend-development` / `frontend-development`) |
| `test-runner` | Haiku | pełny zestaw testów (wołany przez implementera) |
| `reviewer` | Opus, high | niezależny review diffu względem kryteriów |
| `qa` | Sonnet | black-box (preload `blackbox-verification`) |
| `committer` | Haiku | commit + push + `In review` |
| `board-ops` | Haiku | operacje na tablicy przy zamknięciu |

W `Agent` podawaj `subagent_type` z prefiksem pluginu (np.
`docuwatcher-skills:backend-dev`). **Przy delegowaniu nie przekazuj parametru
`model` — model jest ustalony w definicji agenta.**

Ścieżki do przekazywania agentom (rozwinięte przy wczytaniu skilla):
- `<SCRIPTS>` = `${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts`
- `<SKILLS_DIR>` = `${CLAUDE_SKILL_DIR}/..`
- szablony: [`reference/brief-template.md`](reference/brief-template.md),
  [`reference/handoff-template.md`](reference/handoff-template.md)

## Chudy kontekst orkiestratora

Każdy token w Twoim kontekście jest płacony w każdej kolejnej turze po stawce Opusa.

- **Nie czytasz** dużych plików, pełnych diffów ani logów testów/buildów.
  Wszystko, co produkuje dużo tekstu, robi subagent i zwraca zwięzły raport.
- **Wolno Ci** przeczytać krótki, konkretny fragment kodu (zakres linii, do ~150
  linii), gdy decyzja w planie zależy od jego dokładnego brzmienia, oraz
  `git diff --stat` / `git status --short`. Na ścieżce S — patrz niżej — także
  mały diff.
- **Nie deleguj pojedynczej komendy** (narzut startu agenta > zysk). Grupuj kroki.
- **Wznawiaj** istniejącego implementera (`SendMessage` z jego nazwą) zamiast
  uruchamiać nowego — nowy musi od nowa czytać pliki.
- Nie używaj wbudowanego `Explore`/`general-purpose` do zbierania faktów —
  dziedziczą model sesji (Opus). Używaj `code-researcher`.

## Twarde zasady (nie do złamania)

1. **Zakaz mergowania do głównego brancha — `main` albo `master`, zależnie od
   repo.** Skill kończy się na pushu brancha zadania. Merge (`git merge`,
   `gh pr merge`, push na `main`/`master`) nigdy nie jest wykonywany w jego
   ramach. Dotyczy obu repo i obu nazw. Dotyczy też wszystkich agentów.
2. **`Done` tylko po wyraźnym potwierdzeniu użytkownika.**
3. **Nigdy `--no-verify`**, `git add .`/`-A`.
4. **Osobne branche/commity dla backendu i frontendu.**
5. Implementer **nie commituje** i nie zmienia tablicy — robią to `committer` i
   `board-ops` na Twoje polecenie.

## Zakres zadania a dług w kodzie

1. **Reguła skauta tylko w plikach, które zadanie i tak zmienia** (małe porządki
   pokryte testami).
2. **Wszystko większe → propozycja nowego zadania** w podsumowaniu (tytuł,
   zakres, Codebase) i pytanie, czy założyć ticket.
3. **Brakujący fundament** (np. `httpClient`, `QueryClientProvider`, MSW) to
   osobne zadanie. Gdy implementer zgłosi go jako `DECYZJA POTRZEBNA` — to
   decyzja o zakresie: **pytasz użytkownika**, czy najpierw zrobić fundament, czy
   świadomie napisać kod po staremu (i zanotować dług).

## Warunki realizacji (Definition of Done)

Zadanie jest gotowe do zamknięcia **tylko** gdy jednocześnie:

1. Implementacja realizuje dokładnie kryteria ukończenia, bez pomijania punktów i
   bez wykraczania poza „NIE WCHODZI” / „Out of scope”.
2. Napisano wszystkie testy wymienione w zadaniu (unit, integracyjne,
   frontendowe/E2E, tam gdzie dotyczy).
3. Napisano dodatkowe testy dla przypadków brzegowych ujawnionych w trakcie.
4. Pełny lokalny zestaw testów zielony (`./mvnw test` backend, `pnpm precommit`
   frontend) — potwierdzony raportem `test-runner`, nie deklaracją.
5. Jeśli zadanie tego wymagało (Ty decydujesz) — black-box wykonany i bez
   niewyjaśnionych rozbieżności z intencją biznesową.
6. Stan zadania na tablicy spójny z tym, co zrobiono.

Którykolwiek punkt niespełniony → nie przechodź do commit/push/zamknięcia.

## Proces proporcjonalny do zadania

Po kroku 1 sklasyfikuj ścieżkę i podaj ją użytkownikowi jednym zdaniem.

**Ścieżka S** — wszystkie warunki naraz:
- `Size` = `XS` albo `S`,
- `Codebase` ≠ `both`,
- zadanie **nie** dotyka: migracji Flyway / encji / schematu, kontraktu API
  (DTO, endpoint, kody błędów), autoryzacji / scopingu `workspaceId`, treści PoS
  ani eksportów (PDF, CSV), niezmienników massbalance (append-only, okresy,
  Reguły 1–9).

Na ścieżce S: plan w formie zwięzłego briefu (bez osobnego researchu, jeśli
zadanie wskazuje pliki), implementer, **bez reviewera** — zamiast niego sam
przeglądasz diff, jeśli ma ≤ ~200 linii (`git diff <główny-branch>...HEAD` +
niezacommitowane); większy diff → `reviewer`. Jeśli w trakcie okaże się, że
zadanie dotyka czegoś z listy wyżej → przejdź na ścieżkę pełną (reviewer
obowiązkowy).

<!-- PLAN AWARYJNY (nie aktywny): jeśli limit nadal nie wystarcza, punkt
rozgałęzienia jest tutaj — dla ścieżki S zamiast orkiestracji z sesji Opus
proponujesz użytkownikowi realizację w sesji Sonnet z `reviewer` (Opus) na końcu. -->

**Ścieżka pełna** — `M`, `L`, `XL`, `Codebase: both` albo którykolwiek obszar z
listy wyżej: research → plan → brief → implementer(zy) → weryfikacja raportu →
reviewer → poprawki → (black-box) → commit.

## Workflow

### 0. Ustal repozytorium docelowe

DocuWatcher to **dwa oddzielne repozytoria**:

| `Codebase` | Repo | Ścieżka lokalna | Stack | Główny branch | Agent |
|---|---|---|---|---|---|
| `backend` | `DeadlineGuradBackend` | `C:\DocuWatcherWorkspace\DeadlineGuradBackend` | Spring Boot / Java | `main` | `backend-dev` |
| `frontend` | `akademiasaas-boilerplate` | `C:\DocuWatcherWorkspace\akademiasaas-boilerplate` | React / TypeScript | `master` | `frontend-dev` |

Główny branch potwierdź w repo (`git symbolic-ref --short refs/remotes/origin/HEAD`);
wynik różny od tabeli → wierz repo. Repo wskazuje pole **`Codebase`** (klucz
`codebase` w JSON). `both` → dwa branche, po jednym w każdym repo. Brak wartości
lub niejednoznaczność → **zapytaj użytkownika**.

### 1–2. Odśwież stan, sprawdź gotowość, zastrzeż zadanie (sam, 3 komendy)

```bash
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/fetch-task.js" <KEY>
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/check-readiness.js" <KEY>
node "${CLAUDE_SKILL_DIR}/../github-project-tasks/scripts/set-status.js" <KEY> "In progress"   # tylko gdy ready
```

Treść zadania (`content.body`) zostaje w Twoim kontekście — kryteria wklejasz z
niej dosłownie do briefu i do review.

- `ready: true` → dalej.
- `already_in_progress` → mogła zostać przerwana sesja: sprawdź notatkę
  przekazania (sekcja „Pauza i wznowienie”); brak notatki → **zapytaj**, czy
  kontynuować. Nie zaczynaj po cichu równoległej pracy.
- `in_review` → zapytaj, czy chodzi o poprawki po review (wtedy praca na
  istniejącym branchu, nowy implementer z briefem „stan zastany”).
- `already_done` → poinformuj, zapytaj czy chodzi o inne zadanie.
- `blocked_by_dependencies` → pokaż zależności, zapytaj.
- `unknown_status:<x>` → zgłoś (patrz `github-project-tasks/reference/SETUP.md`).

### 3. Przygotuj branch (sam)

W repo z kroku 0 (przy `both` — w obu):
1. `git status --short` — obce niezacommitowane zmiany → zatrzymaj się i zapytaj.
2. `git checkout <główny-branch>` + `git pull`.
3. `git checkout -b <KEY>`. Branch istnieje lokalnie/zdalnie → zapytaj, czy
   wznowić (sekcja „Pauza i wznowienie”), czy zacząć od nowa; nie usuwaj go sam.

### Plan (Ty) — fakty przez `code-researcher`

1. Lista pytań o kod potrzebnych do decyzji (gdzie jest logika X, jak jest
   zrobione Y w sąsiednim module, jaki kształt ma DTO Z, jakie testy już
   istnieją). Jedno wywołanie `code-researcher` z całą listą; przy `both` —
   pytania o oba repo w tym samym wywołaniu.
2. Na podstawie raportu: pliki, kolejność, decyzje projektowe z uzasadnieniem,
   lista testów (z zadania + dodatkowe). Kluczowy fragment kodu, od którego
   zależy decyzja, możesz doczytać sam (zakres linii).
3. Decyzje **o zakresie lub priorytetach biznesowych** (co wchodzi, jak ma się
   zachować system dla operatora, kompromis UX) → zapytaj użytkownika przed
   briefem. Decyzje techniczne podejmujesz sam.

### Brief → implementacja i testy (4–5)

Brief wg [`reference/brief-template.md`](reference/brief-template.md):
kryteria i „NIE WCHODZI” **dosłownie**, plan, testy, ograniczenia, format raportu.

Uruchom implementera z **nazwą** `<agent>-<KEY>` (np. `backend-dev-T-220`). Przy
`both` — `backend-dev-<KEY>` i `frontend-dev-<KEY>` **równolegle** (dwa wywołania
`Agent` w jednej wiadomości), każdy w swoim repo i na swoim branchu; kontrakt API
między nimi ustalasz w planie i wpisujesz do obu briefów identycznie.

Agenci chodzą w tle — poczekaj na powiadomienie o zakończeniu, nie wymyślaj ich
wyniku.

**`DECYZJA POTRZEBNA` od implementera:**
- decyzja techniczna → rozstrzygasz sam,
- decyzja o zakresie / priorytecie biznesowym / brakującym fundamencie → pytasz
  użytkownika (AskUserQuestion, z rekomendacją implementera i własną),
- potem wznawiasz **tego samego** implementera (`SendMessage` do jego nazwy) z
  rozstrzygnięciem (szablon w `brief-template.md`).

Jeśli implementer wraca z `DECYZJA POTRZEBNA` na drobiazgach — rozstrzygnij i
dopisz w odpowiedzi, że takie sprawy rozstrzyga sam.

### Weryfikacja raportu implementera (Ty)

- Każde kryterium z zadania ma odpowiednik w „Zmienione pliki” / „Testy”?
- `git diff --stat <główny-branch>...HEAD` + `git status --short` zgadzają się z
  listą zmienionych plików (pliki spoza raportu = pytanie do implementera).
- Pełny zestaw testów: PASS z raportu `test-runner`.
- „Decyzje podjęte samodzielnie” i „Odstępstwa” — każdą oceń; niezgoda → poprawka.
- Braki → `SendMessage` do implementera, zanim pójdziesz do review.

### Review (ścieżka pełna; na S — warunkowo, patrz wyżej)

Uruchom `reviewer` z: treścią zadania (kryteria + „NIE WCHODZI”) dosłownie,
planem i decyzjami (Twoimi i zaakceptowanymi decyzjami implementera), repo,
branchem, `<główny-branch>`, `<SKILLS_DIR>`. Diffu **nie wklejasz** i sam go nie
oglądasz — reviewer czyta go sam. Przy `both` — jeden reviewer na oba repo
(widzi spójność kontraktu).

Wynik: **blokujące** / **do poprawy** / **sugestie**. Ty decydujesz:
- blokujące → obowiązkowo do poprawy,
- do poprawy / sugestie → wybierasz; odrzucone zapisujesz z powodem,
- z punktem blokującym, z którym się nie zgadzasz → nie poprawiasz po cichu ani
  nie ignorujesz: przedstawiasz go użytkownikowi w podsumowaniu (krok 8) z
  argumentacją.

Poprawki → **ten sam** implementer przez `SendMessage` z listą punktów
(`plik:linia`). **Jedna runda review.** Druga tylko, gdy poprawki blokujących
były nietrywialne (zmiana logiki/modelu, nie kosmetyka) — wtedy wznów tego
samego reviewera (`SendMessage`) z prośbą o sprawdzenie tylko poprawek.

### 6. Black-box (decyzja: Ty, wykonanie: `qa`)

Wymagany, gdy zadanie zmienia obserwowalne zachowanie (nowy/zmieniony endpoint,
przepływ UI, efekt uboczny między modułami) na tyle, że testy nie są
wystarczającym dowodem. Czysto wewnętrzny refaktor zwykle nie wymaga.

1. Środowisko: backend `http://localhost:9090` z Firebase Auth Emulator, frontend
   `pnpm dev`. Działa → wykorzystaj; nie → uruchom (skill `run` albo standardowy
   start repo). Nowa migracja Flyway → restart backendu.
2. `qa` dostaje: kryteria dosłownie, scenariusze (Ty je układasz — persona,
   pełny cykl, przypadki brzegowe), stan środowiska, dane/workspace.
3. Rozbieżności oceniasz Ty: bug → wznów implementera z opisem, potem powtórz
   pełny zestaw testów i scenariusz `qa` (wznów tego samego `qa`). „Do oceny przez
   człowieka” → przekaż użytkownikowi.

Nie commituj ze znanym niedziałającym scenariuszem.

### 7. Commit i push (`committer`)

Jedno wywołanie `committer` na repo (przy `both` — dwa, mogą iść równolegle) z:
- repo, branch `<KEY>`, `<główny-branch>`, `<SCRIPTS>`, Key,
- **listą plików zadania** (z raportu implementera, zweryfikowaną `--stat`),
- **gotowym komunikatem**: `type(scope): opis (T-XXX)` (≤ 100 znaków pierwszej
  linii; `mass-balance` jako scope dla KZR; ten sam format w backendzie) +
  linia `Co-Authored-By`, jeśli obowiązuje.

`committer` zna pułapki (lint-staged z `git add .` we froncie, commitlint, zakaz
`--no-verify`, `git add` tylko plików zadania, `git show --stat HEAD`, zakaz merge).
Wynik:
- `OK` → dalej,
- `STOP` z błędem hooka → wznów implementera z dosłownym błędem, potem ponów
  `committer`,
- obce zmiany w working tree → zapytaj użytkownika (odłożyć `git stash`? czyje?),
- `ALARM` (plik spoza listy w commicie) → zatrzymaj się i przedstaw użytkownikowi.

Pull Request tylko na wyraźną prośbę użytkownika.

### 8. Podsumowanie, potwierdzenie, zamknięcie

1. Podsumuj (po polsku): co zaimplementowano, repo/branch/commit, testy i wynik,
   review (co poprawiono, co świadomie odrzucono i dlaczego, punkty sporne),
   black-box (czy i z jakim wynikiem), propozycje ticketów na dług.
2. **Zapytaj wprost, czy zadanie jest gotowe do zamknięcia.**
3. Po potwierdzeniu — jedno wywołanie `board-ops`: „użytkownik potwierdził
   zamknięcie”, `<SCRIPTS>`, Key, tekst sekcji do dopisania:

   ```
   ## Realizacja
   - Repo / branch / commit: …
   - Co zrobiono: …
   - Testy: …
   ```

   `board-ops` dopisuje sekcję do istniejącej treści (bez nadpisywania kryteriów)
   i ustawia `Done`.
4. Brak potwierdzenia → zostaw `In review`, zapisz czego brakuje.
5. Usuń notatkę przekazania `<KEY>.md`, jeśli istniała.
6. **Przypomnij o `/clear` przed kolejnym zadaniem** — nowe zadanie w tej samej
   sesji niesie cały kontekst poprzedniego w każdej turze.

## Pauza i wznowienie

Wznawianie starej sesji po wygaśnięciu cache (cache głównej sesji żyje ~1 h od
ostatniej wymiany) przelicza cały kontekst od nowa po stawce Opusa. Dlatego
przerwy obsługujemy notatką i nową sesją.

**Pauza** — gdy użytkownik pisze, że robi przerwę („pauza”, „wracam później”,
„kończę na dziś”, „przerwa”):
1. Poczekaj na zakończenie działających agentów albo zanotuj, że działają (ich
   wyniku nie będzie w nowej sesji).
2. Zapisz notatkę wg [`reference/handoff-template.md`](reference/handoff-template.md)
   do `C:\DocuWatcherWorkspace\.claude\handoff\<KEY>.md` (poza repo git — nie
   trafi do commita). Stan repo ustal komendami (`git status --short`,
   `git log -1 --oneline`), nie z pamięci.
3. Nie commituj „na zapas” i nie zmieniaj statusu (zostaje `In progress`).
4. Przypomnij: „Wróć w **nowej sesji** (`/clear` albo nowe okno) i napisz
   `kontynuuj <KEY>`.”

**Wznowienie** — „kontynuuj <KEY>” albo w kroku 1 `already_in_progress` /
istniejący branch:
1. Przeczytaj `C:\DocuWatcherWorkspace\.claude\handoff\<KEY>.md` (brak → zbierz
   stan z repo i tablicy i powiedz o tym).
2. `fetch-task.js` (treść mogła się zmienić), `git status --short`,
   `git diff --stat <główny-branch>...HEAD` w repo zadania.
3. Potwierdź z użytkownikiem stan i plan dokończenia (krótko: co zrobione, co
   zostało, otwarte pytania).
4. Uruchom **nowego** implementera (poprzedni nie istnieje w nowej sesji) z
   briefem + sekcją „Stan zastany” (szablon w `brief-template.md`) — implementer
   sam przegląda `git diff`, Ty go nie wklejasz.
5. Dalej normalnym przebiegiem (weryfikacja raportu, review, …).

## Czego unikać

- Implementacji przed `In progress`; pomijania `check-readiness.js`.
- Czytania pełnych diffów, dużych plików i logów w głównej sesji (poza wyjątkami
  wyżej).
- Przekazywania parametru `model` przy delegowaniu.
- Uruchamiania nowego implementera, gdy można wznowić istniejącego.
- Przepisywania kryteriów własnymi słowami w briefie lub dla reviewera.
- Mieszania backendu i frontendu w jednym branchu/commicie.
- Commit/push z czerwonymi testami albo niewyjaśnionym wynikiem black-box.
- Merge/rebase na głównym branchu, push na `main`/`master` — zero wyjątków.
- `Done` bez wyraźnego potwierdzenia użytkownika.
- Refaktoru „przy okazji” poza regułą skauta.
- `git add .` i `--no-verify`.
- Czytania `tickets.md`/`PROGRESS.md` jako źródła zadań — tablica jest jedynym
  źródłem prawdy.
