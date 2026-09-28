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
| [`github-task-delivery`](skills/github-task-delivery/SKILL.md) | Standardowy przebieg realizacji zadania z tablicy: ustalenie właściwego repo (backend/frontend) → branch → implementacja (z konwencjami `backend-development`/`frontend-development` zależnie od zadania) → testy → (opcjonalnie) black-box → commit/push → zamknięcie zadania (bez mergowania do `main`) |

## Migracja z `tickets.md`/`PROGRESS.md`

Tickety DocuWatcher żyły dotychczas w plikach Markdown (np.
`kzr-mass-balance-tickets.md`, `PROGRESS.md` w `C:\DocuWatcherWorkspace`).
Docelowo trafiają na tablicę GitHub Projects
(`https://github.com/users/NowyPG97/projects/1`). Zanim zaczniesz korzystać
z `github-project-tasks`/`github-task-delivery`, wykonaj jednorazową
konfigurację opisaną w
[`skills/github-project-tasks/reference/SETUP.md`](skills/github-project-tasks/reference/SETUP.md)
(instalacja `gh` CLI, pola projektu, wygenerowanie `field-map.json`).

Dopóki migracja nie jest ukończona, oba źródła (tablica i pliki Markdown)
mogą współistnieć — w razie rozbieżności zapytaj, które jest aktualne dla
danego zadania, zamiast zgadywać.

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

Aktualizacje pluginu odbywają się przez zwykły `git push` do tego repo. Możesz też przypiąć konkretną wersję:

```bash
/plugin install https://github.com/NowyPG97/DocuWatcherClaudeSkills.git#v1.0.0
```

## Odinstalowanie

```bash
/plugin uninstall docuwatcher-skills
```
