---
name: blackbox-verification
description: Use when the user asks to manually verify, QA, or black-box test a running application/system through its real UI or API surface — e.g. "przetestuj to jako czarną skrzynkę", "zweryfikuj manualnie w przeglądarce", "sprawdź czy to działa end-to-end", "black-box test", "QA pass", "verify the feature actually works", "click through the flow", "zrób live test". Not for unit/integration test writing, code review, or static analysis — this is about driving the live system like a real user and comparing behavior to intent, not to code.
version: 1.0.0
---

# Weryfikacja czarnoskrzynkowa (Black-Box Verification)

## Cel

Zweryfikować, że system zachowuje się zgodnie z zamierzonym działaniem, obserwując go
wyłącznie przez jego rzeczywisty interfejs (UI, API, pliki wyjściowe) — bez opierania
wniosków na czytaniu kodu źródłowego. Kod mówi co system *powinien* robić; czarna
skrzynka mówi co system *faktycznie* robi.

## Kiedy używać tego trybu zamiast code review

- Użytkownik chce potwierdzenia, że funkcja "naprawdę działa", a nie tylko że kod
  wygląda poprawnie.
- Zgłoszenie buga wymaga odtworzenia (repro), zanim zacznie się szukać przyczyny.
- Trzeba zweryfikować pełny cykl życia encji (np. utworzenie → edycja → przejścia
  stanów → efekty uboczne w innych modułach), nie pojedynczą funkcję.
- Wynik ma być dowodem dla kogoś innego (PR, ticket, demo) — potrzebne zrzuty
  ekranu/logi, nie tylko "przeczytałem kod i wygląda ok".

## Zasady

1. **Nie zaglądaj do kodu, żeby ocenić wynik.** Wolno czytać kod, żeby zrozumieć *co
   przetestować* (jakie reguły biznesowe powinny obowiązywać), ale werdykt
   "działa / nie działa" opiera się wyłącznie na obserwacji z UI/API/logów.
2. **Prowadź system przez prawdziwy interfejs.** Klikaj, wypełniaj formularze,
   wysyłaj żądania — tak jak zrobiłby to użytkownik. Nie wywołuj bezpośrednio
   funkcji backendu, żeby "przetestować szybciej" — to już nie jest czarna skrzynka.
3. **Testuj pełny cykl, nie pojedynczy krok.** Najbardziej wartościowe bugi ujawniają
   się na styku etapów (np. edycja historycznego rekordu → wpływ na rekoncyliację →
   wpływ na raport końcowy), a nie wewnątrz jednego ekranu.
4. **Używaj realistycznych scenariuszy, nie minimalnych przypadków.** Jeśli to
   możliwe, importuj prawdziwe dane (rzeczywisty plik klienta) zamiast ręcznie
   sklejonych 2-wierszowych fixture'ów — realne dane ujawniają przypadki brzegowe,
   o których nikt nie pomyślał przy pisaniu kodu.
5. **Zbieraj dowody, nie wrażenia.** Każde ustalenie musi mieć: kroki repro, zrzut
   ekranu lub tekst z UI, a jeśli dostępne — treść żądania/odpowiedzi sieciowej i
   błędy konsoli. "Wygląda, że działa" nie jest ustaleniem.
6. **Odróżniaj "nie odtwarza się" od "już naprawione".** Jeśli zgłoszony bug nie
   występuje przy live-teście, sprawdź czy to dlatego, że został już naprawiony
   (np. nowszy commit/reguła), a nie że warunki testu były inne niż w zgłoszeniu.
   Zapisz to rozróżnienie w wyniku.
7. **Sprawdzaj nie tylko happy path.** Celowo prowokuj: puste pola, wartości
   graniczne, edycję po fakcie, dwa równoległe zgłoszenia dla tego samego rekordu,
   cofnięcie/duplikację. Systemy rzadko psują się na ścieżce głównej.

## Workflow

1. **Zdefiniuj scenariusz jako historię, nie jako listę kroków technicznych.**
   Najlepiej w formie "persony" — kim jest użytkownik, co chce osiągnąć, jakimi
   danymi realnie dysponuje. Persona z prawdziwym plikiem wejściowym > abstrakcyjny
   opis "użytkownik tworzy rekord".
2. **Uruchom system i prowadź go przez interfejs** (przeglądarka, CLI, API) —
   zależnie co jest naturalnym interfejsem systemu. Wykonuj kroki jeden po drugim,
   obserwując stan po każdym.
3. **Po każdym kluczowym kroku zweryfikuj stan z trzech stron, gdy to możliwe:**
   - co pokazuje UI/output użytkownikowi,
   - co widać w logach/konsoli/network (błędy, nieoczekiwane statusy HTTP,
     ostrzeżenia),
   - czy stan jest spójny z tym, co powinno wynikać z poprzednich kroków
     (np. suma bilansu, licznik, status).
4. **Porównaj z intencją biznesową, nie z implementacją.** Punktem odniesienia jest
   specyfikacja/ticket/reguła biznesowa (lub zdrowy rozsądek domenowy), a nie to co
   robi kod — bo właśnie kod jest tym, co testujemy.
5. **Zapisz ustalenia w formacie:** scenariusz → kroki repro → obserwowany wynik →
   oczekiwany wynik → dowód (zrzut/log) → klasyfikacja (bug / potwierdzone działa /
   nie do odtworzenia).
6. **Jeśli znaleziono bug, nie naprawiaj go w tym samym przebiegu** — najpierw
   skończ weryfikację całego scenariusza, potem raportuj. Mieszanie "testuję" z
   "naprawiam po drodze" maskuje kolejne problemy w tym samym flow.

## Narzędzia

- **Rozszerzenie do przeglądarki (np. Claude for Chrome / `claude-in-chrome`)** —
  gdy weryfikujesz system z UI webowym (frontend DocuWatcher, `akademiasaas-boilerplate`).
  Steruje realną przeglądarką, więc trafiasz na te same problemy co użytkownik
  (routing, stan sesji, walidacja frontendowa). Zawsze odczytuj logi konsoli i
  żądania sieciowe po kluczowych akcjach — połowa realnych bugów objawia się tam,
  a nie wizualnie.
- **Manualne testowanie przez użytkownika** — gdy w grę wchodzi ocena
  UX/sensowności komunikatu, której nie da się zweryfikować programowo. Poproś
  użytkownika o tę rundę zamiast zgadywać za niego.
- **curl/Postman/CLI** — gdy system nie ma UI albo test dotyczy konkretnie
  API/kontraktu backendu (`DeadlineGuradBackend`, `http://localhost:9090`).

## Czego unikać

- Nie uznawaj "kod wygląda poprawnie" za dowód działania — to code review, nie
  weryfikacja czarnoskrzynkowa.
- Nie testuj tylko pojedynczych, odizolowanych akcji, jeśli bug dotyczy interakcji
  między modułami/etapami.
- Nie pomijaj sprawdzenia konsoli/network tylko dlatego, że UI "wygląda dobrze" —
  cichy błąd w tle często nie ma widocznego objawu od razu.
- Nie raportuj "nie działa" bez konkretnych kroków repro i dowodu — taki raport nie
  da się zweryfikować ani naprawić.
