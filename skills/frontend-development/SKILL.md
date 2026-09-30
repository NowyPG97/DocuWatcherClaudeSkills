---
name: frontend-development
description: >-
  Use automatically whenever a task touches the DocuWatcher frontend (akademiasaas-boilerplate — React 18 / TypeScript / Vite monorepo, apps/web-app + packages/shared) — pages, components, hooks, Redux slices/thunks, REST data fetching, forms, routing, i18n, styling. E.g. "dodaj widok", "zaimplementuj komponent", "dodaj pole w formularzu", "napisz hooka", "dodaj slice reduxowy", "zmień layout strony", "frontend task". Prescribes clean-code best practices for NEW code: React Query for REST server state, Redux Toolkit only for Firebase/Firestore-synced global state, one shared HTTP client (a foundation task that does not exist yet — never built silently inside a feature task), CSS Modules + antd tokens for styling, small single-responsibility components, no `any`, non-negotiable accessibility, MSW for API test mocking, real bilingual i18n, and the commitlint-enforced "type(scope): desc (T-XXX)" commit format. Not for backend-only (DeadlineGuradBackend), infra/DevOps, or GitHub Project board tasks.
version: 4.0.0
---

# Rozwój frontendu DocuWatcher (Frontend Development)

## Cel

Jak pisać **nowy** kod frontendu `akademiasaas-boilerplate` tak, żeby
spełniał kryteria akceptacji zadania i był czystego, spójnego jakości —
niezależnie od tego, jak wygląda sąsiedni, starszy kod (część istniejącego
kodu, np. `RegisterBatch.tsx`, ~5000 linii, to dług, nie wzorzec).
Gotowy, zweryfikowany kod dla wzorców niżej: [`reference/patterns.md`](reference/patterns.md).

> **Stan fundamentu (2026-09-29): wspólny `httpClient`, `QueryClientProvider`
> i MSW jeszcze NIE istnieją** — patrz `patterns.md` §0. To osobne zadanie
> fundamentowe. Jeśli Twoje zadanie potrzebuje któregoś z nich, a ich nie ma —
> zatrzymaj się i zapytaj użytkownika (zrobić najpierw fundament, czy świadomie
> napisać kod po staremu i zanotować dług). Nie buduj fundamentu "przy okazji".
Cykl zadania/git obsługuje [`github-task-delivery`](../github-task-delivery/SKILL.md).

## Kiedy używać

Zadanie dotyka `akademiasaas-boilerplate`: strona, komponent, hook, slice,
formularz, routing, wywołanie API, styl, i18n. Nie dla backendu
(`DeadlineGuradBackend`), infra ani tablicy GitHub Projects.

## Zasady

1. **Angielski w kodzie.** Nazwy — zawsze po angielsku; komentarze *dlaczego*
   mogą być po polsku.
2. **i18n bez fallback-only.** Nowy tekst UI: realny klucz w `en.json` **i**
   `pl.json` (`packages/shared/src/translations/{en,pl}/<namespace>.json`).
   Drugi argument `t(key, fallback)` to siatka bezpieczeństwa, nie substytut
   tłumaczenia.
3. **Zero `any`, brak nieuzasadnionego `as`.** Typy odzwierciedlają realny
   DTO backendu (bez wrappera — patrz `backend-development`).
4. **Dostępność nienegocjowalna.** Nigdy nie wyłączaj `jsx-a11y/*`, żeby
   przepchnąć lint — napraw przyczynę.
5. **Małe, jednozadaniowe komponenty.** Kontener (stan/orkiestracja) +
   małe komponenty prezentacyjne per sekcja + wydzielone hooki/helpery.
   Plik zbliżający się do 200–300 linii z wieloma odpowiedzialnościami =
   dziel teraz, nie potem.
6. **DRY w granicach zadania.** Nie twórz kolejnej kopii istniejącej logiki
   (np. czwartego parsera błędów HTTP). Porządki w cudzym kodzie — tylko w
   plikach, które zadanie i tak zmienia; większy dług → propozycja nowego
   ticketu (reguła "Zakres zadania a dług w kodzie" w `github-task-delivery`).
7. **KISS/YAGNI.** Najprostsze rozwiązanie, bez abstrakcji "na zapas".
8. **Nowe zależności — najnowsza stabilna wersja** (`pnpm add ... --filter
   web-app|shared`, potem `pnpm check-deps`).
9. **Testuj to, co może się zepsuć** — nie generuj testów-atrap dla
   czysto prezentacyjnych komponentów.
10. **Commit: `type(scope): opis (T-XXX)`** (commitlint, `commit-msg` hook,
    max 100 znaków). Plain `T-XXX: opis` odrzucony. **Nigdy `--no-verify`.**

## Zarządzanie stanem

| Rodzaj stanu | Narzędzie |
|---|---|
| Dane z REST API DocuWatcher | **React Query** |
| Globalny stan real-time (Firebase/Firestore: user, notifications, subscription, statistics, entitlements) | **Redux Toolkit** |
| Lokalny stan UI (panel, zakładka, draft) | `useState`/`useReducer` komponentu |
| Przekrojowy stan poza `<Provider>` | istniejący `workspaceStore` (hook `useWorkspace`) |

- **REST → React Query, nie ręczny `useState`+`useEffect`+`fetch`.**
  Query key factory na domenę, mutacje invalidują cache, `workspaceId: number
  | null` obsłużone przez `enabled` (nie `!`). Wzorzec: `patterns.md` §3.
  Wymaga `QueryClientProvider` z zadania fundamentowego.
- **Redux tylko dla domen Firebase/Firestore.** `createSlice` w
  `packages/shared/src/store/reducers/<domena>/`, jeden plik na thunk w
  `actions/`, `AppThunk` z `extraArgument` (nie importuj Firebase SDK w
  komponencie), `useAppDispatch`/`useAppSelector`. Nie sięgaj po Redux dla
  danych REST ani stanu czysto lokalnego.
- **`workspaceStore`** — istniejący pub-sub singleton, używaj przez
  `useWorkspace()`, nie twórz nowych analogicznych singletonów bez
  realnej potrzeby (rozważ zwykły Context, zapytaj przed dodaniem).

## Wywołania API

Docelowo jeden `apps/web-app/src/api/httpClient.ts` (`patterns.md` §1 —
ekstrakcja istniejącego `requestJson`/`throwApiError` z `massBalance.ts`):
`requestJson<T>`/`requestBlob`, `ApiError` normalizujący wszystkie kształty
błędów backendu (`ErrorResponseDTO`, `ValidationErrorResponseDTO` — łączy
`errors[].message`, `ruleCode`/`details`) oraz `parseLocalDate`/`parseInstant`
dla dat Jacksona. Do czasu zadania fundamentowego: w nowym module korzystaj z
tego, co już jest, i **nie** dopisuj kolejnego prywatnego parsera błędów. Każdy `api/<domena>.ts` zostaje cienki — typy +
funkcje `fetchX`/`createX`/`updateX` na `requestJson`, żadnej reimplementacji
parsera błędów. Ponad tym: hooki React Query (patrz "Zarządzanie stanem") —
komponent nigdy nie woła `fetch`/`api/*.ts` bezpośrednio.

## Formularze — Ant Design `Form`

- `Form.useForm<T>()` z jawnym, zagnieżdżonym typem wartości;
  `Form.useWatch` do reaktywnych odczytów; `Form.List` dla list pól.
- Sekcje formularza jako osobne komponenty od pierwszego dnia — nie
  fragment JSX w rosnącym pliku.
- Walidacja/logika warunkowa w czystych, nazwanych, testowalnych funkcjach,
  nie inline w JSX.
- Błędy backendu → discriminated union + wyczerpujący `Record` (wzorzec
  `SubmitError`) — dobry, zachowaj.
- Idempotency key POST: `useState(() => crypto.randomUUID())`.
- `App.useApp()` do `message`/`notification`, nie statyczny import.
- Submit/zapis przez `useMutation`, nie ręczny stan `isSubmitting`.

## Stylowanie

Jeden standard: **CSS Modules + tokeny antd**. Każdy nowy komponent —
współlokowany `*.module.scss` na layout; kolory/spacing wyłącznie z
`theme.useToken()`/`appTheme.ts`, nigdy hex na sztywno ani lokalna paleta.
Tailwind tylko tam, gdzie strona już go używa (nie mieszaj z CSS Modules w
jednym pliku). Bez inline `CSSProperties` jako głównego mechanizmu i bez
wstrzykiwanych `<style>` — nadpisanie selektora antd przez `:global()` w
module, z komentarzem *dlaczego*.

## Konwencje React/TypeScript

- Alias `~/*` → `apps/web-app/src/*`.
- Strony: `pages/<Domena>/<Widok>.tsx` (+ lokalne `components/`, `hooks/`);
  API: `api/<domena>.ts` + `api/httpClient.ts`; cross-cutting: `config/`.
- **Routing v5** (`Switch`/`Route`/`useHistory`, nie v6). Lazy-loading
  tylko na granicy `Auth`/`Dashboard`; podstrony w `Dashboard.tsx` to
  tablica tras, importy eager.
- Logikę bramkowania/menu dużego modułu wydzielaj do osobnych, testowanych
  plików (wzorzec: `massBalanceConfigGate.ts`), nie do `Dashboard.tsx`.

## Workflow

1. **Kontekst** — kryteria akceptacji, realny kształt DTO backendu, do
   której kategorii stanu należy nowy stan, czy hook/util już istnieje.
2. **Implementacja** — zgodnie z zasadami wyżej; duplikację po drodze
   eliminuj (też w warstwie HTTP).
3. **Testy** — Vitest + RTL. Sieć mockuj na poziomie `fetch`, nie modułów:
   **MSW** (`mocks/handlers/<domena>.ts`, `patterns.md` §5), a dopóki MSW nie
   jest zainstalowany — `vi.stubGlobal('fetch', ...)`; nigdy nowe
   `vi.mock('~/api/...')`. Nowy `QueryClient` per test (`retry: false,
   gcTime: 0`). Preferuj `findByRole`/`getByLabelText` nad `data-testid`.
   `// @vitest-environment jsdom` per plik (domyślnie `node`), `globals:
   false` — importuj jawnie z `'vitest'` i **wołaj `cleanup()` w
   `afterEach`** (bez `globals` RTL nie sprząta DOM sam), dopóki nie zrobi
   tego `setupTests.ts` z fundamentu. Polyfille antd (`matchMedia`,
   `getComputedStyle`) i `import '~/i18nextConfig'` — wzorzec
   `pages/Dashboard/massBalanceMenu.test.tsx`. `pnpm test --filter web-app` (+ `--filter shared`
   przy zmianie w `packages/shared`).
4. **Lint scoped do zmienionych plików** — hook `pre-commit` uruchamia
   `pnpm precommit` (`check-deps` → `lint-staged` → `check-types` → cały
   `pnpm test`). `lint-staged` robi `prettier --write`, `eslint --fix` **bez**
   `--max-warnings=0` i na końcu `git add .` (patrz pułapka w
   `github-task-delivery` krok 7). `warn`-y (m.in. `no-explicit-any`) nie są
   więc łapane. Przed self review odpal ręcznie:
   `pnpm --filter web-app exec prettier --write <pliki>` i
   `pnpm --filter web-app exec eslint --max-warnings=0 <pliki>` (tylko Twoje
   pliki, nie cały `src`).
5. **Self code review** — bramka, nie lista życzeń:
   - Zero `any`/nieuzasadnionych `as`.
   - Żaden nowy plik nie jest kolejnym monolitem (sekcje/hooki wydzielone).
   - Server state przez React Query, nie ręczny fetch.
   - `api/*.ts` nie dokłada własnego parsera błędów (po fundamencie: używa `httpClient`).
   - Stylowanie: CSS Modules + tokeny, zero hardkodowanych kolorów.
   - i18n: realny klucz w `en` i `pl`.
   - a11y: `alt`/`aria-*`/`label`, żadna reguła `jsx-a11y` nie wyłączona.
   - Hooki: kompletne tablice zależności.
   - Brak `console.log`.
   - Testy: MSW + query'e dostępnościowe, nie głębokie mockowanie modułów.

## Narzędzia

Prettier: `singleQuote`, `semi`, `trailingComma: 'es5'`, `printWidth: 100`.
ESLint — dwie konfiguracje: bazowa `eslint.config.js` (`no-console: error`,
`no-explicit-any: warn` — tu i tak traktowane jako zakaz, `newline-before-return:
warn` — **pisz pustą linię przed `return` sam**: `eslint --fix` odpalany po
prettierze wstawia ją ze złym wcięciem, w repo jest już ~20 takich linii) i
`apps/web-app/.eslintrc.js` (dodaje `react-hooks/exhaustive-deps: warn`,
lokalnie wyłącza `jsx-a11y/anchor-is-valid` — nie polegaj na tym). Oba
`warn`-y są twardym błędem tylko przy ręcznym `--max-warnings=0` (krok 4
workflow), nie przez `pre-commit`. Komendy: `pnpm test`, `pnpm
check-types`, `pnpm precommit` (root, pełny monorepo); `pnpm --filter
web-app lint|test|check-types`. Brak root `pnpm lint`.

## Czego unikać

- `any`, nieuzasadniony `as`, tekst UI na sztywno lub tylko przez fallback.
- Plik-monolit na wzór `RegisterBatch.tsx` — dziel od początku.
- Ręczny `useState`+`useEffect`+`fetch` dla danych REST — React Query.
- Reimplementacja `requestJson`/parsera błędów per domena.
- Budowanie fundamentu (`httpClient`, `QueryClientProvider`, MSW) po cichu w
  zadaniu funkcjonalnym — to osobne zadanie.
- Nadpisywanie istniejących `api/assets.ts`/`api/massBalance.ts` kodem z
  szablonu `notes`.
- Redux dla danych serwerowych albo stanu czysto lokalnego.
- Nowe ad hoc singletony pub-sub na wzór `workspaceStore` bez potrzeby.
- Inline `CSSProperties`/lokalna paleta hex/wstrzykiwany `<style>` zamiast
  CSS Modules + tokenów.
- Wyłączanie reguł `jsx-a11y` żeby przepchnąć lint.
- `vi.mock('~/api/...')` w nowych testach — MSW.
- `console.log`, niekompletne tablice zależności hooków.
- `--no-verify`, gdy hook odrzuci commit — napraw przyczynę.
- Zakładanie istnienia osobnego repo design-system — jedyne źródło prawdy
  to `theme/appTheme.ts`.
