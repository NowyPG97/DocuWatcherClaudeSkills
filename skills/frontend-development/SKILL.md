---
name: frontend-development
description: Use automatically whenever a task touches the DocuWatcher frontend (akademiasaas-boilerplate — React 18 / TypeScript / Vite monorepo, apps/web-app + packages/shared) — pages, components, hooks, Redux slices/thunks, REST data fetching, forms, routing, i18n, styling. E.g. "dodaj widok", "zaimplementuj komponent", "dodaj pole w formularzu", "napisz hooka", "dodaj slice reduxowy", "zmień layout strony", "frontend task". Prescribes clean-code best practices for NEW code in this stack — React Query for REST server state (not manual useState+useEffect fetch), Redux Toolkit reserved for Firebase/Firestore-synced global state only, a single shared HTTP client instead of per-domain duplicated request/error-parsing code, CSS Modules + Ant Design theme tokens for styling (no inline style objects or hardcoded colors), small single-responsibility components (no multi-thousand-line files), strict type safety (no any), non-negotiable accessibility, MSW for API-level test mocking, real bilingual i18n (not fallback-only strings), and the commitlint-enforced "type(scope): desc (T-XXX)" commit format. Deliberately does NOT mirror the legacy MassBalance module's actual patterns where they conflict with clean code — see "Dług techniczny, nie wzorzec" section. Not for backend-only (DeadlineGuradBackend), infra/DevOps, or GitHub Project board tasks.
version: 2.0.0
---

# Rozwój frontendu DocuWatcher (Frontend Development)

## Cel

Ten skill definiuje, **jak powinien wyglądać nowy kod frontendu**
DocuWatcher (`akademiasaas-boilerplate`) — nie jak wygląda dziś. Część
istniejącego kodu (zwłaszcza duże, organicznie rozrośnięte pliki jak
`RegisterBatch.tsx`, ~5000 linii) to dług techniczny, nie wzorzec do
naśladowania. Ten dokument celowo **odchodzi** od kilku realnych wzorców
znalezionych w repo tam, gdzie kolidują z czystym kodem — patrz sekcja
["Dług techniczny, nie wzorzec"](#dług-techniczny-nie-wzorzec) na końcu, gdzie
wprost nazwane są konkretne rzeczy, których **nie** wolno kopiować z
istniejącego kodu, mimo że tam występują.

To, czego **nie** można sobie wymyślić od zera, bo jest realną
infrastrukturą projektu (biblioteki w `package.json`, wersja routera, kształt
DTO z backendu, hook commitlint, struktura monorepo) — zostaje bez zmian i
jest tu opisane jako fakt, nie jako "najlepsza praktyka". Wszystko inne
(zarządzanie stanem, warstwa API, stylowanie, struktura komponentów,
testowanie) jest tu opisane tak, **jak powinno być pisane od teraz**, zgodnie
z ogólnie przyjętymi dobrymi praktykami React/TypeScript — niezależnie od
tego, jak wygląda sąsiedni, starszy kod.

Skill odpowiada za **jak pisać kod frontendu**; cykl życia zadania i git
obsługuje [`github-task-delivery`](../github-task-delivery/SKILL.md), który
ładuje ten skill w kroku implementacji.

## Kiedy używać

Ilekroć zadanie (zlecone przez `github-task-delivery` albo ad hoc) dotyka
`akademiasaas-boilerplate`: strona, komponent, hook, slice/thunk, formularz,
routing, wywołanie API backendu DocuWatcher, styl, tłumaczenia UI. Nie
używaj do zadań czysto backendowych (`DeadlineGuradBackend`),
infrastrukturalnych ani do zarządzania tablicą GitHub Projects.

## Zasady (twarde, nie do złamania)

1. **Język kodu — angielski.** Nazwy komponentów, hooków, zmiennych, typów,
   plików po angielsku. Komentarze tylko o *dlaczego*, nigdy o *co*.
2. **Żaden tekst widoczny dla użytkownika nie jest wpisany na sztywno i
   żadne tłumaczenie nie zostaje "tylko fallbackiem".** Teksty UI zawsze
   przez `react-i18next` (`t(...)`), klucz w
   `packages/shared/src/translations/{en,pl}/<namespace>.json`. Gdy dodajesz
   nowy tekst UI, **dopisz realny klucz do OBU plików JSON (`en` i `pl`) w
   tym samym zadaniu** — drugi argument `t(key, fallback)` to wyłącznie
   siatka bezpieczeństwa na wypadek błędu ładowania zasobów, nie sposób na
   uniknięcie tłumaczenia. Brakujący klucz w jednym z języków traktuj jak
   defekt do naprawienia, nie jak akceptowalny stan.
3. **Zero `any`.** `@typescript-eslint/no-explicit-any` w tym repo jest
   formalnie tylko `warn`, ale w tym skillu traktuj `any` jak twardy błąd —
   nie wprowadzaj go nigdy, łącznie z nowym kodem, nawet jeśli linter by na
   to pozwolił. Typuj dokładnie na podstawie realnego kształtu DTO backendu
   (patrz `backend-development` — DTO nie są owinięte w generyczny
   wrapper, są zwracane wprost). Unikaj `as` poza naprawdę uzasadnionymi,
   udokumentowanymi przypadkami.
4. **Dostępność (a11y) jest nienegocjowalna.** Nigdy nie wyłączaj reguły
   `jsx-a11y/*` lokalnie ani w konfiguracji, żeby "przepchnąć" lint —
   napraw przyczynę (dodaj `alt`, `aria-*`, `label`/`htmlFor`, poprawną
   semantykę). Baza `eslint.config.js` ma `jsx-a11y/anchor-is-valid` jako
   `error` — traktuj to jako podłogę, nie sufit, niezależnie od tego, że
   `apps/web-app/.eslintrc.js` ją lokalnie wyłącza dla starego kodu.
5. **Małe, jednozadaniowe komponenty — twarda dyscyplina rozmiaru.** Strona
   czy formularz **nigdy** nie rośnie do tysięcy linii w jednym pliku.
   Rozdzielaj od pierwszego dnia: komponent-kontener (stan, orkiestracja,
   submit) + małe komponenty prezentacyjne per sekcja/fragment UI +
   wydzielone hooki (`useXForm`, `useXValidation`) + czyste funkcje
   pomocnicze w osobnym pliku. Jeśli podczas implementacji plik zaczyna
   przekraczać ok. 200–300 linii i miesza więcej niż jedną odpowiedzialność
   (fetch danych + walidacja + layout + logika biznesowa), **to sygnał do
   podziału, nie do kontynuowania**.
6. **DRY obejmuje też infrastrukturę, nie tylko logikę biznesową.** Warstwa
   HTTP (budowanie URL-i, nagłówki auth, parsowanie błędów backendu) żyje w
   **jednym** współdzielonym miejscu, nie jest reimplementowana per domena
   (patrz sekcja "Wywołania API" niżej) — to bezpośrednia poprawka
   względem istniejącego stanu repo, gdzie każdy plik `api/*.ts` pisał to
   od nowa.
7. **KISS / YAGNI.** Najprostszy kod, który rozwiązuje problem, bez
   konfigurowalności "na zapas" i bez abstrakcji, których nic jeszcze nie
   potrzebuje.
8. **Nowe zależności — zawsze najnowsza stabilna wersja**, dodawane
   `pnpm add <pkg> --filter web-app` lub `--filter shared`, ze
   sprawdzeniem `pnpm check-deps` (`manypkg check`) po dodaniu.
9. **Testuj to, co realnie może się zepsuć** — nie generuj testów-atrap dla
   czysto prezentacyjnych komponentów bez logiki, ale pokrywaj w pełni
   nową logikę warunkową, walidację, mapowanie danych i integrację z API.
10. **`git commit` w tym repo przechodzi przez commitlint (`husky
    commit-msg`).** Pierwsza linia commita **musi** mieć format
    `type(scope): opis (T-XXX)` (`feat`/`fix`/`refactor`/`chore`, max 100
    znaków; `mass-balance` jako scope dla zmian modułu KZR) — plain
    `T-XXX: opis` zostanie **odrzucony**. `pre-commit` uruchamia pełny
    `pnpm precommit` monorepo (kilka minut) — licz się z czasem, nie
    traktuj go jako zawieszenie. **Nigdy `--no-verify`** — napraw
    format/lint/typy/testy i pozwól hookowi przejść samodzielnie.

## Repozytoria i pakiety DocuWatcher

| Ścieżka | Rola |
|---|---|
| `apps/web-app` | Aplikacja React (Vite) — UI, strony, routing, prezentacja |
| `apps/functions` | Firebase Cloud Functions (poza zakresem tego skilla, chyba że zadanie wprost tego dotyczy) |
| `packages/shared` | `@akademiasaas/shared` — Redux Toolkit store, typy/modele domenowe, tłumaczenia `translations/{en,pl}`, stałe, helpery Firestore |

`packages/shared` jest deklarowane w `apps/web-app/package.json` przez zwykły
zakres semver (**nie** `workspace:`) — świadoma decyzja (`.npmrc`:
`save-workspace-protocol=false`, unika problemów z `manypkg`), pnpm i tak
linkuje pakiet lokalnie. To realna infrastruktura projektu — nie "poprawiaj"
tego na `workspace:*`.

## Zarządzanie stanem — jedna, przewidywalna reguła decyzyjna

Cztery kategorie stanu, cztery różne narzędzia — dobieraj świadomie, nie
domyślnie:

| Rodzaj stanu | Narzędzie | Przykład |
|---|---|---|
| Dane z REST API DocuWatcher (serwerowe, cache'owalne) | **React Query** | lista partii MassBalance, dane assetu |
| Globalny stan zsynchronizowany real-time z Firebase/Firestore | **Redux Toolkit** (istniejący store) | auth/user, notifications, subscription |
| Stan lokalny, efemeryczny UI (otwarty panel, aktywna zakładka, draft formularza) | **`useState`/`useReducer`** komponentu | rozwinięcie sekcji Collapse |
| Przekrojowy stan potrzebny poza drzewem `<Provider>` | istniejący `workspaceStore` (patrz niżej) | aktualny workspace do budowania URL-i API |

### Server state (dane z REST API) — React Query

**Nowe funkcje pobierające dane z REST API DocuWatcher używają React Query
(`@tanstack/react-query`), nie ręcznego `useState`+`useEffect`+`fetch`.**
Biblioteka jest już zależnością — wymaga jednorazowego dodania
`QueryClientProvider` w drzewie `App.tsx`, jeśli jeszcze go nie ma (sprawdź
przed pierwszym użyciem; jeśli brak, dodaj go raz, blisko korzenia
aplikacji, obok istniejącego `<Provider store={store}>`).

- **Warstwa transportu (`api/<domena>.ts`) zostaje wolna od React** — same
  typowane funkcje `fetchX`/`createX`/`updateX` wołające współdzielony
  klient HTTP (patrz sekcja niżej). Żadnego `useQuery` tutaj.
- **Warstwa React Query żyje osobno**, np.
  `apps/web-app/src/pages/<Domena>/hooks/use<Domena>Queries.ts` albo
  `hooks/queries/<domena>.ts` — hooki `useQuery`/`useMutation` opakowujące
  funkcje z `api/<domena>.ts`.
- **Query key factory na domenę**, jedno miejsce prawdy dla kluczy cache:
  ```ts
  export const massBalanceKeys = {
    all: ['massBalance'] as const,
    batches: (workspaceId: number) => [...massBalanceKeys.all, 'batches', workspaceId] as const,
    batch: (workspaceId: number, id: number) => [...massBalanceKeys.batches(workspaceId), id] as const,
  };
  ```
- **Mutacje unieważniają powiązane query** przez `queryClient.invalidateQueries({ queryKey: massBalanceKeys.batches(workspaceId) })` w `onSuccess`, zamiast ręcznego odświeżania stanu po submicie.
- Komponent konsumuje wynik przez zwykłe `const { data, isLoading, error } = useBatches(workspaceId)` — bez duplikowania stanu ładowania/błędu w każdym komponencie osobno.

### Globalny stan real-time (Firebase/Firestore) — Redux Toolkit

Redux (`packages/shared/src/store`) zostaje **wyłącznie** dla domen
powiązanych z Firebase Auth/Firestore wymagających subskrypcji w czasie
rzeczywistym (`user, notifications, subscription, statistics, entitlements,
integrationApiTokens`) — to świadoma, dobra architektonicznie decyzja
(rozdzielenie "server cache" od "globalnego stanu aplikacji"), zachowaj ją
dla nowych domen tego typu:

- Struktura `packages/shared/src/store/reducers/<domena>/`: `reducer.ts`
  (`createSlice`), `types.ts` (typ stanu + `REDUCER_NAME`), `index.ts`
  (re-export), `actions/<akcja>.ts` — **osobny plik na każdy thunk**.
- `AppThunk<T = void> = ThunkAction<T, AppStore, StoreDependencies &
  FirestoreUtils, Action<string>>`, zależności (`firestore`, `db`, `auth`,
  `analytics`, `functions`) wstrzykiwane jako `extraArgument`. Nie
  importuj Firebase SDK bezpośrednio w komponencie.
- W `web-app` używaj typowanych `useAppDispatch`/`useAppSelector`
  (`~/initializeStore`), nie gołego `useDispatch`/`useSelector`.

**Nie sięgaj po Redux dla danych z REST API** (to zadanie React Query) ani
dla stanu czysto lokalnego UI (to zadanie `useState`).

### `workspaceStore` — istniejący pub-sub singleton, nie twórz nowych

`apps/web-app/src/config/workspaceStore.ts` obsługuje jedno wąskie
zagadnienie (aktualny workspace + bootstrap) potrzebne też poza drzewem
`<Provider>` (np. budowanie URL-i API). W komponencie zawsze przez hook
`~/hooks/useWorkspace.ts` — nigdy bezpośrednio z komponentu. **Nie twórz
nowego, analogicznego ad hoc singletonu dla kolejnego przekrojowego
zagadnienia** — jeśli coś podobnego jest naprawdę potrzebne, w pierwszej
kolejności rozważ, czy nie powinno to być zwykły React Context (prostszy,
mniej kodu do utrzymania), i zapytaj użytkownika przed dodaniem kolejnego
globalnego singletonu. Jeśli kiedykolwiek refaktorujesz sam
`workspaceStore`, rozważ oparcie subskrypcji o wbudowany hook React 18
`useSyncExternalStore` zamiast ręcznego `useEffect`+`useState` — ale nie
rób tego przy okazji niezwiązanego zadania.

## Wywołania API — jeden współdzielony klient HTTP, cienkie moduły domenowe

To jest bezpośrednia poprawka względem obserwowanego stanu repo (gdzie
każdy plik `api/*.ts` reimplementował `requestJson`/parsowanie błędów od
zera) — nowy kod tego nie powiela.

- **`apps/web-app/src/api/httpClient.ts`** (dodaj, jeśli jeszcze nie
  istnieje) — jedyne miejsce z:
  - `buildScopedUrl(path, workspaceId, query?)` — na bazie
    `deadlineGuardConfig.getScopedEndpointUrl`;
  - `requestJson<T>(path, workspaceId, options)` — fetch + `Authorization`
    z `deadlineGuardConfig.getAuthHeaders()`;
  - **jedna** funkcja `parseApiError(response)` normalizująca wszystkie
    znane kształty błędów backendu (`ErrorResponseDTO`,
    `ValidationErrorResponseDTO`, warianty z `ruleCode`/`details`) oraz
    daty Jacksona (`[rok, miesiąc, dzień]` → string), zwracająca jedną
    klasę `ApiError extends Error` z opcjonalnymi polami `status, code,
    retryable, ruleCode, details, fieldErrors`.
- **`api/<domena>.ts` zostaje cienki:** typy DTO domeny + funkcje
  `fetchX`/`createX`/`updateX` wołające `requestJson` ze współdzielonego
  klienta. Jeśli domena potrzebuje dodatkowej semantyki błędu (np.
  `isConcurrencyConflict`), dodaj to jako **funkcję pomocniczą**
  operującą na współdzielonym `ApiError` (`isConcurrencyConflict(error)`),
  nie jako całą zduplikowaną klasę błędu per domena.
- Powyżej tej warstwy: hooki React Query (patrz sekcja "Zarządzanie
  stanem") — komponenty nigdy nie wołają `fetch`/`api/*.ts` bezpośrednio z
  `useEffect`.

## Formularze — Ant Design `Form`

Ant Design `Form` pozostaje bibliotekę formularzy tego projektu (migracja
na React Hook Form/Zod/XState była już rozważana i świadomie odrzucona) —
ale pisz go czysto od początku, nie jak jeden rozrastający się plik:

- `Form.useForm<TypedFormValues>()` z jawnym, zagnieżdżonym interfejsem
  wartości formularza.
- `Form.useWatch('pole', form)` (też na ścieżkach zagnieżdżonych) do
  reaktywnych odczytów zamiast ręcznego `onValuesChange`.
- `Form.List name="..."` dla dynamicznych list pól.
- **Formularz dziel na sekcje jako osobne komponenty od pierwszego dnia** —
  komponent-kontener trzyma `form`/stan/submit, każda sekcja to osobny,
  mały komponent przyjmujący `form` i potrzebne propsy, nie fragment JSX w
  środku 5000-liniowego pliku.
- **Walidację i logikę warunkową wydzielaj do czystych, nazwanych,
  testowalnych funkcji** (np. `isGhgRequired(values): boolean`,
  `validateSection3(values): FieldError[]`), a nie jako rozproszone
  inline-warunki w JSX.
- Błędy z backendu mapuj na sekcję/`Alert` przez discriminated union +
  `Record` wymuszający w `tsc` obsługę każdego wariantu — to jest dobry,
  wart zachowania wzorzec z istniejącego kodu (`SubmitError` +
  `SUBMIT_ERROR_SECTION_MAP`).
- Idempotency key po stronie klienta dla POST-ów:
  `useState<string>(() => crypto.randomUUID())` — dobry, wart zachowania
  wzorzec.
- `App.useApp()` (antd 5 context API) do `message.*`/`notification.*`
  zamiast statycznego importu.
- Submit i zapis idą przez `useMutation` z React Query (patrz sekcja
  "Zarządzanie stanem"), nie przez ręcznie pisany stan `isSubmitting`/
  `submitError`.

## Stylowanie — jeden standard: CSS Modules + tokeny antd

Dla nowego kodu obowiązuje **jedno, spójne podejście**, nie wybór "co
akurat robi sąsiedni plik":

- **Każdy nowy komponent dostaje współlokowany `Component.module.scss`**
  (albo `.module.css`) na layout/spacing/strukturę.
- **Kolory, odstępy, typografia — wyłącznie z tokenów antd**
  (`theme.useToken()` / `apps/web-app/src/theme/appTheme.ts`). Nigdy nie
  wpisuj koloru jako surowy hex w kodzie ani nie twórz lokalnej,
  ad hoc palety per moduł. Jeśli motyw nie ma potrzebnego tokenu, zgłoś to
  użytkownikowi zamiast dopisywać wartość lokalnie.
- **Tailwind** — używaj wyłącznie tam, gdzie strona, którą rozszerzasz, już
  go używa; nie wprowadzaj klas Tailwind do nowego komponentu opartego o
  CSS Modules (nie mieszaj dwóch paradygmatów w jednym pliku).
- **Żadnych inline `React.CSSProperties` jako głównego sposobu stylowania**
  i żadnych wstrzykiwanych `<style>{...}</style>` jako obejścia — jeśli
  selektor antd naprawdę wymaga nadpisania, rób to przez `:global()` w
  module SCSS, z komentarzem wyjaśniającym *dlaczego*.
- Nie zmieniaj wartości w `theme/appTheme.ts` przy zwykłym zadaniu.

## Konwencje React / TypeScript

- **Alias `~/*`** → `apps/web-app/src/*` (`tsconfig.json`, `vite.config.ts`,
  `vitest.config.ts` jako `~`) — używaj zamiast długich ścieżek względnych.
- **Struktura folderów `apps/web-app/src`:** strony w
  `pages/<Domena>/<Widok>.tsx` (z lokalnymi `components/`, `hooks/`), API w
  `api/<domena>.ts` + `api/httpClient.ts`, hooki ogólne w `hooks/`,
  konfiguracja cross-cutting w `config/`, motyw w `theme/`.
- **Routing — React Router v5** (`Switch`/`Route`/`useHistory`/
  `useLocation`/`Redirect`, **nie** v6 API — to realna infrastruktura,
  migracja na v6 jest poza zakresem zwykłego zadania). Lazy-loading
  (`React.lazy`+`Suspense`) na granicy `Auth`/`Dashboard` w `App.tsx`;
  wewnątrz `Dashboard.tsx` podstrony rejestrowane w tablicy tras — nowa
  podstrona dołącza się do tej tablicy.
- **Logikę bramkowania/menu dla dużego modułu wydzielaj do osobnych,
  testowanych plików czystej logiki** (wzorzec: `massBalanceConfigGate.ts`,
  `massBalanceMenu.tsx`), nie trzymaj jej w `Dashboard.tsx`.
- **Komponenty funkcyjne, w pełni typowane**, propsy destrukturyzowane w
  sygnaturze, interfejs propsów nad komponentem.

## Workflow

### 1. Zrozum szerszy kontekst

- Przejrzyj opis zadania i kryteria akceptacji.
- Sprawdź realny kształt odpowiedzi backendu (DTO nie są owinięte w
  wrapper — patrz `backend-development`).
- Zdecyduj świadomie, do której z czterech kategorii ("Zarządzanie
  stanem") należy nowy stan — nie kopiuj mechanicznie tego, co robi
  najbliższy istniejący kod, jeśli to niezgodne z tabelą decyzyjną wyżej.
- Sprawdź, czy potrzebny hook/util już istnieje w `packages/shared` albo
  `apps/web-app/src/api|hooks` — nie duplikuj.

### 2. Implementacja

Stosuj zasady i konwencje z sekcji wyżej. Trzymaj się zakresu zadania, ale
duplikację napotkaną po drodze eliminuj (DRY) — również w warstwie HTTP,
jeśli zadanie dotyka kolejnego pliku `api/*.ts`.

### 3. Testy

Stack: **Vitest + React Testing Library + MSW.**

- **Mockuj na poziomie sieci przez MSW** (`msw/node` w setupie Vitest),
  definiując handlery per domenę w `apps/web-app/src/mocks/handlers/
  <domena>.ts` — nie `vi.mock('~/api/<domena>', ...)`. Mockowanie na
  poziomie sieci testuje realny kontrakt (kształt żądania/odpowiedzi), nie
  szczegóły implementacji modułu.
- **Testy z React Query:** renderuj z nowym `QueryClient` per test
  (`retry: false`, `gcTime: 0`) opakowanym w `QueryClientProvider`, żeby
  testy były szybkie i deterministyczne, bez przeciekania cache między
  testami.
- **Preferuj query'e dostępnościowe RTL** (`getByRole`, `getByLabelText`,
  `getByText`) nad `data-testid` — `data-testid` tylko tam, gdzie naprawdę
  nie da się wybrać elementu w sposób odzwierciedlający, jak korzysta z
  niego użytkownik.
- Testy DOM wymagają `// @vitest-environment jsdom` na górze pliku
  (domyślne środowisko to `node`). `globals: false` — importuj
  `describe`/`it`/`expect`/`vi` jawnie z `'vitest'`.
- Standardowe, realne obejścia jsdom dla antd v5 (`window.matchMedia`,
  `window.getComputedStyle` — bug jsdom/nwsapi z `:where()`) to fakt
  infrastruktury testowej, nie dług — skopiuj z istniejącego testu strony.
- Router w testach: `MemoryRouter`/`Route` z `react-router-dom` v5.
- Uruchom `pnpm test --filter web-app` (i `--filter shared`, gdy zmiana
  dotyka `packages/shared`). Przed commitem licz się z pełnym `pnpm
  precommit` monorepo w hooku `pre-commit` (kilka minut).

### 4. Self code review

Zanim uznasz implementację za skończoną, sprawdź:

- **Zero `any`, brak nieuzasadnionych `as`.**
- **Rozmiar i odpowiedzialność komponentów** — żaden nowy/zmieniony plik
  nie stał się kolejnym rozrastającym się monolitem; sekcje formularza,
  logika walidacji i fetch danych są wydzielone.
- **Server state idzie przez React Query**, nie przez ręczny
  `useState`+`useEffect`+`fetch` skopiowany z istniejącego kodu.
- **Brak zduplikowanej logiki HTTP** — nowy `api/*.ts` korzysta ze
  współdzielonego `httpClient`, nie reimplementuje `requestJson`/parsera
  błędów.
- **Stylowanie przez CSS Modules + tokeny antd**, zero hardkodowanych
  kolorów i inline `CSSProperties` jako głównego mechanizmu.
- **i18n** — nowy tekst ma realny klucz w `en.json` **i** `pl.json`, nie
  tylko fallback.
- **Dostępność** — `alt`, `aria-*`, `label`/`htmlFor`; żadna reguła
  `jsx-a11y` nie została lokalnie wyłączona.
- **Hooki** — kompletne tablice zależności (`react-hooks/exhaustive-deps`
  w `apps/web-app` jest efektywnie blokujące przez `--max-warnings=0` —
  traktuj to jak błąd).
- **Sprzątanie efektów** — subskrypcje Firestore/`workspaceStore`, timery.
- **Brak `console.log`** (`no-console: error`).
- **Testy używają MSW i query'ów dostępnościowych**, nie głębokiego
  mockowania modułów.

Problemy napraw **przed** commitem (obsługiwanym przez
`github-task-delivery`).

## Narzędzia i komendy

- **Prettier:** `trailingComma: 'es5'`, `printWidth: 100`, `semi: true`,
  `singleQuote: true`, `endOfLine: 'lf'` (`prettier.config.js`).
- **ESLint — dwie konfiguracje** (fakt repo, nie zmieniaj bez osobnego
  zadania): bazowa `eslint.config.js` (`no-console: error`,
  `@typescript-eslint/no-explicit-any: warn` — w tym skillu i tak
  traktowane jako zakaz, patrz Zasada 3) i `apps/web-app/.eslintrc.js`
  (dodaje `react-hooks/exhaustive-deps: warn`, efektywnie blokujące przez
  `--max-warnings=0`; lokalnie wyłącza `jsx-a11y/anchor-is-valid` — nie
  polegaj na tym złagodzeniu, patrz Zasada 4).
- **Komendy root:** `pnpm dev`, `pnpm test`, `pnpm check-types`, `pnpm
  check-deps`, `pnpm precommit`. **Brak** root `pnpm lint` — lint jest
  per-pakiet (`pnpm --filter web-app lint`).
- **Komendy `apps/web-app`:** `dev`, `build`, `test`, `lint
  (--max-warnings=0)`, `check-types`, `precommit` (`lint-staged`).
- Husky: `pre-commit` → `pnpm precommit`, `commit-msg` → commitlint.

## Dług techniczny, nie wzorzec

Poniższe **istnieje** w repo (głównie w `RegisterBatch.tsx` i innych
plikach modułu MassBalance) i było wcześniej opisane w tym skillu jako
"konwencja projektu". Po ponownym przeglądzie: to dług techniczny,
**nie kopiuj tego do nowego kodu**, nawet jeśli sąsiedni plik tak robi:

- **Pliki komponentów rzędu tysięcy linii** (`RegisterBatch.tsx`, ~5000
  linii) — antywzorzec, nie wzorzec "dużego formularza". Nowy duży
  formularz dziel na sekcje od pierwszego dnia (patrz "Formularze" wyżej).
- **Ręczny `useState`+`useEffect`+`fetch` dla danych z REST API** — zastąp
  React Query (patrz "Zarządzanie stanem").
- **Osobna reimplementacja `requestJson`/parsera błędów w każdym pliku
  `api/*.ts`** — użyj współdzielonego `httpClient` (patrz "Wywołania API").
- **Fallback tłumaczenia jako *jedyne* źródło tekstu** (klucze
  `massBalance.registerBatch.*` nigdy niedopisane do `en.json`/`pl.json`,
  więc UI po angielsku i tak renderuje polski tekst) — dla nowego tekstu
  zawsze dopisuj realne klucze w obu językach (patrz Zasada 2).
- **Inline `CSSProperties` + lokalna paleta hex + wstrzykiwany `<style>`**
  jako sposób stylowania dużego modułu — zastąp CSS Modules + tokenami
  antd (patrz "Stylowanie").
- **Mockowanie modułów `api/*.ts` przez `vi.mock` w testach** — dla nowych
  testów używaj MSW (patrz "Testy").
- **Wyłączanie `jsx-a11y/anchor-is-valid` w `apps/web-app/.eslintrc.js`**
  — nie traktuj tego jako przyzwolenia; nowy kod ma być zgodny z regułą,
  nawet jeśli formalnie jest wyłączona.

## Czego unikać

- Nie pisz kodu frontendu z nazwami w innym języku niż angielski.
- Nie wpisuj tekstu widocznego dla użytkownika na sztywno ani nie polegaj
  wyłącznie na fallbacku `t()` — dopisz realne klucze w `en` i `pl`.
- Nie używaj `any` ani nieuzasadnionego `as`.
- Nie pisz nowego dużego formularza/strony jako jednego rosnącego pliku —
  dziel na komponenty od początku.
- Nie pobieraj danych z REST API przez ręczny `useState`+`useEffect`+
  `fetch` — użyj React Query.
- Nie reimplementuj `requestJson`/parsowania błędów per domena — użyj
  współdzielonego `httpClient`.
- Nie sięgaj po Redux dla danych serwerowych ani dla stanu czysto
  lokalnego UI.
- Nie twórz nowych ad hoc singletonów pub-sub na wzór `workspaceStore` bez
  realnej potrzeby i bez rozważenia zwykłego Context.
- Nie stosuj inline `CSSProperties`/lokalnej palety hex/wstrzykiwanego
  `<style>` jako sposobu stylowania nowego komponentu — CSS Modules +
  tokeny antd.
- Nie wyłączaj żadnej reguły `jsx-a11y` ani innej reguły dostępności, żeby
  przepchnąć lint.
- Nie mockuj modułów `api/*.ts` przez `vi.mock` w nowych testach — MSW.
- Nie zostawiaj `console.log` ani niekompletnych tablic zależności hooków.
- Nie commituj bez self code review i bez testów pokrywających nową
  logikę.
- Nie używaj `--no-verify`, gdy `commit-msg`/`pre-commit` hook odrzuci
  commit — napraw przyczynę.
- Nie zakładaj istnienia osobnego repo design-system — jedyne źródło
  prawdy dla wyglądu to `theme/appTheme.ts`.
