---
name: backend-development
description: Use automatically whenever a task touches the DocuWatcher backend (DeadlineGuradBackend — Spring Boot 3.5.9 / Java 21 / Maven) — new or changed endpoints, controllers, services, DTOs, entities, repositories, Flyway migrations, or any backend business logic; e.g. "dodaj endpoint", "zaimplementuj serwis", "napisz DTO", "dodaj migrację Flyway", "stwórz encję", "zmień logikę w kontrolerze", "backend task", "popraw walidację w API". Enforces per-feature package layout, concrete-class @Transactional services with constructor injection (interface+impl only for swappable integrations, no default @Lazy setter injection for new circular deps), manual DTO mapping via static *Factory, the ErrorResponseDTO/ValidationErrorResponseDTO/GlobalExceptionHandler error contract, MANDATORY tests for both IDOR variants (foreign workspaceId, and own workspaceId + foreign resource id), Status ACTIVE/INACTIVE soft delete, Flyway naming, JUnit5/Mockito/AssertJ testing, and a mandatory self code review. Zero CI/lint/pre-commit exists in this repo — this skill's rules are the only enforcement. Not for frontend (akademiasaas-boilerplate), infra/DevOps, or GitHub Project board tasks.
version: 3.0.0
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
2. **Wzorcem jest ten skill i `reference/patterns.md`, nie dowolny
   sąsiedni kod.** `asset` (prosty) i `massbalance` (złożony, walidacja
   cross-field) pokazują strukturę pakietów, fabryki, `@Transactional` i
   ownership check — ale mają też dług, którego **nie kopiuj**: lokalne
   `@ExceptionHandler` w `AssetController` (i 7 innych kontrolerach —
   dublują handlery z `GlobalExceptionHandler`) oraz `@Lazy` setter injection.
3. **Struktura per-feature.** Nowy moduł: własny pakiet
   `com.deadlineguard.backend.<modul>/` z `controller/ dto/ entity/
   enumeration/ exception/ factory/ repository/ service/ validation/`. Nie
   dokładaj domenowej logiki do `common/` (tylko realnie współdzielone:
   `ErrorResponseDTO`, `Status`).
4. **Nowe zależności — najnowsza stabilna wersja** (sprawdź Maven Central
   przed dodaniem do `pom.xml`).
5. **Komentarze tylko *dlaczego*.**
6. **DRY w granicach zadania.** Nie duplikuj logiki, która już istnieje.
   Porządki w cudzym kodzie — tylko w plikach, które zadanie i tak zmienia;
   większy dług → propozycja nowego ticketu (reguła "Zakres zadania a dług w
   kodzie" w `github-task-delivery`).
7. **KISS/YAGNI.** Najprostsze, standardowe dla *tego repo* rozwiązanie.
8. **Sprawdź kontrakt z frontendem** — DTO nie są owinięte w wrapper, więc
   frontend konsumuje kształt wprost.
9. **Pełne pokrycie testami przed commitem.** Repo nie ma CI ani
   pre-commit hooków — nic poza Tobą tego nie złapie.
10. **Nowy wyjątek → `GlobalExceptionHandler`**, nigdy lokalny
    `@ExceptionHandler` w kontrolerze.
11. **Migracja Flyway wymaga restartu backendu** przed lokalną weryfikacją.
12. **Każdy nowy endpoint na zasobie workspace'u wymaga testów obu
    wariantów IDOR** — ownership check to jedyny mechanizm autoryzacji w
    repo, bez żadnego mechanicznego zabezpieczenia:
    - wariant 1: cudzy `workspaceId` → 404 (blokuje `getWorkspaceEntity`),
    - wariant 2: **własny** `workspaceId` + id zasobu z cudzego workspace'u
      → 404 i brak zmiany zasobu (blokuje wyłącznie filtr `workspaceId` w
      zapytaniu repozytorium).
    Sam wariant 1 przechodzi nawet przy `findById(id)` — sprawdzone
    mutacyjnie. Zweryfikuj mutacyjnie: usuń ownership check / filtr
    `workspaceId`, potwierdź że odpowiedni test pada, przywróć kod.

## Konwencje tego repo

- **Serwis = konkretna klasa** (`@RequiredArgsConstructor @Service`), nie
  interfejs+impl — chyba że realnie istnieją wymienne implementacje (wzorzec:
  `EmailService`+`impl/{Postmark,Smtp}`).
- **`@Transactional` na każdej publicznej metodzie serwisu**
  (`readOnly = true` dla odczytów) — wzorzec `AssetService`. Metoda wołająca
  `@Modifying` bez transakcji rzuci `TransactionRequiredException`.
- **Wstrzykiwanie konstruktorowe, zawsze.** `@Setter(onMethod_=
  {@Autowired,@Lazy})` dla cyklicznych zależności istnieje dziś w 5
  klasach (`AssetService`, `FileNodeService`, `MassBalanceBatchService`,
  `SubscriptionEntitlementService`, `WorkspaceService`) — to dług, nie wzorzec do naśladowania. Cykliczna
  zależność = sygnał złego podziału odpowiedzialności; najpierw rozważ
  wydzielenie trzeciego serwisu albo `ApplicationEventPublisher`. `@Lazy`
  tylko jako świadoma decyzja — zapytaj użytkownika.
- **Brak wrappera sukcesu.** Kontrolery zwracają DTO/`Page<DTO>` wprost;
  POST tworzący zasób → `@ResponseStatus(HttpStatus.CREATED)`, DELETE →
  `@ResponseStatus(HttpStatus.NO_CONTENT)`.
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
  FirebaseUserPrincipal` (`principal.uid()` to `String`) + `@RequestParam Long workspaceId` (nie
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

1. **Kontekst** — kryteria ukończenia (z tablicy), jak podobny
   problem rozwiązano w `asset`/`massbalance`, kontrakt z frontendem.
2. **Implementacja** — zgodnie z konwencjami wyżej; duplikację po drodze
   eliminuj. Migracja Flyway → restart backendu przed weryfikacją.
3. **Testy** — JUnit5+Mockito+AssertJ. Jednostkowe serwisu
   (`@ExtendWith(MockitoExtension.class)`). Integracyjne: dziedzicz z
   `AbstractIntegrationTest` (H2, `@Transactional`, **Flyway wyłączony**,
   `ddl-auto=create-drop`) + `@AutoConfigureMockMvc`, auth przez
   `@WithMockFirebaseUser(userId = ...)`; `User` i `Workspace` zapisz w
   `@BeforeEach` (wzorzec: `patterns.md` §10). Kontekst nie wstaje z
   `Could not resolve placeholder 'FIREBASE_CREDENTIALS'` → brakuje lokalnej
   konfiguracji środowiska, nie błąd w Twoim kodzie; zgłoś użytkownikowi.
   Testcontainers-Postgres tylko gdy zachowanie jest Postgres-specyficzne
   (Flyway, typy/indeksy) — nie domyślnie. Testuj też walidatory i
   fabryki osobno. `./mvnw test` (lub `verify` z Testcontainers) na
   zielono przed dalszymi krokami.
4. **Self code review** — bramka:
   - Null safety, brak połkniętych wyjątków.
   - Nowy wyjątek ma handler w `GlobalExceptionHandler`, nie lokalny.
   - Ownership check obecny **i** oba warianty IDOR mają testy (Zasada 12).
   - Zapytania o pojedynczy zasób filtrują po `id` **i** `workspaceId`.
   - `@Transactional` na każdej publicznej metodzie serwisu.
   - Zero `@ExceptionHandler` w nowym/zmienianym kontrolerze.
   - Wstrzykiwanie konstruktorowe; `@Lazy` tylko jako świadoma decyzja.
   - Brak N+1, bezpieczna iteracja kolekcji.
   - Pełna walidacja wejścia na granicy API.
   - Soft delete: nowa encja ma `status`, repozytorium filtruje po `ACTIVE`.

## Commity

`type(scope): opis (T-<numer>)` (np. `feat(mass-balance): ... (T-220)`) —
ten sam format co wymuszany commitlintem we froncie. Backend nie ma
commitlint, ale historia zawiera już oba formaty; nowe commity ujednolicamy.

## Czego unikać

- Kod backendu z nazwami w innym języku niż angielski.
- Interfejs+impl dla zwykłego serwisu CRUD bez realnej potrzeby.
- Wrapper odpowiedzi sukcesu (`ApiResponse<T>`) — ten projekt go nie ma.
- Lokalny `@ExceptionHandler` w kontrolerze zamiast `GlobalExceptionHandler`.
- Pominięcie ownership-checku lub któregokolwiek z dwóch testów IDOR.
- Serwis bez `@Transactional`; repozytorium szukające zasobu po samym `id`.
- Kopiowanie lokalnego `@ExceptionHandler` z `AssetController` & co.
- `@Lazy` setter injection jako domyślne rozwiązanie cyklicznej zależności.
- MapStruct zamiast statycznych `*Factory`.
- Kopiowanie `FileNodeStatus`/`drive` (własny enum statusu) bez powodu.
- `log.info` w każdej metodzie serwisu "żeby było widać co się dzieje".
- Poleganie na CI/hookach, których tu nie ma — dyscyplina testowa w 100%
  na Tobie.
- Commit/weryfikacja bez restartu backendu po nowej migracji Flyway.
