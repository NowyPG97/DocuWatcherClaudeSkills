# Gotowe wzorce — do adaptacji, nie do wymyślania od zera

Kompletny kod dla wzorców z [`../SKILL.md`](../SKILL.md), na przykładzie
**fikcyjnej** domeny `notes` (odpowiednik backendowego szablonu `note`).
Nie ma pliku `api/notes.ts` w repo — nie myl z istniejącymi `api/assets.ts`
czy `api/massBalance.ts`, których **nie nadpisuj** tym szablonem.

> **Zweryfikowane (2026-09-29):** §1–§4 skompilowano w `apps/web-app`
> (`tsc --noEmit` — 0 błędów, `eslint --max-warnings=0` — czysto), a `httpClient`
> przeszedł testy runtime na obu kształtach błędów backendu. §5 (MSW)
> **nie** był uruchomiony — `msw` nie jest jeszcze zainstalowany; zweryfikuj go
> w zadaniu fundamentowym.

## 0. Fundament — stan na 2026-09-29: NIE ISTNIEJE

Wzorce §1, §3 i §5 zakładają infrastrukturę, której w repo jeszcze nie ma:

| Element | Stan dziś |
|---|---|
| `api/httpClient.ts` | brak — najlepsza implementacja żyje prywatnie w `api/massBalance.ts` (`requestJson`, `throwApiError`, `parseLocalDate`, `parseInstant`); `api/assets.ts` ma własny `parseErrorBody` |
| `QueryClientProvider` | brak (`@tanstack/react-query` ^5 jest w zależnościach, nieużywany) |
| `msw` | brak w zależnościach |
| `setupTests` | `src/setupTests.js` to pozostałość po CRA, **niepodpięta** (`vitest.config.ts` nie ma `setupFiles`, `environment: 'node'`, `globals: false`) |

To jest **jedno osobne zadanie fundamentowe**, nie efekt uboczny zadania
funkcjonalnego (patrz "Zakres zadania a dług" w `github-task-delivery`).
Zakres zadania fundamentowego:

1. `api/httpClient.ts` wg §1 — **ekstrakcja** z `massBalance.ts`, potem
   `massBalance.ts` i `assets.ts` przepięte na nią (`MassBalanceApiError` może
   zostać aliasem/podklasą `ApiError`, żeby nie ruszać konsumentów).
2. `QueryClientProvider` w `App.tsx` wg §3.
3. `pnpm add -D msw --filter web-app` + `src/setupTests.ts` wg §5 (usuń
   `setupTests.js`), podpięty przez `test.setupFiles`.
4. Po wykonaniu: zaktualizuj tę sekcję i `SKILL.md` ("istnieje, używaj").

Dopóki fundamentu nie ma, zadanie funkcjonalne **pyta użytkownika**, zamiast
budować go po cichu.

## 1. Współdzielony klient HTTP — `apps/web-app/src/api/httpClient.ts`

Jedyne miejsce budujące URL-e, dołączające auth i parsujące błędy backendu.

```ts
import { deadlineGuardConfig } from '~/config/deadlineGuardConfig';

export interface FieldErrorDTO {
  field: string | null;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public ruleCode?: string,
    public details?: Record<string, unknown>,
    public fieldErrors?: FieldErrorDTO[]
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** HTTP 409 = konflikt optymistycznej współbieżności (@Version) — retry, nie błąd reguły. */
  get isConcurrencyConflict(): boolean {
    return this.status === 409;
  }
}

/**
 * Backend serializuje `LocalDate` jako `[rok, miesiąc, dzień]` (Jackson
 * `WRITE_DATES_AS_TIMESTAMPS`), nie jako string ISO — normalizujemy do `yyyy-MM-dd`.
 */
export function parseLocalDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    const [year, month, day] = raw as number[];

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return String(raw);
}

/** `Instant` przychodzi jako liczba `epochSekundy.ułamek` — normalizujemy do ISO. */
export function parseInstant(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    const [epochSecond, nanoAdjustment] = raw as number[];

    return new Date(epochSecond * 1000 + Math.round((nanoAdjustment ?? 0) / 1e6)).toISOString();
  }
  if (typeof raw === 'number') return new Date(raw * 1000).toISOString();

  return String(raw);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback = `HTTP error! status: ${response.status}`;
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return new ApiError(fallback, response.status);
  }
  if (!isRecord(data)) return new ApiError(fallback, response.status);

  // ValidationErrorResponseDTO: `message` to zawsze ogólne "Validation failed" —
  // właściwa treść (także błędy klasowe z `field: null`) jest w `errors[].message`.
  const fieldErrors = Array.isArray(data.errors)
    ? data.errors
        .filter(isRecord)
        .filter(
          (e): e is Record<string, unknown> & { message: string } =>
            typeof e.message === 'string' && e.message.length > 0
        )
        .map((e) => ({ field: typeof e.field === 'string' ? e.field : null, message: e.message }))
    : [];

  const message =
    fieldErrors.length > 0
      ? fieldErrors.map((e) => e.message).join(' ')
      : typeof data.message === 'string'
        ? data.message
        : fallback;

  return new ApiError(
    message,
    response.status,
    typeof data.ruleCode === 'string' ? data.ruleCode : undefined,
    isRecord(data.details) ? data.details : undefined,
    fieldErrors.length > 0 ? fieldErrors : undefined
  );
}

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
}

function buildUrl(path: string, workspaceId: number, query?: Record<string, QueryValue>): string {
  // Jawny workspaceId zamiast polegania na globalnym workspaceStore (getScopedEndpointUrl).
  const url = new URL(deadlineGuardConfig.getEndpointUrl(path));
  url.searchParams.set('workspaceId', String(workspaceId));
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function send(path: string, workspaceId: number, options: RequestOptions): Promise<Response> {
  const headers = await deadlineGuardConfig.getAuthHeaders(); // zawiera już Content-Type
  const response = await fetch(buildUrl(path, workspaceId, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw await toApiError(response);

  return response;
}

export async function requestJson<T>(
  path: string,
  workspaceId: number,
  options: RequestOptions = {}
): Promise<T> {
  const response = await send(path, workspaceId, options);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function requestBlob(
  path: string,
  workspaceId: number,
  options: RequestOptions = {}
): Promise<Blob> {
  const response = await send(path, workspaceId, options);

  return response.blob();
}
```

## 2. Cienki moduł API domeny — `apps/web-app/src/api/notes.ts`

Zero Reacta — typy DTO odzwierciedlające backend (bez wrappera) i funkcje na
`requestJson`. Pola `LocalDate`/`Instant` normalizuj `parseLocalDate`/`parseInstant`
w funkcji mapującej, zanim dotrą do komponentu.

```ts
import { requestJson } from './httpClient';

export interface NoteDTO {
  id: number;
  title: string;
  content: string | null;
}

export interface CreateNoteDTO {
  title: string;
  content?: string;
}

/** Spring `Page<T>` — kształt zwracany wprost przez backend (bez wrappera). */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export function fetchNotes(workspaceId: number, page = 0, size = 20): Promise<Page<NoteDTO>> {
  return requestJson<Page<NoteDTO>>('/api/notes', workspaceId, { query: { page, size } });
}

export function fetchNote(workspaceId: number, id: number): Promise<NoteDTO> {
  return requestJson<NoteDTO>(`/api/notes/${id}`, workspaceId);
}

export function createNote(workspaceId: number, body: CreateNoteDTO): Promise<NoteDTO> {
  return requestJson<NoteDTO>('/api/notes', workspaceId, { method: 'POST', body });
}

export function deleteNote(workspaceId: number, id: number): Promise<void> {
  return requestJson<void>(`/api/notes/${id}`, workspaceId, { method: 'DELETE' });
}
```

## 3. Warstwa React Query — `pages/Notes/hooks/useNotesQueries.ts`

Query key factory + `useQuery`/`useMutation`. Komponent nigdy nie woła
`api/*.ts` ani `fetch` bezpośrednio. `workspaceId` może być `null` (brak
wybranego workspace'u w `useWorkspace()`) — obsłuż to przez `enabled`, nie `!`.

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNote, deleteNote, fetchNote, fetchNotes } from '~/api/notes';
import type { CreateNoteDTO } from '~/api/notes';

export const noteKeys = {
  all: ['notes'] as const,
  lists: (workspaceId: number) => [...noteKeys.all, 'list', workspaceId] as const,
  list: (workspaceId: number, page: number) => [...noteKeys.lists(workspaceId), page] as const,
  detail: (workspaceId: number, id: number) =>
    [...noteKeys.all, 'detail', workspaceId, id] as const,
};

export function useNotes(workspaceId: number | null, page = 0) {
  return useQuery({
    queryKey: noteKeys.list(workspaceId ?? -1, page),
    queryFn: () => fetchNotes(workspaceId as number, page),
    enabled: workspaceId !== null,
  });
}

export function useNote(workspaceId: number | null, id: number) {
  return useQuery({
    queryKey: noteKeys.detail(workspaceId ?? -1, id),
    queryFn: () => fetchNote(workspaceId as number, id),
    enabled: workspaceId !== null && Number.isFinite(id),
  });
}

export function useCreateNote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateNoteDTO) => createNote(workspaceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.lists(workspaceId) }),
  });
}

export function useDeleteNote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNote(workspaceId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.lists(workspaceId) }),
  });
}
```

**Setup (zadanie fundamentowe, raz):** `QueryClientProvider` w `App.tsx`, obok
istniejącego `<Provider store={store}>`:

```tsx
const queryClient = new QueryClient();
// ...
<QueryClientProvider client={queryClient}>
  <Provider store={store}>{/* ... */}</Provider>
</QueryClientProvider>
```

## 4. Komponent — CSS Modules + tokeny antd — `pages/Notes/components/NotesList.tsx`

Obsługuje stany ładowania, błędu i pustej listy; tekst przez `t()` z kluczami
w `en`/`pl`; semantyczna lista.

```tsx
import { Alert, Empty, Spin, theme } from 'antd';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotes } from '../hooks/useNotesQueries';
import styles from './NotesList.module.scss';

interface NotesListProps {
  workspaceId: number | null;
}

export const NotesList: FunctionComponent<NotesListProps> = ({ workspaceId }) => {
  const { t } = useTranslation('notes');
  const { token } = theme.useToken();
  const { data, isPending, error } = useNotes(workspaceId);

  if (isPending) return <Spin aria-label={t('loading', 'Loading notes')} />;
  if (error) return <Alert type="error" role="alert" message={error.message} />;
  if (data.content.length === 0) return <Empty description={t('empty', 'No notes yet')} />;

  return (
    <ul className={styles.list} aria-label={t('listLabel', 'Notes')}>
      {data.content.map((note) => (
        <li
          key={note.id}
          className={styles.item}
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <span className={styles.title}>{note.title}</span>
        </li>
      ))}
    </ul>
  );
};
```

```scss
// pages/Notes/components/NotesList.module.scss
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 4px;
}

.title {
  font-weight: 500;
}
```

Layout/spacing w module SCSS, kolor z tokenu (jedyny dopuszczalny inline
`style` to wartość tokenu, której SCSS nie zna). Brakujący kolor w motywie →
zgłoś użytkownikowi zamiast dopisywać hex.

## 5. MSW — setup testów i test komponentu (NIEZWERYFIKOWANE — patrz §0)

Globalny setup (zadanie fundamentowe) — przenosi tu polyfille antd i `cleanup`,
które dziś każdy plik testowy kopiuje u siebie:

```ts
// apps/web-app/src/setupTests.ts
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { server } from '~/mocks/server';

expect.extend(jestDomMatchers);

// `globals: false` → RTL nie rejestruje auto-cleanup; bez tego DOM przecieka między testami.
afterEach(() => cleanup());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

if (typeof window !== 'undefined') {
  // jsdom nie ma matchMedia — wymagane przez responsive observer antd.
  window.matchMedia =
    window.matchMedia ||
    ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
}
```

```ts
// vitest.config.ts — dopisz do `test`:
setupFiles: ['./src/setupTests.ts'],
```

Workaround `getComputedStyle` (jsdom/nwsapi vs `:where()` antd cssinjs) zostaw
per plik, jak w `massBalanceMenu.test.tsx` — podmienia globalną funkcję na atrapę,
więc nie powinien obowiązywać wszystkich testów.

```ts
// apps/web-app/src/mocks/handlers/notes.ts
import { http, HttpResponse } from 'msw';
import { deadlineGuardConfig } from '~/config/deadlineGuardConfig';

export const notesUrl = deadlineGuardConfig.getEndpointUrl('/api/notes');

export const notesHandlers = [
  http.get(notesUrl, () =>
    HttpResponse.json({
      content: [{ id: 1, title: 'Test note', content: null }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    })
  ),
];
```

```ts
// apps/web-app/src/mocks/server.ts
import { setupServer } from 'msw/node';
import { notesHandlers } from './handlers/notes';

export const server = setupServer(...notesHandlers);
```

```tsx
// pages/Notes/components/NotesList.test.tsx
// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/mocks/server';
import { notesUrl } from '~/mocks/handlers/notes';
import { NotesList } from './NotesList';

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('NotesList', () => {
  it('renders notes fetched from the API', async () => {
    renderWithQueryClient(<NotesList workspaceId={1} />);

    expect(await screen.findByText('Test note')).toBeInTheDocument();
  });

  it('renders an error alert when the API fails', async () => {
    server.use(http.get(notesUrl, () => HttpResponse.json({ message: 'Boom' }, { status: 500 })));
    renderWithQueryClient(<NotesList workspaceId={1} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
  });
});
```

`onUnhandledRequest: 'error'` celowo wywala test przy każdym żądaniu bez
handlera. MSW dopasowuje URL bez query stringa, więc `?workspaceId=1&page=0`
trafia w handler `notesUrl`. `getAuthHeaders()` bez zainicjalizowanej aplikacji
Firebase loguje błąd `app-compat/no-app` i zwraca nagłówki bez tokenu — to
szum, nie błąd testu.
