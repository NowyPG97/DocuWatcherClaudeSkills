# DocuWatcherClaudeSkills

Współdzielone Skille Claude Code dla projektu **DocuWatcher** — instrukcje, konwencje i workflowy, które Claude ładuje automatycznie przy pracy nad projektem (backend `DeadlineGuradBackend` + frontend `akademiasaas-boilerplate`).

## Czym są Skille?

Skille to foldery z instrukcjami (`SKILL.md`), które Claude wczytuje dynamicznie, gdy zadanie tego wymaga. Dzięki temu nie trzeba za każdym razem tłumaczyć konwencji projektu od zera — Claude sam rozpoznaje kontekst i stosuje odpowiedni skill.

## Instalacja

```bash
/plugin marketplace add NowyPG97/DocuWatcherClaudeSkills
/plugin install docuwatcher-skills@docuwatcher --scope project
```

Jeśli masz to repo już sklonowane lokalnie i nie chcesz/nie możesz klonować go
ponownie przez `/plugin` (np. brak zaufanego klucza SSH GitHuba), dodaj
marketplace z lokalnej ścieżki zamiast z GitHuba — instalacja z `--scope project`
działa tak samo:

```bash
/plugin marketplace add {{LOKALNA_SCIEŻKA_DO_REPO}}/DocuWatcherClaudeSkills
/plugin install docuwatcher-skills@docuwatcher --scope project
```

Jeśli flaga `--scope project` nie zadziała w Twojej wersji CLI, uruchom samo
`/plugin` — powinno pokazać menu z opcją wyboru/zmiany zakresu instalacji dla
już zainstalowanego pluginu. Zakresy w Claude Code:

| Zakres               | Gdzie aktywny                                                              |
| -------------------- | -------------------------------------------------------------------------- |
| `user`               | wszędzie, w każdym projekcie na tej maszynie                               |
| `project`            | tylko to jedno repo, współdzielone (przez `.claude/settings.json` w gicie) |
| `local` _(domyślny)_ | tylko to jedno repo, tylko dla Ciebie (`.claude/settings.local.json`)      |

Ponieważ DocuWatcher to **dwa oddzielne repozytoria** (backend i frontend),
a nie monorepo, zainstaluj ten plugin w obu z nich (`DeadlineGuradBackend` i
`akademiasaas-boilerplate`) z zakresem `project`, żeby skille ładowały się
niezależnie od tego, w którym repo aktualnie pracuje Claude.

Aktualizacja do najnowszej wersji:

```bash
/plugin update docuwatcher-skills
```

## Struktura repo

```
DocuWatcherClaudeSkills/
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── agents/                 # subagenci (model/effort/tools we frontmatterze)
├── skills/
│   ├── nazwa-skilla/
│   │   ├── SKILL.md
│   │   └── (opcjonalnie: scripts/, examples/, reference/)
│   └── ...
└── README.md
```

## Dostępne Skille

| Skill | Opis |
| --- | --- |
| [`backend-development`](skills/backend-development/SKILL.md) | Konwencje i standardy pisania kodu backendu DocuWatcher (`DeadlineGuradBackend`, Spring Boot/Java) — ładowany automatycznie, gdy zadanie dotyka backendu |
| [`frontend-development`](skills/frontend-development/SKILL.md) | Konwencje i standardy pisania kodu frontendu DocuWatcher (`akademiasaas-boilerplate`, React/TypeScript) — ładowany automatycznie, gdy zadanie dotyka frontendu |
| [`blackbox-verification`](skills/blackbox-verification/SKILL.md) | Weryfikacja czarnoskrzynkowa systemu przez realny UI/API, bez opierania werdyktu na czytaniu kodu |
| [`github-project-tasks`](skills/github-project-tasks/SKILL.md) | Pobieranie świeżego stanu zadań i zarządzanie ich cyklem życia (status, priorytet itd.) na tablicy GitHub Projects (`NowyPG97` / projekt nr 1) |
| [`github-task-delivery`](skills/github-task-delivery/SKILL.md) | Standardowy przebieg realizacji zadania z tablicy: ustalenie właściwego repo (pole `Codebase`) → branch → implementacja (z konwencjami `backend-development`/`frontend-development` zależnie od zadania) → testy → (opcjonalnie) black-box → commit/push → zamknięcie zadania (bez mergowania do głównego brancha `main`/`master`) |
| [`architecture-product-analysis`](skills/architecture-product-analysis/SKILL.md) | Analiza kwestii w dwóch rolach naraz — architekt (wpływ techniczny, warianty, ryzyka) i product owner (kto, wartość, zakres, kryteria akceptacji) — z weryfikacją zgodności z dokumentami KZR INiG (cytaty ze źródła); wynik to rekomendacja, nie kod |
| [`website-redesign`](skills/website-redesign/SKILL.md) | Strona docuwatcher.com jako osobny projekt (wyniki w `C:\DocuWatcherWorkspace\Strona\`): 1 audyt (aktualność treści względem aplikacji, prezentacja wartości modułu KZR, SEO, wygląd przez impeccable) → 2 projekt (strategia, teksty + SEO, prototyp HTML z impeccable) → 3 wdrożenie przez EMCP (szkice w Elementorze, publikacja tylko za zgodą, kontrola po publikacji) |

## Agenci i podział modeli (od 3.0.0)

Główna sesja działa na **Opusie** (`"model": "opus"` w
`C:\DocuWatcherWorkspace\.claude\settings.json`) i jest orkiestratorem: planuje,
decyduje, pilnuje Definition of Done, rozmawia z użytkownikiem. Wszystko, co
produkuje dużo tekstu (czytanie kodu, implementacja, logi testów, black-box), robią
agenci z katalogu [`agents/`](agents/) i zwracają zwięzły raport.

| Agent | Model | Effort | Rola |
|---|---|---|---|
| `backend-dev` | sonnet | domyślny | implementacja + testy w `DeadlineGuradBackend` (preload `backend-development`, cache 1 h) |
| `frontend-dev` | sonnet | domyślny | implementacja + testy w `akademiasaas-boilerplate` (preload `frontend-development`, cache 1 h) |
| `qa` | sonnet | domyślny | black-box (preload `blackbox-verification`), bez edycji plików |
| `reviewer` | opus | high | niezależny review diffu względem kryteriów, tylko odczyt |
| `code-researcher` | sonnet | domyślny | fakty z kodu z `plik:linia` |
| `kzr-researcher` | sonnet | domyślny | dosłowne cytaty KZR albo „brak podstawy” |
| `kzr-expert` | sonnet | high | specjalista KZR: odpowiedź z interpretacją, każde twierdzenie na cytacie (dok. · § · str.), poziom pewności `WPROST`/`WNIOSKOWANIE`/`BRAK PODSTAWY`; cache tekstu ze stronami w `Dokumenty KZR\.tekst\` |
| `history-researcher` | sonnet | domyślny | tablica, archiwum analiz, (na zlecenie) arkusze klientów |
| `site-auditor` | sonnet | domyślny | inwentarz i audyt techniczny docuwatcher.com przez EMCP, tylko odczyt (treść, menu, SEO, wydajność, linki) |
| `web-copywriter` | sonnet | domyślny | teksty i SEO podstron docuwatcher.com; każde twierdzenie o produkcie z odwołaniem do faktu `F-xx` |
| `elementor-builder` | sonnet | domyślny | jedna podstrona jako szkic w Elementorze przez EMCP wg prototypu i tekstów; bez publikacji i ustawień witryny |
| `test-runner` | haiku | low | pełny zestaw testów → PASS / lista failów |
| `board-ops` | haiku | low | operacje na tablicy przy zamknięciu zadania |
| `committer` | haiku | low | commit + push + `In review` |

Zasady: przy delegowaniu skille nie przekazują parametru `model` (model jest w
definicji agenta); Haiku tylko do mechaniki; implementerzy są wznawiani
(`SendMessage`), a nie uruchamiani od nowa. Przerwy w zadaniu — notatka w
`C:\DocuWatcherWorkspace\.claude\handoff\<KEY>.md` i nowa sesja („kontynuuj T-XXX”).

## Tablica zadań

Zadania DocuWatcher żyją wyłącznie na tablicy GitHub Projects
(`https://github.com/users/NowyPG97/projects/1`) — 230 ticketów z
`tickets.md`/`PROGRESS.md` zmigrowano 2026-09-28, pliki leżą w `Archiwum/`.
Konfiguracja nowej maszyny i procedura po zmianie pól tablicy:
[`skills/github-project-tasks/reference/SETUP.md`](skills/github-project-tasks/reference/SETUP.md).

## Tworzenie nowego skilla

1. Stwórz katalog pod `skills/nazwa-skilla/`
2. Dodaj `SKILL.md` z frontmatterem:

   ```markdown
   ---
   name: nazwa-skilla
   description: Konkretny opis + słowa-kluczowe, po których Claude rozpozna, kiedy odpalić skill
   ---

   Treść instrukcji...
   ```

3. Dłuższe referencje, przykłady czy skrypty trzymaj w osobnych plikach obok `SKILL.md` — Claude doczyta je tylko gdy będą potrzebne
4. Otwórz Pull Requesta do review

## Wskazówki przy pisaniu `description`

- Pisz w trzeciej osobie, zacznij od czasownika akcji
- Wypisz konkretne słowa-kluczowe, które powinny wyzwalać skill
- Unikaj ogólników typu "pomaga z różnymi zadaniami"

## Wersjonowanie

Aktualizacje pluginu odbywają się przez zwykły `git push` do tego repo.
**Przy każdej zmianie skilli podbij `version` w `.claude-plugin/plugin.json`**
— Claude Code trzyma zainstalowany plugin w cache per wersja
(`~/.claude/plugins/cache/docuwatcher/docuwatcher-skills/<wersja>/`), więc bez
podbicia `/plugin update` może nie pobrać zmian. Możesz też przypiąć konkretną wersję:

```bash
/plugin install https://github.com/NowyPG97/DocuWatcherClaudeSkills.git#v1.0.0
```

## Odinstalowanie

```bash
/plugin uninstall docuwatcher-skills
```
