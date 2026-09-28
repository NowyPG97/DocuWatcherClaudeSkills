---
name: frontend-development
description: Use automatically whenever a task touches the DocuWatcher frontend (akademiasaas-boilerplate — React 18 / TypeScript / Vite monorepo, apps/web-app + packages/shared) — pages, components, hooks, Redux slices/thunks, REST API modules, forms, routing, i18n, styling. E.g. "dodaj widok", "zaimplementuj komponent", "dodaj pole w formularzu", "napisz hooka", "dodaj slice reduxowy", "zmień layout strony", "frontend task". Enforces the project's actual conventions: English-only code with UI text via react-i18next, the Redux-only-for-Firebase-domains vs. local-state-for-REST-modules split, the workspaceStore pub-sub singleton, per-module api/*.ts request wrappers over deadlineGuardConfig (React Query is a dependency but NOT actually used — don't introduce it), Ant Design Form conventions from the massbalance module, the commitlint-enforced "type(scope): desc (T-XXX)" commit format, Vitest/RTL testing conventions (no MSW), and a mandatory self code review before finishing. Not for backend-only (DeadlineGuradBackend), infra/DevOps, or GitHub Project board tasks.
version: 1.0.0
---

# Rozwój frontendu DocuWatcher (Frontend Development)

## Cel

Ustandaryzować sposób, w jaki Claude Code implementuje zmiany we frontendzie
DocuWatcher (`akademiasaas-boilerplate`), tak żeby kod, niezależnie od tego
kto go pisze, był spójny z resztą systemu. Skill odpowiada za **jak pisać
kod frontendu**; cykl życia zadania i git obsługuje
[`github-task-delivery`](../github-task-delivery/SKILL.md), który ładuje ten
skill w kroku implementacji. Konwencje poniżej pochodzą z przeglądu realnego
kodu repo (moduł `MassBalance` jako reprezentatywny, świeżo pisany duży
moduł, plus pliki konfiguracyjne najwyższego poziomu), nie z ogólnych zasad
React/Redux "z podręcznika".

## Kiedy używać

Ilekroć zadanie (zlecone przez `github-task-delivery` albo ad hoc) dotyka
`akademiasaas-boilerplate`: strona, komponent, hook, slice/thunk, formularz,
routing, wywołanie API backendu DocuWatcher, styl, tłumaczenia UI. Nie
używaj do zadań czysto backendowych (`DeadlineGuradBackend`),
infrastrukturalnych ani do zarządzania tablicą GitHub Projects.

## Zasady (twarde, nie do złamania)

1. **Język kodu — angielski.** Nazwy komponentów, hooków, zmiennych, typów,
   plików po angielsku. Komentarze bywają po polsku, gdy tłumaczą regułę
   biznesową (silna, istniejąca konwencja w module MassBalance: komentarze
   z odniesieniem do numeru ticketu `T-xxx`) — identyfikatory zostają
   zawsze angielskie.
2. **Żaden tekst widoczny dla użytkownika nie jest wpisany na sztywno.**
   Teksty UI idą przez `react-i18next` (`t(...)`). Tłumaczenia fizycznie
   żyją w **pakiecie** `packages/shared/src/translations/{en,pl}/*.json`
   (nie w `apps/web-app`), namespace'y = pliki: `admin, auth, common,
   dashboard, settings, subscription` (moduł MassBalance nie ma własnego
   namespace'u — jego klucze żyją pod `dashboard`, np.
   `dashboard:massBalance.registerBatch....`). **Zawsze podawaj drugi
   argument `t()` jako fallback** (np. `t('dashboard:massBalance.x.y', 'Opis
   po polsku')`) — to istniejący wzorzec w repo (część kluczy
   `massBalance.registerBatch.*` w ogóle nie jest jeszcze zsynchronizowana
   do plików JSON i w praktyce zawsze renderuje ten fallback, również dla
   `en`). Dodawaj nowe klucze do plików JSON, kiedy to możliwe, ale brak
   klucza w JSON nie jest tu błędem blokującym — to świadomy,
   fallback-first wzorzec tego repo.
3. **Trzymaj się konwencji projektu.** Zanim napiszesz nowe rozwiązanie
   danego typu problemu (formularz, fetch danych, obsługa błędu, struktura
   hooka), sprawdź jak rozwiązano go w module `MassBalance`
   (`apps/web-app/src/pages/MassBalance/`) — to najświeższy, najbardziej
   reprezentatywny duży moduł w repo.
4. **Nowe zależności — zawsze najnowsza stabilna wersja**, dodawane
   `pnpm add <pkg> --filter web-app` lub `--filter shared`. Sprawdź
   `pnpm manypkg check` (`pnpm check-deps`) po dodaniu — repo pilnuje
   spójności wersji między pakietami monorepo.
5. **Komentarze tylko gdy konieczne** — i wtedy o *dlaczego*, nie *co*.
6. **DRY.** Jeśli logika już istnieje jako hook/util w `packages/shared`
   albo `apps/web-app/src`, użyj jej. Duplikację napotkaną po drodze
   eliminuj, nawet gdy leży poza opisem zadania.
7. **KISS.** Najprostszy kod, który rozwiązuje problem.
8. **YAGNI.** Bez propsów/konfigurowalności "na zapas".
9. **Myśl w szerszym kontekście.** Sprawdź realny kształt odpowiedzi
   backendu (`DeadlineGuradBackend`) zamiast zgadywać nazwy pól — backend
   nie owija odpowiedzi w generyczny wrapper, DTO są zwracane wprost, więc
   frontendowe typy powinny je odzwierciedlać 1:1.
10. **`React Query` (`@tanstack/react-query`) jest zależnością, ale
    FAKTYCZNIE nieużywaną w repo** (brak `QueryClientProvider`, zero
    `useQuery`/`useMutation` w `src`). **Nie wprowadzaj go**, chyba że
    użytkownik jawnie o to poprosi — rzeczywista konwencja repo dla
    data-fetchingu REST to ręczny `useState`+`useEffect`+funkcja `async`
    wołająca moduł `api/*.ts` (patrz sekcja niżej). Nazwa `useQuery` w tym
    repo to zresztą **własny** hook czytający query string
    (`hooks/useQuery.ts`), nie hook z tanstacka — nie pomyl ich.
11. **Testy zgodnie ze strategią projektu** (Vitest + React Testing
    Library — **bez MSW**, mockowanie przez `vi.mock`). Dla nowej lub
    zmienianej logiki napisz testy tam, gdzie realnie dodają wartość.
12. **`git commit` w tym repo przechodzi przez commitlint (`husky`
    `commit-msg`).** Pierwsza linia commita **musi** mieć format
    `type(scope): opis (T-XXX)` (`feat`/`fix`/`refactor`/`chore`, max 100
    znaków nagłówka; `mass-balance` jako scope dla zmian modułu KZR) —
    plain `T-XXX: opis` zostanie **odrzucony**. `pre-commit` uruchamia
    `pnpm precommit` (lint-staged w każdym pakiecie + `pnpm check-types` +
    **pełny** `pnpm test` monorepo, kilka minut) — licz się z tym czasem,
    nie traktuj go jako zawieszenie. **Nigdy nie używaj `--no-verify`**, gdy
    hook coś odrzuci — napraw format/lint/typy/testy i pozwól hookowi
    przejść samodzielnie.

## Repozytoria i pakiety DocuWatcher

| Ścieżka | Rola |
|---|---|
| `apps/web-app` | Aplikacja React (Vite) — UI, strony, routing, prezentacja |
| `apps/functions` | Firebase Cloud Functions (poza zakresem tego skilla, chyba że zadanie wprost tego dotyczy) |
| `packages/shared` | `@akademiasaas/shared` — Redux Toolkit store, typy/modele domenowe, tłumaczenia `translations/{en,pl}`, stałe, helpery Firestore |

`packages/shared` jest deklarowane w `apps/web-app/package.json` przez zwykły
zakres semver (**nie** `workspace:`) — to świadoma decyzja (`.npmrc`:
`save-workspace-protocol=false`, unika problemów z `manypkg`), pnpm i tak
linkuje pakiet lokalnie. Nie "poprawiaj" tego na `workspace:*`.

## Redux Toolkit — tylko dla domen zsynchronizowanych z Firebase/Firestore

**Kluczowe rozróżnienie architektoniczne tego repo:** Redux (w
`packages/shared/src/store`) jest używany wyłącznie dla domen powiązanych z
Firebase Auth/Firestore i wymagających subskrypcji w czasie rzeczywistym
(`user, notifications, subscription, statistics, entitlements,
integrationApiTokens`). **Moduły konsumujące REST API DocuWatcher (jak
`MassBalance`) w ogóle nie używają Reduxa** — ich stan (dane referencyjne,
błędy, ładowanie) żyje lokalnie w komponencie przez `useState`/`useEffect`.
Przy nowym module oceń, do której kategorii należy, zamiast domyślnie sięgać
po Redux dla każdego stanu.

Gdy moduł faktycznie potrzebuje Reduxa (bo synchronizuje się z
Firebase/Firestore):

- **Struktura `packages/shared/src/store/reducers/<domena>/`:**
  `reducer.ts` (`createSlice`, eksportuje pojedyncze action creators),
  `types.ts` (typ stanu + `REDUCER_NAME`), `index.ts` (re-export),
  `actions/<akcja>.ts` — **osobny plik na każdy thunk**
  (`actions/logInUser.ts`, `actions/getUserDetails.ts`), reeksportowany
  przez `actions/index.ts`. Slice bez potrzeby osobnych thunków (logika
  trywialna, np. `entitlements`) trzyma je bezpośrednio w `reducer.ts`.
- **`AppThunk<T = void> = ThunkAction<T, AppStore, StoreDependencies &
  FirestoreUtils, Action<string>>`** — zależności (`firestore`, `db`,
  `auth`, `analytics`, `functions`, opcjonalnie `database`, `config`)
  wstrzykiwane jako `extraArgument`, dostarczane w
  `apps/web-app/src/initializeStore.ts`. Nie importuj Firebase SDK
  bezpośrednio w komponencie — idzie przez `extraArgument` thunka.
- W `web-app` używaj typowanych `useAppDispatch`/`useAppSelector`
  (`~/initializeStore`), nie gołego `useDispatch`/`useSelector`.
- Web-app dodaje własne, cienkie thunki w `apps/web-app/src/store/*.ts`,
  importujące `AppThunk`/akcje z `@akademiasaas/shared` i wołające
  web-appowe moduły `api/*.ts` (wzorzec: `store/fetchEntitlements.ts`).

## `workspaceStore` — custom pub-sub singleton

`apps/web-app/src/config/workspaceStore.ts` — moduł-singleton (nie klasa,
nie React Context) ze stanem modułowym i `Set<listener>`, mutacje wołają
`notify()`. Obsługuje **jedno** wąskie zagadnienie przekrojowe: który
workspace jest aktualnie wybrany + stan bootstrapu — potrzebne też **poza**
drzewem `<Provider>` (np. do budowania URL-i API w
`deadlineGuardConfig.getScopedEndpointUrl`), dlatego nie żyje w Reduxie.
W komponencie używaj hooka `~/hooks/useWorkspace.ts` (`const {
currentWorkspaceId } = useWorkspace();`) — nie odwołuj się do
`workspaceStore` bezpośrednio z komponentu, ani nie subskrybuj go ręcznie
poza tym hookiem.

## Wywołania API — `deadlineGuardConfig` + moduł `api/*.ts` na domenę

- `apps/web-app/src/config/deadlineGuardConfig.ts` — singleton:
  `getEndpointUrl`/`getScopedEndpointUrl` (dopisuje `?workspaceId=` z
  `workspaceStore` dla whitelistowanych prefiksów ścieżek), `getAuthHeaders()`
  (async, `Authorization: Bearer <firebase idToken>`).
- **Każda domena ma własny plik `apps/web-app/src/api/<domena>.ts`** z
  własnym wrapperem `requestJson`/`buildUrl` zbudowanym NA BAZIE
  `deadlineGuardConfig` — to świadomy wzorzec repo (brak jednego globalnego
  klienta HTTP), stosuj go dla nowej domeny zamiast wprowadzać
  scentralizowany klient. Wzorzec (patrz `api/massBalance.ts`):
  - dedykowana klasa błędu `extends Error` z `status`, opcjonalnie
    `ruleCode`/`details`/`fieldErrors`, gettery typu `isConcurrencyConflict`
    (`status === 409`);
  - parsowanie ujednoliconego kształtu błędu backendu
    (`ValidationErrorResponseDTO`: `errors[].field/message`, ewentualnie
    `ruleCode`/`details` dla błędów reguł biznesowych — patrz
    `backend-development`) i normalizacja dat Jacksona (`[rok, miesiąc,
    dzień]` → string);
  - jedna eksportowana funkcja na operację REST (`fetchX`, `createX`,
    `updateX`), nie jeden "boczny" generyczny klient.

## Formularze — Ant Design `Form`

Wzorcowy duży formularz: `RegisterBatch.tsx`
(`apps/web-app/src/pages/MassBalance/Batches/`, >30 pól). Konwencje:

- `Form.useForm<TypedFormValues>()` z jawnym interfejsem wartości
  formularza (w tym zagnieżdżonym, np. `characteristics: {...}`).
- Reaktywne odczyty pól przez `Form.useWatch('pole', form)` (też na
  ścieżkach zagnieżdżonych: `Form.useWatch(['characteristics',
  'ghgMethodology'], form)`), nie `onValuesChange` ręcznie sklejane.
- `Form.List name="..."` dla dynamicznych list pól.
- Duże formularze dziel na zwijane sekcje (`Collapse`/`Panel`) z
  auto-rozwijaniem sekcji zawierającej błąd walidacji po nieudanym
  submicie, oraz na mniejsze, reużywalne podformularze/komponenty
  pomocnicze w podkatalogu `components/` tej samej strony (wzorzec:
  `SustainabilityCharacteristicsForm.tsx`, `RegisterBatchFormChrome.tsx` —
  logika/stan w pliku strony, warstwa wizualna wydzielona do `*FormChrome.tsx`).
- Walidacja warunkowa (pole wymagane tylko gdy inne pole ma daną wartość)
  przez `watched*` flagi z `Form.useWatch`, nie przez customowe reguły
  antd tam, gdzie prostszy jest zwykły warunek w JSX/logice sekcji.
- Błędy z backendu mapuj na sekcję/`Alert` przez discriminated union +
  `Record` nad całą unią (wymusza w `tsc`, że nowy wariant błędu dostanie
  miejsce docelowe) — wzorzec `SubmitError`/`SUBMIT_ERROR_SECTION_MAP`.
- Idempotency key po stronie klienta dla POST-ów: `useState<string>(() =>
  crypto.randomUUID())`.
- Używaj `App.useApp()` (antd 5 context API) do `message.*`/`notification.*`
  zamiast statycznego importu `message` z `antd`.
- Formularze REST (jak MassBalance) **nie** korzystają z Redux ani React
  Query — stan lokalny, fetch bezpośrednio z modułu `api/*.ts`.

## Stylowanie — brak jednego obowiązkowego podejścia, zależnie od kontekstu

- **Tailwind** (`tailwind.config.cjs`, `corePlugins.preflight: false` —
  świadomie wyłączony reset, żeby nie kolidować z antd) do drobnych
  utility-klas w ogólnych layoutach.
- **`*.module.scss`** na poziomie starszych stron/layoutów (np.
  `Dashboard.module.scss`).
- **Nowe, świeżo pisane duże moduły feature (wzorzec: MassBalance) NIE
  używają `.module.scss`.** Zamiast tego: obiekty `React.CSSProperties`
  eksportowane ze stałych (np. `registerBatchFormShellStyles`),
  `theme.useToken()` z antd do tokenów, lokalna stała paleta kolorów per
  moduł (np. `REGISTER_BATCH_PALETTE`) zamiast globalnego pliku motywu, i
  — tylko gdy naprawdę potrzeba nadpisać selektor antd nieosiągalny
  inline — jeden scoped `<style>{...}</style>` w komponencie. **Dla nowego
  dużego modułu podążaj za tym wzorcem** (inline `CSSProperties` + tokeny
  antd + lokalna paleta), zamiast zakładać nowy plik `.module.scss`, chyba
  że kontynuujesz istniejącą stronę, która już go używa.
- **Globalny motyw antd:** `apps/web-app/src/theme/appTheme.ts` (tokeny:
  `colorPrimary '#2f90d6'`, `colorSuccess '#1bc5bd'`, `colorWarning
  '#ffa800'`, `colorError '#f64e60'`, `colorInfo '#2c4790'`, `borderRadius
  2`, `fontFamily 'Poppins'`). Nie zmieniaj tych wartości przy zwykłym
  zadaniu; jeśli potrzebujesz koloru/fontu, którego motyw nie ma, zgłoś to
  użytkownikowi zamiast wpisywać lokalnie ad hoc wartość.
- **Brak osobnego repo/design systemu** (nie ma odpowiednika
  `airmatee-design-system`) — jedynym źródłem prawdy dla wyglądu jest
  `theme/appTheme.ts` + `tailwind.config.cjs` + ewentualne lokalne palety
  per moduł. Jeśli użytkownik przekaże makietę/zrzut ekranu z zewnątrz
  (Figma, screenshot), traktuj to jako źródło wyglądu dla tego zadania, ale
  nie zakładaj istnienia formalnego systemu poza tym, co opisano tutaj.

## Konwencje React / TypeScript

- **Alias `~/*`** → `apps/web-app/src/*` (zdefiniowany w `tsconfig.json`,
  `vite.config.ts`, i osobno w `vitest.config.ts` jako `~`). Używaj go
  zamiast długich względnych ścieżek.
- **Struktura folderów `apps/web-app/src`:** strony w
  `pages/<Domena>/<Widok>.tsx` (z lokalnymi `components/`), API w
  `api/<domena>.ts`, hooki domenowe/ogólne w `hooks/`, konfiguracja
  cross-cutting w `config/` (`workspaceStore.ts`, `deadlineGuardConfig.ts`),
  motyw w `theme/`. `modules/` używany rzadko, dla funkcjonalności
  przekrojowej niebędącej stroną (np. `NotificationsDrawer`).
- **Routing — React Router v5** (`Switch`/`Route`/`useHistory`/
  `useLocation`/`Redirect`, **nie** v6 API). Lazy-loading (`React.lazy` +
  `Suspense`) zastosowany **tylko raz**, na granicy `Auth`/`Dashboard` w
  `App.tsx` — wewnątrz `Dashboard.tsx` wszystkie podstrony (włącznie z
  całym modułem MassBalance) są importowane **eager** i zdefiniowane jako
  tablica obiektów trasy (`{ name, path, component, exact, icon, label,
  inMenu, ... }`). Nowa podstrona modułu dołącza się do tej tablicy, a nie
  przez własny `React.lazy`.
- **Logikę bramkowania/menu dla dużego modułu wydzielaj do osobnych,
  testowanych plików czystej logiki** (wzorzec:
  `massBalanceConfigGate.ts`, `massBalanceMenu.tsx`), nie trzymaj jej
  wewnątrz `Dashboard.tsx`.
- **Komponenty funkcyjne, typowane**, propsy destrukturyzowane w sygnaturze
  — sposób eksportu sprawdź w sąsiednim kodzie.

## Workflow

### 1. Zrozum szerszy kontekst

- Przejrzyj opis zadania i kryteria akceptacji.
- Sprawdź, jak podobny problem rozwiązano w module `MassBalance`, oraz czy
  potrzebny hook/util już istnieje w `packages/shared` lub `apps/web-app`.
- Sprawdź realny kształt odpowiedzi backendu (DTO nie są owinięte w
  wrapper — patrz `backend-development`).
- Ustal, czy stan należy do Reduxa (domena Firebase/Firestore) czy do
  lokalnego stanu komponentu (moduł REST) — patrz sekcja wyżej.
- Jeśli zadanie dotyka formularza/UI, sprawdź `RegisterBatch.tsx` po wzorce
  zanim zaczniesz od zera.

### 2. Implementacja

Stosuj zasady i konwencje z sekcji wyżej. Trzymaj się zakresu zadania, ale
duplikację napotkaną po drodze eliminuj (DRY).

### 3. Testy

Stack: **Vitest + React Testing Library, bez MSW** (mockowanie API przez
`vi.mock('~/api/<domena>', ...)` + `vi.hoisted`, nie przechwytywanie
sieci).

- Testy DOM wymagają magicznego komentarza `// @vitest-environment jsdom`
  na górze pliku (środowisko domyślne to `node`). `globals: false` — importuj
  `describe`/`it`/`expect`/`vi` jawnie z `'vitest'`, i zarejestruj matchery
  jest-dom ręcznie: `expect.extend(jestDomMatchers)`.
- Standardowe polyfille/obejścia jsdom dla antd v5 w testach: mock
  `window.matchMedia` oraz obejście `window.getComputedStyle` (bug
  jsdom/nwsapi z selektorami `:where()` z antd cssinjs) — skopiuj wzorzec z
  istniejącego testu strony (np. `Batches.test.tsx`), nie wymyślaj go od
  nowa.
- Mockuj hooki (np. `useWorkspace`) bezpośrednio przez `vi.mock`, zamiast
  próbować sterować realnym `workspaceStore` w teście.
- Router: `MemoryRouter`/`Route` z `react-router-dom` v5.
- Brak fake timers jako domyślnej konwencji — `waitFor` z RTL jest głównym
  mechanizmem oczekiwania na aktualizacje async.
- `data-testid` (albo `data-role` dla elementów jak alerty błędów) tylko
  tam, gdzie potrzebna precyzyjna selekcja.
- Uruchom `pnpm test --filter web-app` (i `--filter shared`, gdy zmiana
  dotyka `packages/shared`) i upewnij się, że przechodzi. Przed commitem
  licz się z tym, że `pre-commit` hook i tak uruchomi pełny `pnpm precommit`
  całego monorepo (kilka minut).

### 4. Self code review

Zanim uznasz implementację za skończoną, sprawdź:

- **Hooki** — kompletne tablice zależności. Uwaga: `react-hooks/
  exhaustive-deps` jest podpięty **tylko** w `apps/web-app/.eslintrc.js`
  (nie w bazowym `eslint.config.js`), formalnie jako `warn`, ale `pnpm
  lint` w web-app uruchamia się z `--max-warnings=0`, więc efektywnie
  blokuje commit — traktuj to ostrzeżenie jak błąd.
- **Sprzątanie efektów** — listenery Firestore, timery, subskrypcje
  `workspaceStore`/hooków.
- **Stan async UI** — ładowanie, błąd i puste dane, nie tylko happy path.
- **Listy** — stabilny, unikalny `key`.
- **i18n** — tekst przez `t()` z fallbackiem po polsku jako drugi argument;
  brak tekstu na sztywno.
- **Typy** — brak nieuzasadnionego `any` (reguła `@typescript-eslint/
  no-explicit-any` jest tylko `warn`, ale unikaj go świadomie), kształt
  danych zgodny z realnym DTO backendu.
- **Dostępność** — `alt`, `aria-*`, `label`/`htmlFor`; `jsx-a11y/
  anchor-is-valid` jest `error` w bazowym configu (wyłączone tylko w
  `apps/web-app/.eslintrc.js` — sprawdź który plik lintujesz).
- **Redux vs. lokalny stan** — nowy stan trafił tam, gdzie należy (patrz
  sekcja wyżej), nie do Reduxa "z automatu".
- **Brak `console.log`** — `no-console: error` w obu configach ESLint.

Problemy napraw **przed** commitem (obsługiwanym przez
`github-task-delivery`).

## Narzędzia i komendy

- **Prettier:** `trailingComma: 'es5'`, `printWidth: 100`, `semi: true`,
  `singleQuote: true`, `endOfLine: 'lf'` (`prettier.config.js`).
  Formatowanie robi `prettier --write` w `lint-staged`, nie ESLint
  (`prettier/prettier: 0` w bazowym configu).
- **ESLint — dwie konfiguracje.** Bazowa `eslint.config.js` (root):
  `no-console: error`, `@typescript-eslint/no-explicit-any: warn`,
  `no-unused-vars` z wyjątkiem prefiksu `_`, `complexity: 0`, brak pluginu
  `react-hooks`. `apps/web-app/.eslintrc.js` rozszerza bazę i **dodaje**
  `eslint-plugin-react-hooks` (`exhaustive-deps: warn`, efektywnie
  blokujące przez `--max-warnings=0`), wyłącza `newline-before-return`,
  `react/display-name`, `jsx-a11y/anchor-is-valid`.
- **Komendy root:** `pnpm dev` (turbo, wszystkie apps), `pnpm test`
  (`vitest run --passWithNoTests`), `pnpm check-types` (turbo), `pnpm
  check-deps` (`manypkg check`), `pnpm precommit` (= check-deps + `lerna
  run precommit` per pakiet + check-types + pełny test). **Brak** root
  `pnpm lint` — lint jest per-pakiet (`pnpm --filter web-app lint`).
- **Komendy `apps/web-app`:** `dev` (vite), `build`, `test` (`vitest run`),
  `lint` (`eslint --max-warnings=0`), `check-types` (`tsc --noEmit`),
  `precommit` (`lint-staged`).
- Husky: `pre-commit` → `pnpm precommit` (pełny monorepo), `commit-msg` →
  commitlint (patrz zasada 12 wyżej).

## Czego unikać

- Nie pisz kodu frontendu z nazwami w innym języku niż angielski.
- Nie wpisuj tekstu widocznego dla użytkownika na sztywno — zawsze przez
  `t()` z fallbackiem, klucz w `packages/shared/src/translations`.
- Nie wprowadzaj `@tanstack/react-query` (`useQuery`/`useMutation`,
  `QueryClientProvider`) — to nieużywana zależność w tym repo, nie wzorzec
  do naśladowania. Nie myl go z lokalnym hookiem `useQuery`
  (`hooks/useQuery.ts`, czyta query string).
- Nie sięgaj po Redux dla stanu modułu REST-owego (jak MassBalance) — tam
  konwencją jest lokalny `useState`/`useEffect`.
- Nie odwołuj się do `workspaceStore` bezpośrednio z komponentu — używaj
  hooka `useWorkspace`.
- Nie twórz nowego, scentralizowanego klienta HTTP — trzymaj się wzorca
  jednego pliku `api/<domena>.ts` na domenę, z własnym `requestJson` i
  własną klasą błędu.
- Nie dodawaj nowego pliku `.module.scss` dla nowego, dużego modułu
  feature — podążaj za wzorcem inline `CSSProperties` + tokeny antd +
  lokalna paleta (jak w MassBalance), chyba że kontynuujesz stronę, która
  już używa SCSS.
- Nie zmieniaj wartości `theme/appTheme.ts` przy zwykłym zadaniu i nie
  wpisuj kolorów/fontów lokalnie zamiast przez tokeny `theme.useToken()`.
- Nie zostawiaj `console.log` ani niekompletnych tablic zależności hooków
  (`react-hooks/exhaustive-deps` w `apps/web-app` jest efektywnie
  blokujące przez `--max-warnings=0`).
- Nie commituj bez testów zgodnych ze strategią projektu (Vitest + RTL, bez
  MSW) i bez self code review.
- Nie używaj `--no-verify`, gdy `commit-msg`/`pre-commit` hook odrzuci
  commit — napraw format wiadomości (`type(scope): opis (T-XXX)`),
  lint, typy albo testy.
- Nie zakładaj istnienia osobnego repo design-system — go tu nie ma; jedyne
  źródło prawdy dla wyglądu to `theme/appTheme.ts` +
  `tailwind.config.cjs` + lokalne palety per moduł.
