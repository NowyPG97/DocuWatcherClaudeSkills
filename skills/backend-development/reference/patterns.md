# Gotowy szkielet nowego modułu — do adaptacji, nie do wymyślania od zera

Kompletny szkielet modułu domenowego `com.deadlineguard.backend.note`
(fikcyjna funkcja "notatka w workspace'ie"), zgodny z [`../SKILL.md`](../SKILL.md).
Adaptuj nazwy/pola/logikę, ale **zachowaj strukturę** — zwłaszcza
`@Transactional`, ownership check w serwisie i **oba** testy IDOR (Zasada 12).

> **Zweryfikowane:** ten kod skompilowano i uruchomiono w `DeadlineGuradBackend`
> (commit `c55a7e3`, 2026-09-29) — 6/6 testów zielonych. Test mutacyjny:
> po zamianie zapytania na `findById(noteId)` pada dokładnie test wariantu 2.
> Jeśli zmieniasz sygnatury wspólnych klas (`WorkspaceService`, `User`,
> `Workspace`, `WithMockFirebaseUser`), zaktualizuj ten plik.

Rzeczywiste typy, na których opiera się szablon:

| Klasa | Pakiet | Uwaga |
|---|---|---|
| `Status` | `common.enumeration` | `ACTIVE`/`INACTIVE` |
| `FirebaseUserPrincipal` | `security` | record, `uid()` zwraca **`String`** |
| `WorkspaceService.getWorkspaceEntity(String userId, Long workspaceId)` | `workspace.service` | rzuca `WorkspaceNotFoundException` → 404 |
| `Workspace` | `workspace.entity` | pole `User user` (nie `userId`) |
| `User` | `user.entity` | `@Id String id` = Firebase uid; `status` typu `user.enumeration.UserStatus` |
| `AbstractIntegrationTest`, `WithMockFirebaseUser` | `com.deadlineguard.backend` (test) | H2, `@Transactional`, Flyway wyłączony |

## 1. Encja — `note/entity/Note.java`

```java
@Entity
@Table(name = "notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;
}
```

## 2. DTO — `note/dto/CreateNoteDTO.java`, `note/dto/NoteDTO.java`

```java
public record CreateNoteDTO(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 10_000) String content
) {}
```

```java
@Builder
public record NoteDTO(Long id, String title, String content) {}
```

Rekordy dla prostych, niemutowalnych DTO. Jeśli rozszerzasz moduł, który
konsekwentnie używa klas Lombok (`@Data`/`@Builder`), trzymaj się tego stylu
w obrębie modułu.

## 3. Fabryki — `note/factory/NoteFactory.java`, `note/factory/NoteDTOFactory.java`

```java
public final class NoteFactory {

    private NoteFactory() {}

    public static Note create(CreateNoteDTO dto, Workspace workspace) {
        return Note.builder()
                .workspace(workspace)
                .title(dto.title())
                .content(dto.content())
                .build();
    }
}
```

```java
public final class NoteDTOFactory {

    private NoteDTOFactory() {}

    public static NoteDTO create(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .build();
    }
}
```

## 4. Repozytorium — `note/repository/NoteRepository.java`

Każde zapytanie o pojedynczy zasób filtruje **i po `id`, i po `workspaceId`** —
to jest druga warstwa ochrony IDOR (wariant 2 w teście niżej).

```java
public interface NoteRepository extends JpaRepository<Note, Long> {

    Optional<Note> findByIdAndWorkspaceIdAndStatus(Long id, Long workspaceId, Status status);

    Page<Note> findByWorkspaceIdAndStatus(Long workspaceId, Status status, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Note n SET n.status = :status WHERE n.id = :id AND n.workspace.id = :workspaceId")
    int updateStatusByIdAndWorkspaceId(
            @Param("id") Long id, @Param("workspaceId") Long workspaceId, @Param("status") Status status);
}
```

`@Modifying` wymaga aktywnej transakcji — metoda serwisu, która go woła,
**musi** mieć `@Transactional` (inaczej `TransactionRequiredException`).

## 5. Wyjątek — `note/exception/NoteNotFoundException.java`

```java
public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException(Long id) {
        super("Note not found: " + id);
    }
}
```

Handler **tylko** w `exception/GlobalExceptionHandler.java` (Zasada 10):

```java
@ExceptionHandler(NoteNotFoundException.class)
public ResponseEntity<ErrorResponseDTO> handleNoteNotFound(NoteNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponseDTO(ex.getMessage()));
}
```

## 6. Serwis — `note/service/NoteService.java`

Ownership check jako pierwsza linia każdej metody, `@Transactional` na każdej
metodzie publicznej (`readOnly = true` dla odczytów) — tak jak w `AssetService`.

```java
@RequiredArgsConstructor
@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final WorkspaceService workspaceService;

    @Transactional
    public NoteDTO createNote(String userId, Long workspaceId, CreateNoteDTO dto) {
        Workspace workspace = workspaceService.getWorkspaceEntity(userId, workspaceId);
        Note note = NoteFactory.create(dto, workspace);
        return NoteDTOFactory.create(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public Page<NoteDTO> getNotes(String userId, Long workspaceId, Pageable pageable) {
        workspaceService.getWorkspaceEntity(userId, workspaceId);
        return noteRepository.findByWorkspaceIdAndStatus(workspaceId, Status.ACTIVE, pageable)
                .map(NoteDTOFactory::create);
    }

    @Transactional(readOnly = true)
    public NoteDTO getNote(String userId, Long workspaceId, Long noteId) {
        workspaceService.getWorkspaceEntity(userId, workspaceId);
        Note note = noteRepository.findByIdAndWorkspaceIdAndStatus(noteId, workspaceId, Status.ACTIVE)
                .orElseThrow(() -> new NoteNotFoundException(noteId));
        return NoteDTOFactory.create(note);
    }

    @Transactional
    public void deleteNote(String userId, Long workspaceId, Long noteId) {
        workspaceService.getWorkspaceEntity(userId, workspaceId);
        int updated = noteRepository.updateStatusByIdAndWorkspaceId(noteId, workspaceId, Status.INACTIVE);
        if (updated == 0) {
            throw new NoteNotFoundException(noteId);
        }
    }
}
```

Wstrzykiwanie konstruktorowe (`@RequiredArgsConstructor` + `private final`),
nie `@Setter`/`@Lazy`. Jeśli `NoteService` zacznie potrzebować serwisu, który
potrzebuje `NoteService` z powrotem — przemyśl granice modułu (patrz SKILL.md).

## 7. Kontroler — `note/controller/NoteController.java`

`@CurrentUser` + `@RequestParam Long workspaceId` jako pierwsze parametry,
`201` dla POST, `204` dla DELETE, **zero** `@ExceptionHandler` w kontrolerze.

```java
@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public NoteDTO createNote(
            @CurrentUser FirebaseUserPrincipal principal,
            @RequestParam Long workspaceId,
            @Valid @RequestBody CreateNoteDTO dto) {
        return noteService.createNote(principal.uid(), workspaceId, dto);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Page<NoteDTO> getNotes(
            @CurrentUser FirebaseUserPrincipal principal,
            @RequestParam Long workspaceId,
            Pageable pageable) {
        return noteService.getNotes(principal.uid(), workspaceId, pageable);
    }

    @GetMapping(value = "/{noteId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public NoteDTO getNote(
            @CurrentUser FirebaseUserPrincipal principal,
            @RequestParam Long workspaceId,
            @PathVariable Long noteId) {
        return noteService.getNote(principal.uid(), workspaceId, noteId);
    }

    @DeleteMapping("/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(
            @CurrentUser FirebaseUserPrincipal principal,
            @RequestParam Long workspaceId,
            @PathVariable Long noteId) {
        noteService.deleteNote(principal.uid(), workspaceId, noteId);
    }
}
```

## 8. Migracja Flyway — `db/migration/V1_<kolejny>__Add_notes_table.sql`

Sprawdź najwyższy numer w `src/main/resources/db/migration/` (np. `ls | sort -V | tail -1`):

```sql
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_notes_workspace_id ON notes(workspace_id);
```

Testy integracyjne działają na H2 z `ddl-auto=create-drop` i **wyłączonym
Flyway** — nie weryfikują migracji. Migrację sprawdza restart lokalnego
backendu na Postgresie albo test Testcontainers (wzorzec:
`massbalance/migration/*MigrationTest.java`).

## 9. Testy jednostkowe serwisu — `note/service/NoteServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    private static final String USER_ID = "user-a";

    @Mock private NoteRepository noteRepository;
    @Mock private WorkspaceService workspaceService;
    @InjectMocks private NoteService noteService;

    @Test
    @DisplayName("createNote saves a note scoped to the caller's workspace")
    void createNote_savesScopedNote() {
        Workspace workspace = Workspace.builder().id(1L).build();
        when(workspaceService.getWorkspaceEntity(USER_ID, 1L)).thenReturn(workspace);
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteDTO result = noteService.createNote(USER_ID, 1L, new CreateNoteDTO("Title", "Content"));

        assertThat(result.title()).isEqualTo("Title");
    }

    @Test
    @DisplayName("getNote rejects a workspace the caller does not own")
    void getNote_rejectsForeignWorkspace() {
        when(workspaceService.getWorkspaceEntity(USER_ID, 99L))
                .thenThrow(new WorkspaceNotFoundException(99L));

        assertThatThrownBy(() -> noteService.getNote(USER_ID, 99L, 1L))
                .isInstanceOf(WorkspaceNotFoundException.class);

        // Serwis musi odrzucić dostęp, zanim w ogóle dotknie danych.
        verifyNoInteractions(noteRepository);
    }
}
```

## 10. Test integracyjny — oba warianty IDOR — `note/controller/NoteControllerIntegrationTest.java`

**Wymagany Zasadą 12.** Dwa różne ataki, dwie różne warstwy obrony:

| Wariant | Atakujący wysyła | Co go blokuje |
|---|---|---|
| 1 | cudzy `workspaceId` + cudzy zasób | `workspaceService.getWorkspaceEntity` |
| 2 | **własny** `workspaceId` + id zasobu z cudzego workspace'u | wyłącznie filtr `workspaceId` w zapytaniu repozytorium |

Test tylko wariantu 1 przechodzi nawet wtedy, gdy repozytorium szuka po
samym `id` — to realna luka, której pojedynczy test nie wykryje.

```java
import com.deadlineguard.backend.AbstractIntegrationTest;
import com.deadlineguard.backend.WithMockFirebaseUser;
import com.deadlineguard.backend.user.entity.User;
import com.deadlineguard.backend.user.enumeration.UserStatus;
import com.deadlineguard.backend.user.repository.UserRepository;
import com.deadlineguard.backend.workspace.repository.WorkspaceRepository;
// + MockMvc, static MockMvcRequestBuilders.*, MockMvcResultMatchers.*, AssertJ

@AutoConfigureMockMvc
class NoteControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NoteRepository noteRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private UserRepository userRepository;

    private Workspace workspaceA;
    private Workspace workspaceB;
    private Note noteInWorkspaceA;

    @BeforeEach
    void setUp() {
        User userA = userRepository.save(User.builder()
                .id("user-a").timezone("Europe/Warsaw").language("pl").status(UserStatus.ACTIVE).build());
        User userB = userRepository.save(User.builder()
                .id("user-b").timezone("Europe/Warsaw").language("pl").status(UserStatus.ACTIVE).build());
        workspaceA = workspaceRepository.save(Workspace.builder().user(userA).name("Workspace A").build());
        workspaceB = workspaceRepository.save(Workspace.builder().user(userB).name("Workspace B").build());
        noteInWorkspaceA = noteRepository.save(
                Note.builder().workspace(workspaceA).title("Secret").status(Status.ACTIVE).build());
    }

    @Test
    @WithMockFirebaseUser(userId = "user-a")
    void createNote_returnsCreatedNote() throws Exception {
        mockMvc.perform(post("/api/notes")
                        .queryParam("workspaceId", String.valueOf(workspaceA.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Test note", "content": "Body"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test note"));
    }

    // Wariant 1 IDOR: cudzy workspaceId.
    @Test
    @WithMockFirebaseUser(userId = "user-b")
    void getNote_rejectsForeignWorkspaceId() throws Exception {
        mockMvc.perform(get("/api/notes/{id}", noteInWorkspaceA.getId())
                        .queryParam("workspaceId", String.valueOf(workspaceA.getId())))
                .andExpect(status().isNotFound());
    }

    // Wariant 2 IDOR: WŁASNY workspaceId + id zasobu z cudzego workspace'u.
    @Test
    @WithMockFirebaseUser(userId = "user-b")
    void getNote_rejectsForeignResourceIdInOwnWorkspace() throws Exception {
        mockMvc.perform(get("/api/notes/{id}", noteInWorkspaceA.getId())
                        .queryParam("workspaceId", String.valueOf(workspaceB.getId())))
                .andExpect(status().isNotFound());
    }

    // Wariant 2 dla mutacji: sprawdź też, że cudzy zasób NIE został zmieniony.
    @Test
    @WithMockFirebaseUser(userId = "user-b")
    void deleteNote_doesNotDeactivateForeignResourceInOwnWorkspace() throws Exception {
        mockMvc.perform(delete("/api/notes/{id}", noteInWorkspaceA.getId())
                        .queryParam("workspaceId", String.valueOf(workspaceB.getId())))
                .andExpect(status().isNotFound());

        assertThat(noteRepository.findById(noteInWorkspaceA.getId()))
                .get().extracting(Note::getStatus).isEqualTo(Status.ACTIVE);
    }
}
```

Kopiuj oba warianty (z podmienionymi nazwami) dla każdego nowego endpointu
operującego na pojedynczym zasobie workspace'u — odczyt **i** mutacja.
