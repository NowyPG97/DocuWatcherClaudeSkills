# Gotowe wzorce — do adaptacji, nie do wymyślania od zera

Ten plik zawiera kompletny, poprawny typowo kod dla pięciu wzorców
opisanych w [`../SKILL.md`](../SKILL.md). Cel: gdy implementujesz nową
domenę/funkcję, **adaptuj ten kod** (zmień nazwy, typy, endpointy) zamiast
improwizować od zera — mniej okazji do subtelnego błędu, więcej spójności
między modułami napisanymi w różnych sesjach.

Zakładają `@tanstack/react-query` i `msw` jako zależności — jeśli jeszcze
ich nie ma w `apps/web-app/package.json`, dodaj (`pnpm add @tanstack/
react-query --filter web-app` — już jest; `pnpm add -D msw --filter
web-app` — sprawdź najnowszą stabilną wersję, API v2: `http`/
`HttpResponse`, nie starsze `rest`).

## 1. Współdzielony klient HTTP — `apps/web-app/src/api/httpClient.ts`

Jedyne miejsce budujące URL-e, dołączające auth i parsujące błędy backendu.
Wszystkie moduły `api/<domena>.ts` importują stąd, nie reimplementują tego.

```ts
import { deadlineGuardConfig } from '~/config/deadlineGuardConfig';

export interface ApiErrorInfo {
  status: number;
  code?: string;
  retryable?: boolean;
  ruleCode?: string;
  details?: unknown;
  fieldErrors?: { field: string; message: string }[];
}

export class ApiError extends Error implements ApiErrorInfo {
  status: number;
  code?: string;
  retryable?: boolean;
  ruleCode?: string;
  details?: unknown;
  fieldErrors?: { field: string; message: string }[];

  constructor(message: string, info: ApiErrorInfo) {
    super(message);
    this.name = 'ApiError';
    this.status = info.status;
    this.code = info.code;
    this.retryable = info.retryable;
    this.ruleCode = info.ruleCode;
    this.details = info.details;
    this.fieldErrors = info.fieldErrors;
  }
}

/** Backend zwraca 409 dla konfliktów optymistycznej współbieżności (@Version). */
export function isConcurrencyConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

function normalizeJacksonDate(value: unknown): unknown {
  // Jackson serializuje LocalDate jako [rok, miesiąc, dzień] — nie jako string.
  if (Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === 'number')) {
    const [year, month, day] = value as number[];
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return value;
}

function normalizeDetails(details: unknown): unknown {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    return Object.fromEntries(
      Object.entries(details as Record<string, unknown>).map(([key, value]) => [
        key,
        normalizeJacksonDate(value),
      ])
    );
  }
  return details;
}

async function parseApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    // Odpowiedź nie była JSON-em (np. błąd sieci/gateway) — zostań przy statusText.
  }

  const fieldErrors = Array.isArray(body.errors)
    ? (body.errors as { field: string; message: string }[])
    : undefined;

  return new ApiError(typeof body.message === 'string' ? body.message : response.statusText, {
    status: response.status,
    code: typeof body.code === 'string' ? body.code : undefined,
    retryable: typeof body.retryable === 'boolean' ? body.retryable : undefined,
    ruleCode: typeof body.ruleCode === 'string' ? body.ruleCode : undefined,
    details: normalizeDetails(body.details),
    fieldErrors,
  });
}

export interface RequestJsonOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildScopedUrl(
  path: string,
  workspaceId: number,
  query?: RequestJsonOptions['query']
): string {
  const url = new URL(deadlineGuardConfig.getScopedEndpointUrl(path));
  url.searchParams.set('workspaceId', String(workspaceId));
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export async function requestJson<T>(
  path: string,
  workspaceId: number,
  options: RequestJsonOptions = {}
): Promise<T> {
  const authHeaders = await deadlineGuardConfig.getAuthHeaders();
  const response = await fetch(buildScopedUrl(path, workspaceId, options.query), {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) throw await parseApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
```

## 2. Cienki moduł API domeny — `apps/web-app/src/api/assets.ts`

Zero React tutaj — tylko typy DTO (dokładnie odzwierciedlające backend, bez
generycznego wrappera — patrz `backend-development`) i funkcje wołające
`requestJson`.

```ts
import { requestJson } from './httpClient';

export interface AssetDTO {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateAssetDTO {
  name: string;
}

export function fetchAssets(workspaceId: number): Promise<AssetDTO[]> {
  return requestJson<AssetDTO[]>('/api/assets', workspaceId);
}

export function fetchAsset(workspaceId: number, id: number): Promise<AssetDTO> {
  return requestJson<AssetDTO>(`/api/assets/${id}`, workspaceId);
}

export function createAsset(workspaceId: number, body: CreateAssetDTO): Promise<AssetDTO> {
  return requestJson<AssetDTO>('/api/assets', workspaceId, { method: 'POST', body });
}
```

## 3. Warstwa React Query — `pages/Assets/hooks/useAssetsQueries.ts`

Query key factory + `useQuery`/`useMutation`. Komponent nigdy nie woła
`api/*.ts` ani `fetch` bezpośrednio — zawsze przez te hooki.

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAsset, fetchAsset, fetchAssets } from '~/api/assets';
import type { CreateAssetDTO } from '~/api/assets';

export const assetKeys = {
  all: ['assets'] as const,
  list: (workspaceId: number) => [...assetKeys.all, 'list', workspaceId] as const,
  detail: (workspaceId: number, id: number) => [...assetKeys.all, 'detail', workspaceId, id] as const,
};

export function useAssets(workspaceId: number) {
  return useQuery({
    queryKey: assetKeys.list(workspaceId),
    queryFn: () => fetchAssets(workspaceId),
  });
}

export function useAsset(workspaceId: number, id: number) {
  return useQuery({
    queryKey: assetKeys.detail(workspaceId, id),
    queryFn: () => fetchAsset(workspaceId, id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateAsset(workspaceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssetDTO) => createAsset(workspaceId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.list(workspaceId) });
    },
  });
}
```

Użycie w komponencie:

```tsx
const { currentWorkspaceId } = useWorkspace();
const { data: assets, isLoading, error } = useAssets(currentWorkspaceId!);
const createAssetMutation = useCreateAsset(currentWorkspaceId!);

// ...
await createAssetMutation.mutateAsync({ name: 'Nowy zasób' });
```

**Jednorazowy setup (raz na całą aplikację, jeśli jeszcze nie ma):** dodaj
`QueryClientProvider` blisko korzenia `App.tsx`, obok istniejącego
`<Provider store={store}>`:

```tsx
const queryClient = new QueryClient();
// ...
<QueryClientProvider client={queryClient}>
  <Provider store={store}>{/* ... */}</Provider>
</QueryClientProvider>
```

## 4. Komponent z CSS Modules + tokenami antd

```tsx
// pages/Assets/components/AssetCard.tsx
import { theme } from 'antd';
import type { FunctionComponent } from 'react';
import type { AssetDTO } from '~/api/assets';
import styles from './AssetCard.module.scss';

interface AssetCardProps {
  asset: AssetDTO;
}

export const AssetCard: FunctionComponent<AssetCardProps> = ({ asset }) => {
  const { token } = theme.useToken();

  return (
    <div className={styles.card} style={{ borderColor: token.colorBorderSecondary }}>
      <span className={styles.name}>{asset.name}</span>
    </div>
  );
};
```

```scss
// pages/Assets/components/AssetCard.module.scss
.card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 4px;
}

.name {
  font-weight: 500;
}
```

Kolor obramowania idzie z tokenu (`token.colorBorderSecondary`), nie z
hardkodowanego hexa — layout/spacing z modułu SCSS. Jeśli token nie
wystarcza (np. potrzebujesz koloru, którego motyw nie definiuje), zgłoś to
użytkownikowi zamiast dopisywać hex lokalnie.

## 5. MSW — handler + globalny setup testów + test z React Query

```ts
// apps/web-app/src/mocks/handlers/assets.ts
import { http, HttpResponse } from 'msw';
import { deadlineGuardConfig } from '~/config/deadlineGuardConfig';

export const assetsHandlers = [
  http.get(`${deadlineGuardConfig.apiUrl}/api/assets`, () =>
    HttpResponse.json([{ id: 1, name: 'Test asset', status: 'ACTIVE' }])
  ),
];
```

```ts
// apps/web-app/src/mocks/server.ts
import { setupServer } from 'msw/node';
import { assetsHandlers } from './handlers/assets';
// Dopisuj kolejne handlery domen tutaj, w miarę jak powstają.

export const server = setupServer(...assetsHandlers);
```

**Jednorazowy setup (raz na cały projekt testowy, jeśli jeszcze nie ma):**
dodaj `src/setupTests.ts` z cyklem życia serwera MSW i rejestracją
matcherów jest-dom (zamiast powtarzać `expect.extend(jestDomMatchers)` w
każdym pliku), podpięty przez `test.setupFiles` w `vitest.config.ts`:

```ts
// apps/web-app/src/setupTests.ts
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { server } from '~/mocks/server';

expect.extend(jestDomMatchers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Test komponentu konsumującego dane przez React Query:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetsList } from './AssetsList';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AssetsList', () => {
  it('renders assets fetched from the API', async () => {
    renderWithQueryClient(<AssetsList workspaceId={1} />);
    await waitFor(() => expect(screen.getByText('Test asset')).toBeInTheDocument());
  });

  it('renders an empty state when there are no assets', async () => {
    server.use(http.get(`${deadlineGuardConfig.apiUrl}/api/assets`, () => HttpResponse.json([])));
    renderWithQueryClient(<AssetsList workspaceId={1} />);
    await waitFor(() => expect(screen.getByText(/brak zasobów/i)).toBeInTheDocument());
  });
});
```

`onUnhandledRequest: 'error'` w setupie celowo wymusza jawny handler dla
każdego żądania sieciowego, jakie wykona test — nieoczekiwane, nieobsłużone
żądanie ma **zawalić** test, nie ciche przejście dalej z `undefined`.
