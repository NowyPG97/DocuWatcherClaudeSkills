---
name: backend-development
description: Use automatically whenever a task touches the DocuWatcher backend (DeadlineGuradBackend — Spring Boot 3.5.9 / Java 21 / Maven) — new or changed endpoints, controllers, services, DTOs, entities, repositories, Flyway migrations, or any backend business logic; e.g. "dodaj endpoint", "zaimplementuj serwis", "napisz DTO", "dodaj migrację Flyway", "stwórz encję", "zmień logikę w kontrolerze", "backend task", "popraw walidację w API". Enforces per-feature package layout, concrete-class services with constructor injection (interface+impl only for swappable integrations, no default @Lazy setter injection for new circular deps), manual DTO mapping via static *Factory, the ErrorResponseDTO/ValidationErrorResponseDTO/GlobalExceptionHandler error contract, a MANDATORY test proving the workspace-ownership check rejects cross-workspace access, Status ACTIVE/INACTIVE soft delete, Flyway naming, JUnit5/Mockito/AssertJ testing, and a mandatory self code review. Zero CI/lint/pre-commit exists in this repo — this skill's rules are the only enforcement. Not for frontend (akademiasaas-boilerplate), infra/DevOps, or GitHub Project board tasks.
version: 2.0.0
---

# Rozwój backendu DocuWatcher (Backend Development)

## Cel

Jak pisać **nowy** kod backendu `DeadlineGuradBackend` tak, żeby spełniał
kryteria akceptacji zadania i był spójny z resztą systemu. Konwencje z
przeglądu realnego kodu (`asset`, `massbalance`, `common`, `exception`,
`security`), nie z ogólnych zasad Springa. Gotowy szkielet modułu do
adaptacji: [`reference/patterns.md`](reference/patterns.md). Cykl
zadania/git obsługuje [`github-task-delivery`](../github-task-delivery/SKILL.md).

## Kiedy używać

Zadanie dotyka `DeadlineGuradBackend` — endpoint, serwis, DTO, encja,
repozytorium, migracja, reguła biznesowa. Nie dla frontendu
(`akademiasaas-boilerplate`), infra ani tablicy GitHub Projects.

## Zasady

1. **Angielski w kodzie.** Nazwy — zawsze po angielsku; komentarze
   *dlaczego* (np. odwołania do numeru ticketu/reguły biznesowej) mogą być
   po polsku, zgodnie z istniejącym wzorcem.
2. **Trzymaj się konwencji projektu** — sprawdź `asset` (prosty przykład)
   albo `massbalance` (złożony, walidacja cross-field) przed wymyśleniem
   nowego rozwiązania.
3. **Struktura per-feature.** Nowy moduł: własny pakiet
   `com.deadlineguard.backend.<modul>/` z `controller/ dto/ entity/
   enumeration/ exception/ factory/ repository/ service/ validation/`. Nie
   dokładaj domenowej logiki do `common/` (tylko realnie współdzielone:
   `ErrorResponseDTO`, `Status`).
4. **Nowe zależności — najnowsza stabilna wersja** (sprawdź Maven Central
   przed dodaniem do `pom.xml`).
5. **Komentarze tylko *dlaczego*.**
6. **DRY**, także poza zakresem zadania — duplikację napotkaną po drodze
   eliminuj.
7. **KISS/YAGNI.** Najprostsze, standardowe dla *tego repo* rozwiązanie.
8. **Sprawdź kontrakt z frontendem** — DTO nie są owinięte w wrapper, więc
   frontend konsumuje kształt wprost.
9. **Pełne pokrycie testami przed commitem.** Repo nie ma CI ani
   pre-commit hooków — nic poza Tobą tego nie złapie.
10. **Nowy wyjątek → `GlobalExceptionHandler`**, nigdy lokalny
    `@ExceptionHandler` w kontrolerze.
11. **Migracja Flyway wymaga restartu backendu** przed lokalną weryfikacją.
12. **Każda nowa metoda serwisu scoped workspace'em wymaga testu
    odrzucenia cross-workspace access** — ownership check to jedyny
    mechanizm autoryzacji w repo, bez żadnego mechanicznego
    zabezpieczenia. Zweryfikuj mutacyjnie: usuń wywołanie, potwierdź że
    test wtedy pada, przywróć kod.

## Konwencje tego repo

- **Serwis = konkretna klasa** (`@RequiredArgsConstructor @Service`), nie
  interfejs+impl — chyba że realnie istnieją wymienne implementacje (wzorzec:
  `EmailService`+`impl/{Postmark,Smtp}`).
- **Wstrzykiwanie konstruktorowe, zawsze.** `@Setter(onMethod_=
  {@Autowired,@Lazy})` dla cyklicznych zależności istnieje dziś w 4
  miejscach (`AssetService`, `FileNodeService`, `MassBalanceBatchService`,
  `WorkspaceService`) — to dług, nie wzorzec do naśladowania. Cykliczna
  zależność = sygnał złego podziału odpowiedzialności; najpierw rozważ
  wydzielenie trzeciego serwisu albo `ApplicationEventPublisher`. `@Lazy`
  tylko jako świadoma decyzja — zapytaj użytkownika.
- **Brak wrappera sukcesu.** Kontrolery zwracają DTO/`Page<DTO>` wprost.
- **Błędy — trzy kształty:** `ErrorResponseDTO` (`{message, code?,
  retryable?}`, domyślny), `ValidationErrorResponseDTO` (`{message,
  errors:[{field,message}]}` dla Bean Validation — łącz `getFieldErrors()`
  **i** `getGlobalErrors()`), własny kształt per moduł gdy uzasadnione
  (wzorzec: `MassBalanceErrorResponseDTO {ruleCode, message, details}`).
- **`GlobalExceptionHandler`** — jedyne miejsce mapowania wyjątków na HTTP
  status (404 `*NotFoundException`, 400 walidacja, 403 uprawnienia,
  409/422 konflikty reguł biznesowych, integracje zewnętrzne →
  429/502/503, catch-all `RuntimeException` → 500).
- **Autoryzacja — wzorzec, nie framework.** Endpoint: `@CurrentUser
  FirebaseUserPrincipal` + `@RequestParam Long workspaceId` (nie
  `@PathVariable`) jako pierwsze parametry. Każda metoda serwisu na danych
  workspace'u: `workspaceService.getWorkspaceEntity(userId, workspaceId)`
  na starcie — pomiń i masz lukę autoryzacyjną (patrz Zasada 12).
- **DTO — ręczne mapowanie przez statyczne `*Factory`** (prywatny
  konstruktor + `create(...)`), nie MapStruct.
- **Walidacja** — Bean Validation na polach + cross-field przez
  `@Valid<Rule>`/`<Rule>Validator` w `validation/` (wzorzec:
  `massbalance/validation/`).
- **Soft delete** — pole `Status {ACTIVE,INACTIVE}` na każdej encji (nie
  `BaseEntity`), repozytoria filtrują po `ACTIVE`, "usunięcie" = `@Modifying`
  bulk update do `INACTIVE` z kaskadową dezaktywacją powiązań. Wyjątek
  `drive`/`FileNodeStatus` (własny enum) — nie kopiuj bez powodu.
- **Flyway:** `V<major>_<minor>__Opis_Po_Angielsku.sql`, sprawdź najwyższy
  istniejący numer przed dodaniem.
- **Logging — ręczny, brak AOP.** `@Slf4j` tam, gdzie realnie pomaga
  (integracje zewnętrzne); zwykłe serwisy CRUD nie logują happy path.

## Workflow

1. **Kontekst** — kryteria akceptacji (tablica/`tickets.md`), jak podobny
   problem rozwiązano w `asset`/`massbalance`, kontrakt z frontendem.
2. **Implementacja** — zgodnie z konwencjami wyżej; duplikację po drodze
   eliminuj. Migracja Flyway → restart backendu przed weryfikacją.
3. **Testy** — JUnit5+Mockito+AssertJ. Jednostkowe serwisu
   (`@ExtendWith(MockitoExtension.class)`). Integracyjne: dziedzicz z
   `AbstractIntegrationTest` (H2, `@Transactional`) +
   `@AutoConfigureMockMvc`, auth przez `@WithMockFirebaseUser`.
   Testcontainers-Postgres tylko gdy zachowanie jest Postgres-specyficzne
   (Flyway, typy/indeksy) — nie domyślnie. Testuj też walidatory i
   fabryki osobno. `./mvnw test` (lub `verify` z Testcontainers) na
   zielono przed dalszymi krokami.
4. **Self code review** — bramka:
   - Null safety, brak połkniętych wyjątków.
   - Nowy wyjątek ma handler w `GlobalExceptionHandler`, nie lokalny.
   - Ownership check obecny **i** ma test (Zasada 12) w każdej nowej
     metodzie.
   - Wstrzykiwanie konstruktorowe; `@Lazy` tylko jako świadoma decyzja.
   - Brak N+1, bezpieczna iteracja kolekcji.
   - Pełna walidacja wejścia na granicy API.
   - Soft delete: nowa encja ma `status`, repozytorium filtruje po `ACTIVE`.

## Commity

Wzorzec `T-<numer>: opis` albo `type(scope): opis (T-<numer>)` — brak
commitlint w tym repo, ale trzymaj się istniejącego wzorca dla spójności
`git log`/`git blame`.

## Czego unikać

- Kod backendu z nazwami w innym języku niż angielski.
- Interfejs+impl dla zwykłego serwisu CRUD bez realnej potrzeby.
- Wrapper odpowiedzi sukcesu (`ApiResponse<T>`) — ten projekt go nie ma.
- Lokalny `@ExceptionHandler` w kontrolerze zamiast `GlobalExceptionHandler`.
- Pominięcie ownership-checku lub testu, który go udowadnia.
- `@Lazy` setter injection jako domyślne rozwiązanie cyklicznej zależności.
- MapStruct zamiast statycznych `*Factory`.
- Kopiowanie `FileNodeStatus`/`drive` (własny enum statusu) bez powodu.
- `log.info` w każdej metodzie serwisu "żeby było widać co się dzieje".
- Poleganie na CI/hookach, których tu nie ma — dyscyplina testowa w 100%
  na Tobie.
- Commit/weryfikacja bez restartu backendu po nowej migracji Flyway.
