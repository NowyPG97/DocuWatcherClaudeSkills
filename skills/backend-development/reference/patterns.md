# Gotowy szkielet nowego modułu — do adaptacji, nie do wymyślania od zera

Ten plik pokazuje kompletny, poprawny szkielet nowego modułu domenowego
(`com.deadlineguard.backend.note` — przykładowa, prosta funkcja "notatka
przypisana do workspace'u"), zgodny z konwencjami z
[`../SKILL.md`](../SKILL.md). Adaptuj nazwy/pola/logikę biznesową, ale
**zachowaj strukturę i kolejność kroków** — zwłaszcza ownership-check w
serwisie i towarzyszący mu test (Zasada 12) — zamiast pisać to od zera i
ryzykować pominięcie czegoś.

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

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
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

Rekordy są zwięzłe dla prostych, niemutowalnych DTO bez logiki — jeśli
sąsiedni kod w module, który rozszerzasz, konsekwentnie używa klas
`@Builder`/Lombok zamiast rekordów, trzymaj się tego, co tam już jest
(Zasada 2 w `SKILL.md`), zamiast mieszać style w jednym module.

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

```java
public interface NoteRepository extends JpaRepository<Note, Long> {

    Optional<Note> findByIdAndWorkspaceIdAndStatus(Long id, Long workspaceId, Status status);

    Page<Note> findByWorkspaceIdAndStatus(Long workspaceId, Status status, Pageable pageable);

    @Modifying
    @Query("UPDATE Note n SET n.status = 'INACTIVE' WHERE n.id = :id AND n.workspace.id = :workspaceId")
    int deactivateByIdAndWorkspaceId(@Param("id") Long id, @Param("workspaceId") Long workspaceId);
}
```

## 5. Wyjątek — `note/exception/NoteNotFoundException.java`

```java
public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException(Long id) {
        super("Note not found: " + id);
    }
}
```

Dodaj w `exception/GlobalExceptionHandler.java` (nie twórz lokalnego
handlera w `NoteController` — Zasada 10):

```java
@ExceptionHandler(NoteNotFoundException.class)
public ResponseEntity<ErrorResponseDTO> handleNoteNotFound(NoteNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponseDTO(ex.getMessage()));
}
```

## 6. Serwis — `note/service/NoteService.java`

**Ownership check jako pierwsza linia każdej metody — to jedyny mechanizm
autoryzacji w tym repo, nie opcja.**

```java
@RequiredArgsConstructor
@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final WorkspaceService workspaceService;

    public NoteDTO createNote(Long userId, Long workspaceId, CreateNoteDTO dto) {
        Workspace workspace = workspaceService.getWorkspaceEntity(userId, workspaceId);
        Note note = NoteFactory.create(dto, workspace);
        return NoteDTOFactory.create(noteRepository.save(note));
    }

    public NoteDTO getNote(Long userId, Long workspaceId, Long noteId) {
        workspaceService.getWorkspaceEntity(userId, workspaceId);
        Note note = noteRepository.findByIdAndWorkspaceIdAndStatus(noteId, workspaceId, Status.ACTIVE)
            .orElseThrow(() -> new NoteNotFoundException(noteId));
        return NoteDTOFactory.create(note);
    }

    public void deleteNote(Long userId, Long workspaceId, Long noteId) {
        workspaceService.getWorkspaceEntity(userId, workspaceId);
        int updated = noteRepository.deactivateByIdAndWorkspaceId(noteId, workspaceId);
        if (updated == 0) {
            throw new NoteNotFoundException(noteId);
        }
    }
}
```

Zauważ: **wstrzykiwanie konstruktorowe** (`@RequiredArgsConstructor` na
`private final`) — nie `@Setter`/`@Lazy`. Jeśli `NoteService` kiedyś
zacznie potrzebować serwisu, który z kolei potrzebuje `NoteService` z
powrotem, to sygnał do przemyślenia granic modułu (patrz "Konwencje tego
repo" w `SKILL.md`), nie do automatycznego sięgnięcia po lazy setter.

## 7. Kontroler — `note/controller/NoteController.java`

`@CurrentUser` + `@RequestParam Long workspaceId` jako pierwsze parametry,
zawsze:

```java
@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    public NoteDTO createNote(
        @CurrentUser FirebaseUserPrincipal principal,
        @RequestParam Long workspaceId,
        @Valid @RequestBody CreateNoteDTO dto
    ) {
        return noteService.createNote(principal.uid(), workspaceId, dto);
    }

    @GetMapping("/{id}")
    public NoteDTO getNote(
        @CurrentUser FirebaseUserPrincipal principal,
        @RequestParam Long workspaceId,
        @PathVariable Long id
    ) {
        return noteService.getNote(principal.uid(), workspaceId, id);
    }

    @DeleteMapping("/{id}")
    public void deleteNote(
        @CurrentUser FirebaseUserPrincipal principal,
        @RequestParam Long workspaceId,
        @PathVariable Long id
    ) {
        noteService.deleteNote(principal.uid(), workspaceId, id);
    }
}
```

## 8. Migracja Flyway — `db/migration/V1_<kolejny>__Add_notes_table.sql`

Sprawdź najwyższy istniejący numer w `src/main/resources/db/migration/`
przed nadaniem — nie zgaduj:

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

## 9. Testy jednostkowe serwisu — `note/service/NoteServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock private NoteRepository noteRepository;
    @Mock private WorkspaceService workspaceService;
    @InjectMocks private NoteService noteService;

    @Test
    @DisplayName("createNote saves a note scoped to the caller's workspace")
    void createNote_savesScopedNote() {
        Workspace workspace = Workspace.builder().id(1L).build();
        when(workspaceService.getWorkspaceEntity(10L, 1L)).thenReturn(workspace);
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteDTO result = noteService.createNote(10L, 1L, new CreateNoteDTO("Title", "Content"));

        assertThat(result.title()).isEqualTo("Title");
    }

    @Test
    @DisplayName("getNote rejects a workspace the caller does not own")
    void getNote_rejectsForeignWorkspace() {
        when(workspaceService.getWorkspaceEntity(10L, 99L))
            .thenThrow(new WorkspaceNotFoundException(99L));

        assertThatThrownBy(() -> noteService.getNote(10L, 99L, 1L))
            .isInstanceOf(WorkspaceNotFoundException.class);

        // Kluczowa asercja negatywna dla testu ownership-checku: repozytorium
        // NIE zostało odpytane, bo serwis powinien odrzucić dostęp wcześniej.
        verifyNoInteractions(noteRepository);
    }
}
```

## 10. Test integracyjny z odrzuceniem cross-workspace — `note/controller/NoteControllerIntegrationTest.java`

**Ten test jest wymagany Zasadą 12, nie opcjonalny.** Wzorzec: utwórz
zasób jako użytkownik/workspace A, spróbuj go odczytać jako użytkownik B
(inny workspace) i potwierdź 404, nie 200 z cudzymi danymi.

```java
@AutoConfigureMockMvc
class NoteControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NoteRepository noteRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    @Test
    @WithMockFirebaseUser(userId = "user-a")
    void createNote_returnsCreatedNote() throws Exception {
        Workspace workspaceA = workspaceRepository.save(
            Workspace.builder().userId("user-a").name("Workspace A").build()
        );

        mockMvc.perform(post("/api/notes")
                .queryParam("workspaceId", String.valueOf(workspaceA.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Test note", "content": "Body"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Test note"));
    }

    @Test
    @WithMockFirebaseUser(userId = "user-b")
    void getNote_rejectsAccessToAnotherUsersWorkspace() throws Exception {
        Workspace workspaceA = workspaceRepository.save(
            Workspace.builder().userId("user-a").name("Workspace A").build()
        );
        Note noteInWorkspaceA = noteRepository.save(
            Note.builder().workspace(workspaceA).title("Secret").status(Status.ACTIVE).build()
        );

        // Zalogowany jako user-b, ale próbuje odczytać notatkę z workspace'u user-a.
        mockMvc.perform(get("/api/notes/{id}", noteInWorkspaceA.getId())
                .queryParam("workspaceId", String.valueOf(workspaceA.getId())))
            .andExpect(status().isNotFound());
    }
}
```

Drugi test to dokładnie ten wzorzec, którego wymaga Zasada 12 — kopiuj go
(z podmienionymi nazwami) dla każdego nowego, workspace-scoped endpointu,
zamiast pisać tylko happy path.
