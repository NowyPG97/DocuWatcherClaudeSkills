---
name: backend-development
description: Use automatically whenever a task touches the DocuWatcher backend (DeadlineGuradBackend — Spring Boot 3.5.9 / Java 21 / Maven) — new or changed endpoints, controllers, services, DTOs, entities, repositories, Flyway migrations, or any backend business logic; e.g. "dodaj endpoint", "zaimplementuj serwis", "napisz DTO", "dodaj migrację Flyway", "stwórz encję", "zmień logikę w kontrolerze", "backend task", "popraw walidację w API". Enforces the project's real conventions: per-feature package layout, concrete-class services with constructor injection (interface+impl only for swappable external integrations, no default @Lazy setter injection for new circular dependencies — that's a design smell to fix, not a pattern to copy), manual DTO mapping via static *Factory classes, the existing ErrorResponseDTO/ValidationErrorResponseDTO/GlobalExceptionHandler error contract, a MANDATORY test proving the workspace-ownership check actually rejects cross-workspace access (not just that the check exists), Status ACTIVE/INACTIVE soft delete, Flyway naming, JUnit5/Mockito/AssertJ + AbstractIntegrationTest testing, checking latest dependency versions, and a mandatory self code review pass before finishing. There is zero CI/lint/pre-commit enforcement in this repo (verified) — this skill's rules are the only thing holding the line. Not for frontend-only tasks (akademiasaas-boilerplate), infra/DevOps config, or GitHub Project board management — those are separate skills/scopes.
version: 1.1.0
---

# Rozwój backendu DocuWatcher (Backend Development)

## Cel

Ustandaryzować sposób, w jaki Claude Code implementuje zmiany w backendzie
DocuWatcher (`DeadlineGuradBackend`, Spring Boot 3.5.9 / Java 21 / Maven),
tak żeby kod niezależnie od tego, kto (który Claude, kiedy) go pisze,
wyglądał i zachowywał się spójnie z resztą systemu — zamiast za każdym razem
wymyślać rozwiązanie od nowa. Konwencje poniżej pochodzą z przeglądu realnego
kodu repo (moduły `asset`, `massbalance`, `common`, `exception`, `security`),
nie z ogólnych zasad Springa "z podręcznika".

**[`reference/patterns.md`](reference/patterns.md) zawiera kompletny,
gotowy do adaptacji szkielet nowego modułu** (encja, DTO, `*Factory`,
repozytorium, serwis z ownership-checkiem, kontroler, wpis w
`GlobalExceptionHandler`, walidator cross-field, testy — w tym test
odrzucenia dostępu do cudzego workspace'u wymagany Zasadą 12). Adaptuj go,
zamiast pisać te elementy od zera za każdym razem.

Ten skill **nie** zajmuje się cyklem życia zadania na tablicy ani gitem —
tym orkiestruje [`github-task-delivery`](../github-task-delivery/SKILL.md),
który ładuje ten skill automatycznie w kroku implementacji, gdy zadanie
dotyczy backendu. `backend-development` odpowiada wyłącznie za **jak pisać
kod backendu**, gdy już wiadomo co i w jakim repo.

## Kiedy używać

Automatycznie, ilekroć realizowane zadanie dotyka `DeadlineGuradBackend` —
nowy lub zmieniony endpoint, serwis, DTO, encja, repozytorium, migracja,
reguła biznesowa, integracja. Dotyczy to zarówno pracy zleconej przez
`github-task-delivery`, jak i ad hoc próśb użytkownika o zmianę w backendzie.

Nie używaj do zadań czysto frontendowych (`akademiasaas-boilerplate`),
infrastrukturalnych/DevOps ani do zarządzania tablicą GitHub Projects — to
zakres innych skilli.

## Zasady (twarde, nie do złamania)

1. **Język kodu — angielski.** Nazwy klas, metod, zmiennych, pól, pakietów —
   zawsze po angielsku. Komentarze domenowe/wyjaśniające bywają w tym repo
   po polsku (widać to np. w `WorkspaceService`, `CurrentUser`) — jeśli
   piszesz komentarz tłumaczący regułę biznesową, możesz iść za tym
   istniejącym wzorcem, ale identyfikatory zawsze zostają angielskie.
2. **Trzymaj się konwencji projektu.** Zanim napiszesz nowe rozwiązanie
   jakiegoś typu problemu (mapowanie DTO, walidacja warunkowa, obsługa
   błędu, ownership check), sprawdź jak podobny problem został już
   rozwiązany w module `asset` (prosty przykład) albo `massbalance`
   (złożony przykład z walidacją cross-field) — i zastosuj ten sam wzorzec.
3. **Struktura per-feature, nie per-layer.** Nowy moduł domenowy dostaje
   własny pakiet pod `com.deadlineguard.backend.<modul>/` z podpakietami
   `controller/ dto/ entity/ enumeration/ exception/ factory/ repository/
   service/ validation/` — dokładnie jak `asset/` i `massbalance/`. Nie
   wrzucaj nowej logiki domenowej do współdzielonych top-level pakietów typu
   `common/` — ten jest zarezerwowany dla rzeczy realnie współdzielonych
   między modułami (`common/dto/ErrorResponseDTO`,
   `common/enumeration/Status`).
4. **Nowe zależności — zawsze najnowsza stabilna wersja.** Przed dodaniem
   jakiejkolwiek nowej zależności do `pom.xml` sprawdź jej aktualną, stabilną
   wersję (np. Maven Central), zamiast wpisywać wersję z pamięci. Nie
   wprowadzaj zależności legacy/deprecated, jeśli istnieje aktywnie
   wspierana alternatywa.
5. **Komentarze tylko gdy naprawdę konieczne** — i wtedy o *dlaczego*, nie
   *co*. Projekt ma silny, już istniejący wzorzec komentarzy odwołujących
   się do numeru zadania i reguły biznesowej (np. `// T-70: ...`, odwołania
   do "Reguła 7"/"Reguła 9" w module massbalance) — trzymaj się tego stylu,
   gdy dodajesz kod realizujący konkretny ticket/regułę.
6. **DRY — twarda zasada**, również biorąc pod uwagę kod **poza** zakresem
   realizowanego zadania. Jeśli widzisz, że powstająca logika duplikuje coś,
   co już istnieje gdzie indziej w systemie, wydziel wspólną
   funkcję/klasę/walidator zamiast kopiować.
7. **KISS / YAGNI.** Najprostszy kod, który rozwiązuje problem, bez
   konfigurowalności "na zapas". Sprawdź, jaki jest najprostszy,
   standardowy sposób rozwiązania danego typu problemu w tym repo (nie w
   Springu "w ogóle") i zastosuj go.
8. **Myśl w szerszym kontekście.** Przed i w trakcie implementacji sprawdź,
   jak dane są konsumowane po stronie frontendu (`akademiasaas-boilerplate`)
   — kontrakty API, kształt DTO, nazwy pól — zwłaszcza że DTO tego repo
   **nie** przechodzą przez generyczny wrapper odpowiedzi (patrz niżej), więc
   frontend konsumuje ich kształt wprost.
9. **Pełne pokrycie testami przed commitem — twarda zasada.** Repo **nie ma
   CI ani pre-commit hooków** wymuszających testy automatycznie (sprawdzone:
   brak `.github/`, brak realnych git hooków) — to nie zwalnia z
   dyscypliny, wręcz przeciwnie: nic poza Tobą tego nie złapie. Po realizacji
   zadania napisz kompletne testy jednostkowe oraz integracyjne i uruchom je
   lokalnie przed commitem.
10. **Ustandaryzowana obsługa błędów.** Każdy nowy wyjątek domenowy obsługuj
    przez `GlobalExceptionHandler` (`exception/GlobalExceptionHandler.java`)
    — dodaj tam nowy `@ExceptionHandler`, nie twórz lokalnego handlera w
    kontrolerze (patrz "Czego unikać" — `AssetController` ma taki lokalny,
    zdublowany handler; to stary wzorzec sprzed globalnego handlera, nie
    nowy wzór do naśladowania).
11. **Migracja Flyway wymaga restartu backendu.** Jeśli zadanie wprowadza
    nową migrację Flyway, przed lokalną weryfikacją zrestartuj backend —
    samo napisanie pliku migracji nie wystarczy, żeby zobaczyć efekt w
    bazie.
12. **Każda nowa/zmieniona metoda serwisu scoped workspace'em MUSI mieć
    test, który realnie odrzuca dostęp do cudzego workspace'u — nie
    wystarczy, że kod wywołuje `getWorkspaceEntity`.** To nie jest
    dodatek "gdy starczy czasu" — ownership check jest jedynym
    mechanizmem autoryzacji w tym repo (Zasada "Autoryzacja i
    multi-tenancy" niżej) i ma zero mechanicznego zabezpieczenia poza
    dyscypliną programisty, więc test jest jedyną rzeczą, która wykryje
    jego pominięcie przy kolejnej zmianie. Kilka kontrolerów już to robi
    (`AssetControllerIntegrationTest`, `DeadlineControllerIntegrationTest`,
    `MassBalanceBatchControllerIntegrationTest` i inne) — rozszerz ten
    wzorzec na **każdy** nowy endpoint/metodę tego typu, nie tylko tam,
    gdzie już jest. Zweryfikuj mutacyjnie, że test coś realnie sprawdza:
    tymczasowo usuń wywołanie `getWorkspaceEntity`, potwierdź że test wtedy
    nie przechodzi, przywróć kod — jeśli test przechodzi bez tego
    wywołania, test jest atrapą, nie zabezpieczeniem.

## Konwencje tego repo (nie ogólne konwencje Spring Boot)

- **Serwis = konkretna klasa, nie interfejs+impl — domyślnie.**
  `@RequiredArgsConstructor @Service` na zwykłej klasie (`AssetService`,
  `WorkspaceService`, `MassBalanceBatchService`), bez interfejsu. Wzorzec
  interfejs + `impl/` (jak `EmailService` + `impl/{PostmarkEmailService,
  SmtpEmailService}`) stosuj **tylko** gdy realnie istnieją/będą istnieć
  dwie wymienne implementacje (integracja zewnętrzna z wariantami) — nie
  domyślnie "na wszelki wypadek" dla zwykłego serwisu CRUD.
- **Wstrzykiwanie zależności — konstruktorowe, domyślnie.** `@RequiredArgsConstructor`
  na polach `private final` jest normą w tym repo i ma zostać normą dla
  nowego kodu — jawne zależności, niemutowalność, łatwa testowalność.
  **`@Setter(onMethod_ = {@Autowired, @Lazy}) private XService xService;`
  istnieje w 4 miejscach** (`AssetService`, `FileNodeService`,
  `MassBalanceBatchService`, `WorkspaceService`) jako obejście cyklicznych
  zależności między konkretnymi, już istniejącymi serwisami — to **dług,
  nie domyślny wzorzec do naśladowania w nowym module**. Cykliczna
  zależność między dwoma serwisami to zwykle sygnał złego podziału
  odpowiedzialności, nie problem techniczny do "obejścia" adnotacją. Jeśli
  podczas implementacji nowego modułu Twój serwis zaczyna potrzebować
  serwisu, który potrzebuje Twojego z powrotem: **najpierw** rozważ
  wydzielenie wspólnej logiki do trzeciego serwisu/komponentu domenowego,
  którego oba wywołują, albo przeniesienie jednej strony zależności do
  zdarzenia domenowego (Spring `ApplicationEventPublisher`) zamiast
  bezpośredniego wywołania. Sięgnij po `@Lazy` setter injection tylko gdy
  restrukturyzacja naprawdę nie ma sensu w zakresie zadania — i zapytaj
  użytkownika, zanim to zrobisz, bo to decyzja architektoniczna, nie
  kosmetyczna.
- **Brak generycznego wrappera sukcesu (`ApiResponse<T>`).** Kontrolery
  zwracają DTO (albo `Page<DTO>`) bezpośrednio — nie owijaj odpowiedzi
  sukcesu w dodatkową kopertę, bo w tym repo jej po prostu nie ma i frontend
  jej nie oczekuje.
- **Standard dla błędów — trzy kształty, użyj właściwego:**
  - `common/dto/ErrorResponseDTO` — `{message, code?, retryable?}`, domyślny
    kształt dla większości wyjątków domenowych (np. `*NotFoundException`).
  - `common/dto/ValidationErrorResponseDTO` — `{message, errors:
    [{field, message}]}`, dla błędów Bean Validation
    (`MethodArgumentNotValidException`) — łącz `getFieldErrors()` **i**
    `getGlobalErrors()` (class-level violations z cross-field validatorów
    inaczej się gubią — patrz komentarz `T-70` w
    `GlobalExceptionHandler`).
  - Moduł ma prawo zdefiniować własny kształt błędu, jeśli ma sensowniejszą
    strukturę dla swojej domeny — wzorzec: `massbalance/dto/
    MassBalanceErrorResponseDTO` (`{ruleCode, message, details}`) dla
    naruszeń reguł biznesowych bilansu masy.
- **`GlobalExceptionHandler` (`@Slf4j @RestControllerAdvice`) jest jedynym
  miejscem mapowania wyjątków na HTTP status.** Nowy wyjątek domenowy →
  nowy `@ExceptionHandler` tam, z odpowiednim statusem (404 dla
  `*NotFoundException`, 400 dla walidacji, 403 dla naruszeń
  subskrypcji/uprawnień, 409/422 dla konfliktów reguł biznesowych — patrz
  jak są rozróżniane warianty `MassBalanceBusinessRuleException` po
  `ruleCode`). Integracje zewnętrzne (Vertex AI/gRPC) mapowane osobno na
  429/502/503 — jeśli dodajesz nową integrację zewnętrzną, rozważ
  analogiczne mapowanie zamiast płaskiego 500. Catch-all `RuntimeException`
  → 500 z `log.error`, zostaw to jako ostatnią linię obrony, nie pierwszą.
- **Autoryzacja i multi-tenancy — wzorzec, nie framework.** Każdy endpoint
  scoped do workspace'u przyjmuje `@CurrentUser FirebaseUserPrincipal
  principal` oraz `@RequestParam Long workspaceId` (**nie**
  `@PathVariable`) jako pierwsze dwa parametry. Każda metoda serwisu, która
  operuje na danych workspace'u, **musi** na starcie wywołać
  `workspaceService.getWorkspaceEntity(userId, workspaceId)` (rzuca
  `WorkspaceNotFoundException`, jeśli workspace nie istnieje lub nie należy
  do usera) — to jedyny mechanizm ownership-checku w tym repo, nie ma
  interceptora/aspektu, który zrobiłby to automatycznie. Pomiń ten krok i
  masz lukę autoryzacyjną, nie skrót.
- **DTO — mapowanie ręczne przez statyczne `*Factory`, nie MapStruct.**
  Osobne DTO na Create/Update/Response (`CreateAssetDTO`, `UpdateAssetDTO`,
  `AssetDTO`). Mapowanie encja↔DTO przez klasę `*Factory` z prywatnym
  konstruktorem i statyczną metodą `create(...)` (`AssetDTOFactory.create
  (Asset asset)`, `AssetFactory.create(CreateAssetDTO dto)`) — trzymaj się
  tego wzorca zamiast wprowadzać MapStruct czy ręczne mapowanie rozrzucone
  po serwisie.
- **Walidacja — Bean Validation + customowe walidatory, konwencja
  `Valid<Rule>` / `<Rule>Validator`.** Standardowe adnotacje (`@NotBlank`,
  `@Size`, `@Pattern`) na polach DTO. Warunkowa/cross-field walidacja
  (pole wymagane tylko gdy inne pole ma daną wartość) przez własną
  adnotację class-level + `ConstraintValidator<..., DTO>` w tym samym
  pakiecie `validation/` — wzorzec nazewnictwa: adnotacja `@Valid<Rule>`,
  implementacja `<Rule>Validator` (przykłady w `massbalance/validation/`,
  np. `ValidGhgRequiredIfKzrCompliant` +
  `GhgRequiredIfKzrCompliantValidator`).
- **Soft delete — pole `Status` na każdej encji, nie wspólna base class.**
  `common/enumeration/Status { ACTIVE, INACTIVE }`. Każda encja deklaruje
  własne pole `@Enumerated(EnumType.STRING) private Status status =
  Status.ACTIVE;` (przez `@Builder.Default`) — nie ma `BaseEntity`.
  Repozytoria filtrują query methods po `Status.ACTIVE`
  (`findByIdAndWorkspaceIdAndStatus`). "Usunięcie" = `@Modifying` bulk
  update do `INACTIVE`, kaskadowo dezaktywujący powiązane zasoby (wzorzec:
  `AssetService.deleteAsset` woła `deadlineService
  .deactivateDeadlinesByAssetId` i czyści powiązania w `drive`). **Wyjątek
  świadomy, nie do powielania bez powodu:** moduł `drive` ma własny
  `FileNodeStatus` zamiast reużywać wspólny `Status` — to istniejące
  odstępstwo, nie precedens do kopiowania w nowym module bez konkretnego
  powodu.
- **Migracje Flyway:** `src/main/resources/db/migration/`, nazewnictwo
  `V<major>_<minor>__<Opisowa_Nazwa_Snake_Case_Po_Angielsku>.sql`
  (`V1_19__Add_mass_balance_module.sql`), jedna liniowa sekwencja numerów —
  sprawdź najwyższy istniejący numer przed dodaniem nowej migracji, nie
  zgaduj.
- **Logging — ręczny, brak AOP/interceptora.** Nie ma przekrojowego
  mechanizmu logowania żądań. `@Slf4j` stosuj tam, gdzie realnie pomaga
  (integracje zewnętrzne, miejsca warte logowania jak
  `GlobalExceptionHandler`, `DeadlineNotificationService`) — zwykłe serwisy
  CRUD w tym repo świadomie **nie** logują happy path; nie dodawaj
  `log.info` do każdej metody "żeby było widać co się dzieje", to nie jest
  tutejsza konwencja.

## Workflow

### 1. Zrozum szerszy kontekst

- Przejrzyj opis zadania i powiązane kryteria akceptacji (na tablicy albo w
  `tickets.md`/`PROGRESS.md`, dopóki migracja trwa — zob.
  [`github-project-tasks`](../github-project-tasks/SKILL.md)).
- Sprawdź, jak podobny problem jest już rozwiązany w module `asset` (prosty
  przykład) albo `massbalance` (złożony, z walidacją cross-field i
  własnym kształtem błędu).
- Jeśli zmiana ma kontrakt z frontendem (kształt endpointu, pola DTO), rzuć
  okiem na to, jak frontend go konsumuje (`akademiasaas-boilerplate`), żeby
  uniknąć niezgodności.

### 2. Implementacja

- Stosuj strukturę per-feature i konwencje z sekcji wyżej.
- Nowe zależności dodawaj tylko po sprawdzeniu ich najnowszej stabilnej
  wersji.
- Nie poszerzaj zakresu poza opis zadania — ale duplikację napotkaną po
  drodze eliminuj (DRY), nawet jeśli formalnie leży poza ticketem.
- Jeśli zadanie wprowadza migrację Flyway, po jej dodaniu zrestartuj backend
  lokalnie przed dalszą weryfikacją.

### 3. Testy

Stack: JUnit 5 + Mockito + AssertJ, `org.testcontainers` dostępny jako
zależność.

- **Testy jednostkowe serwisu:** `@ExtendWith(MockitoExtension.class)`,
  `@Mock`/`@InjectMocks`, asercje AssertJ (`assertThat`), `@DisplayName` dla
  czytelności (wzorzec: `AssetServiceTest`).
- **Testy integracyjne kontrolera:** dziedzicz z
  `src/test/java/com/deadlineguard/backend/AbstractIntegrationTest.java`
  (`@SpringBootTest @ActiveProfiles("test") @Transactional`, H2 in-memory,
  Flyway wyłączony, `ddl-auto=create-drop`) + `@AutoConfigureMockMvc` +
  `MockMvc`. Autoryzację mockuj przez `@WithMockFirebaseUser(userId=...)`
  (`src/test/java/.../WithMockFirebaseUser.java`) — nie buduj tokenów
  ręcznie.
- **Testcontainers (Postgres realny) tylko gdy zachowanie jest specyficzne
  dla Postgresa** — realne uruchomienie migracji Flyway, typy/indeksy
  Postgresowe, których H2 nie odtwarza wiernie (wzorzec:
  `MassBalancePoSRepositoryExportPostgresTest`,
  `MassBalanceMigrationIntegrationTest`). Nie używaj Testcontainers jako
  domyślnej bazy testowej "dla pewności" — to spowalnia zestaw bez potrzeby
  w 95% przypadków.
- Testuj też walidatory (`*ValidatorTest`), walidację DTO
  (`Create*DTOValidationTest`) i fabryki (`*DTOFactoryTest`) osobno,
  lustrzanie do struktury `main` — nie tylko przez testy serwisu/kontrolera
  "od góry".
- Uruchom pełny lokalny zestaw (`./mvnw test`, ewentualnie `./mvnw verify`
  jeśli zmiana dotyka czegoś wymagającego Testcontainers) i upewnij się, że
  przechodzi na zielono, zanim przejdziesz dalej.

### 4. Self code review

Zanim uznasz implementację za skończoną, przejrzyj własną zmianę pod kątem:

- **Null Safety** — ryzyko NPE, poprawne użycie `Optional` (nie jako pole
  encji/DTO).
- **Exception Handling** — nowy wyjątek domenowy ma handler w
  `GlobalExceptionHandler`, nie lokalny w kontrolerze; brak połkniętych
  wyjątków.
- **Ownership check** — każda nowa metoda serwisu operująca na danych
  workspace'u faktycznie woła `workspaceService.getWorkspaceEntity(userId,
  workspaceId)` na starcie, **i ma test, który to udowadnia** (Zasada 12) —
  nie tylko czasami, nie tylko dla części metod.
- **Wstrzykiwanie zależności** — konstruktorowe (`@RequiredArgsConstructor`
  na `private final`); jeśli w nowym kodzie pojawia się `@Lazy` setter
  injection dla cyklicznej zależności, to świadoma decyzja podjęta po
  rozważeniu restrukturyzacji (Zasada w sekcji "Konwencje tego repo"), nie
  odruchowe skopiowanie istniejącego wzorca.
- **Collections & Streams** — poprawna, bezpieczna iteracja.
- **Java Idioms** — `equals`/`hashCode` tam, gdzie wymagane, spójne użycie
  Lombok builderów (`@Builder`, `@Singular` dla kolekcji) zgodnie z resztą
  encji/DTO.
- **API Design** — unikanie "boolean trap" w publicznych metodach, pełna
  walidacja wejścia na granicy API (Bean Validation + customowe
  walidatory, nie ręczne if-y w serwisie).
- **Performance** — brak N+1 zapytań, brak konkatenacji stringów w pętli.
- **Soft delete** — nowa encja ma własne pole `status` i repozytorium
  filtruje po `ACTIVE` tam, gdzie to ma znaczenie biznesowe.

Jeśli code review ujawni problem, napraw go **przed** przejściem do
commitu/pusha (obsługiwanego przez `github-task-delivery`).

## Commity

Historia repo pokazuje wzorzec `T-<numer>: opis po polsku` (czasem z
konwencjonalnym prefiksem, np. `feat(mass-balance): ...`) — w odróżnieniu od
frontendu (`akademiasaas-boilerplate`), backend **nie ma** hooka
commitlint wymuszającego format. Mimo braku wymuszenia, trzymaj się
istniejącego wzorca (`T-<numer>: ...` albo `type(scope): opis (T-<numer>)`)
zamiast wymyślać nowy format — spójność historii ułatwia `git log`/`git
blame` po numerze ticketu.

## Dług techniczny, nie wzorzec

Poniższe **istnieje** w repo i było wcześniej opisane w tym skillu jako
neutralna "konwencja projektu" bez zaznaczenia, że to dług. Po ponownym
przeglądzie: nie kopiuj tego do nowego kodu bez świadomej decyzji, nawet
jeśli sąsiedni plik tak robi:

- **`@Setter(onMethod_ = {@Autowired, @Lazy})` jako domyślny sposób na
  cykliczne zależności między serwisami** (4 wystąpienia: `AssetService`,
  `FileNodeService`, `MassBalanceBatchService`, `WorkspaceService`) —
  konstruktorowe wstrzykiwanie jest normą, cykliczna zależność to sygnał do
  restrukturyzacji, nie do obejścia adnotacją (patrz "Konwencje tego
  repo" wyżej).
- **Ręczny ownership-check bez towarzyszącego testu** — część
  istniejących endpointów ma test odrzucenia dostępu do cudzego
  workspace'u, część nie. Dla nowego kodu to obowiązkowe (Zasada 12), nie
  "gdy starczy czasu".
- **Lokalny `@ExceptionHandler` w `AssetController`** obok globalnego
  `GlobalExceptionHandler` — stary wzorzec sprzed wprowadzenia centralnej
  obsługi błędów, nie przykład do naśladowania (patrz Zasada 10).
- **Własny `FileNodeStatus` w module `drive`** zamiast wspólnego
  `common.enumeration.Status` — istniejące, świadome odstępstwo w jednym
  miejscu, nie precedens do powielania w nowym module bez konkretnego
  powodu.

## Czego unikać

- Nie pisz kodu backendu z nazwami w innym języku niż angielski.
- Nie wprowadzaj interfejs+impl dla zwykłego serwisu CRUD "na wszelki
  wypadek" — tylko tam, gdzie realnie są wymienne implementacje.
- Nie owijaj odpowiedzi sukcesu w dodatkowy wrapper (`ApiResponse<T>` czy
  podobny) — ten projekt go nie ma.
- Nie dodawaj lokalnego `@ExceptionHandler` w kontrolerze zamiast
  `GlobalExceptionHandler` (wzorzec w `AssetController` to stary,
  niepowtarzalny dług, nie przykład do naśladowania).
- Nie pomijaj ownership-checku (`workspaceService.getWorkspaceEntity`) w
  nowej metodzie serwisu operującej na danych workspace'u — i nie
  pomijaj testu, który to udowadnia (Zasada 12).
- Nie sięgaj domyślnie po `@Lazy` setter injection przy pierwszej napotkanej
  cyklicznej zależności — najpierw rozważ restrukturyzację, potem, jeśli
  naprawdę potrzeba, zapytaj użytkownika.
- Nie wprowadzaj MapStruct ani innego generatora mapowań — mapowanie idzie
  przez ręczne statyczne `*Factory`.
- Nie kopiuj wzorca `drive`/`FileNodeStatus` (własny enum statusu zamiast
  wspólnego `Status`) do nowego modułu bez konkretnego powodu.
- Nie dodawaj `log.info` do każdej metody serwisu "żeby było widać co się
  dzieje" — logging w tym repo jest celowo oszczędny poza integracjami
  zewnętrznymi.
- Nie licz na CI ani pre-commit hook, który złapie brakujące testy — tego
  tu nie ma, więc dyscyplina testowa jest w 100% na Tobie przed commitem.
- Nie zapominaj o restarcie backendu po dodaniu migracji Flyway przed
  lokalną weryfikacją.
