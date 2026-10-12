# Etap 1 — Audyt

Katalog: `Strona/audyt-RRRR-MM-DD/`. Wyjście: `audyt.md` (dla Pawła),
`fakty-systemu.md` (wejście etapu 2), `inwentarz.md`, `tresc/<slug>.md`.

Cel: ustalić, **jak bardzo strona jest nieaktualna** i **jak (źle) prezentuje
wartość systemu**, oraz w jakim stanie jest SEO i wygląd. Wynik ma być na tyle
konkretny, żeby etap 2 mógł z niego wprost wyprowadzić projekt.

### 1.1 Zbierz materiał — równolegle

W jednej wiadomości uruchom:

| Agent | Zadanie |
|---|---|
| `docuwatcher-skills:site-auditor` | pełny inwentarz strony (patrz definicja agenta); katalog wyjściowy `Strona/audyt-RRRR-MM-DD/` |
| `docuwatcher-skills:code-researcher` | **mapa możliwości systemu** z głównego brancha — pytania niżej |

Pytania do `code-researcher` (dopasuj, nie kopiuj ślepo):
- Jakie moduły/ekrany ma aplikacja (routing frontendu, sekcje menu)? Co z nich
  dotyczy KZR, a co terminów/dokumentów?
- Moduł KZR: rejestracja partii (wejście/wyjście), okresy bilansowe (3/12 mies.),
  przenoszenie nadwyżki, korekty, PoS (wystawianie, wzór, anulowanie, PDF),
  GHG, raporty okresowe (PDF), dokumenty przy partii, masowa sprzedaż, import/eksport
  (CSV/XLSX), jednostki — co istnieje, z `plik:linia`.
- Role/typy operatorów obsługiwane przez reguły (FGP, tartak, handlowiec, z/bez
  magazynowania) — gdzie w kodzie to widać.
- Multi-workspace, role użytkowników, subskrypcje/plany cenowe (co faktycznie
  ogranicza plan).
- Terminy i dokumenty: co dziś realnie działa (powiadomienia, kanały).

Punktem wyjścia dla „co działa, a co nie” są notatki audytu gotowości modułu
KZR z pamięci (2026-10-11) — przekaż agentowi listę do potwierdzenia na
aktualnym kodzie, nie jako fakt.

Z wyników złóż `fakty-systemu.md` — jedna tabela, każdy wiersz z trwałym
identyfikatorem (teksty w etapie 2 powołują się na te ID):

| ID | możliwość (językiem operatora) | dla kogo | dowód (`plik:linia` / T-XXX / qa) | ograniczenia — czego **nie** wolno obiecać |
|---|---|---|---|---|
| F-01 | … | … | … | … |

Osobna sekcja „Nie obiecywać” zbiera rzeczy, których system nie robi albo robi
warunkowo (np. role nieobsługiwane w pełni) — z dowodem.

### 1.2 Wyciągnij twierdzenia ze strony

Z `tresc/*.md` od site-auditor wypisz każde twierdzenie o produkcie (nagłówki,
hasła, listy funkcji, FAQ, cennik, meta description) i sklasyfikuj:

- `AKTUALNE` — system to robi, zgodnie z opisem,
- `NIEAKTUALNE` — kiedyś prawda albo opis innej wersji produktu,
- `NIEPRAWDZIWE` — system tego nie robi (ryzyko prawne/wizerunkowe),
- `NIEJASNE` — nie da się sprawdzić / ogólnik bez treści,
- `BRAK` — system to robi i to ważne, a strona milczy (z `fakty-systemu.md`).

Wątpliwe przypadki rozstrzygaj dopytaniem tego samego `code-researcher`
(`SendMessage`), a gdy liczy się zachowanie, nie kod — zleć `qa` krótkie
sprawdzenie na żywo (backend `localhost:9090`, frontend `pnpm dev`; środowisko
nie działa → zapisz jako nierozstrzygnięte, nie zgaduj). Twierdzenia o KZR
→ `kzr-expert`.

### 1.3 Oceń prezentację wartości

Dla każdej kluczowej strony (główna, rozwiązania, cennik, FAQ) odpowiedz:
- **Do kogo mówi?** Czy rozpozna się w niej operator KZR (FGP, tartak,
  handlowiec biomasą), czy ktoś szukający przypomnień o terminach?
- **Jaki problem nazywa?** Ból operatora KZR to m.in. bilans w Excelu, ryzyko na
  audycie, ręczne PoS, deklaracje dostawców, przeliczniki — sprawdź, czy strona
  go nazywa językiem branży.
- **Co obiecuje w pierwszym ekranie** i czy to jest dziś najmocniejsza strona
  systemu?
- **Dowody wartości:** zrzuty ekranu z prawdziwej aplikacji, przykład PoS/raportu,
  case (np. migracja z arkusza), czy stockowe ilustracje?
- **Ścieżka do działania:** CTA, demo, kontakt, cennik — czy pasuje do sprzedaży B2B
  w niszy?

### 1.4 SEO

Z inwentarza site-auditor (Yoast, meta, nagłówki, schema, sitemap, robots,
wydajność, linki) oceń stronę techniczną. Dla treści:
- sprawdź przez `WebSearch` (tryb standard, kilka zapytań w jednej turze), kto
  dziś zajmuje wyniki dla fraz typu „bilans masy KZR”, „program do bilansu masy
  biomasy”, „KZR INiG system”, „PoS biomasa”, „deklaracja dostawcy biomasy” —
  i czy docuwatcher.com się tam pojawia. Nie podawaj wolumenów wyszukiwań, jeśli
  nie masz źródła — oznacz frazy jako kandydatów do weryfikacji.
- oceń bloga: które wpisy wspierają nowe pozycjonowanie, które są poza tematem
  (BHP, UDT, zezwolenia na pracę) — zaproponuj: zostawić / przepisać / przekierować;
  decyzja w etapie 2.

### 1.5 Wygląd i UX — impeccable

Uruchom skill `impeccable:impeccable` z komendą `critique` dla publicznych URL
strony głównej i cennika (desktop + mobile, jak każe skill). Kontekst produktu
dla impeccable bierz z `fakty-systemu.md` i sekcji „Pozycjonowanie” wyżej —
impeccable nie ma w tym katalogu PRODUCT.md, nie wymyślaj go. Wynik krytyki
streść w raporcie (najważniejsze problemy, ocena „czy to wygląda jak ten produkt”).
Pytania końcowe impeccable zadaj Pawłowi dopiero po oddaniu całego raportu
audytu albo pomiń z adnotacją `Questions skipped: część audytu strony`.

### 1.6 Raport `audyt.md`

```
# Audyt docuwatcher.com — RRRR-MM-DD

## TL;DR
3–5 zdań: jak bardzo nieaktualna, główny problem z prezentacją wartości,
stan SEO, stan wyglądu, rekomendacja zakresu przebudowy.

## Ocena ogólna
| Obszar | Ocena (0–4) | Jednym zdaniem |
| Aktualność treści | | |
| Prezentacja wartości (KZR) | | |
| SEO techniczne | | |
| SEO treści / frazy | | |
| Wygląd i UX (impeccable) | | |
| Wydajność | | |

## Rozjazd strona ↔ system
Tabela: strona · fragment (dosłownie) · klasa (AKTUALNE/NIEAKTUALNE/
NIEPRAWDZIWE/NIEJASNE) · stan faktyczny · dowód.
Osobno: BRAK — czego system umie, a strona nie mówi (posortuj wg wartości).

## Prezentacja wartości
## SEO (techniczne + treści + blog)
## Wygląd i UX
## Strony i wpisy — co z nimi zrobić
Tabela: strona/wpis · zostawić / przepisać / scalić / usunąć+przekierować · powód.

## Rekomendacja zakresu przebudowy
## Pytania do Pawła (przed etapem 2)
```

Oddaj Pawłowi TL;DR w czacie i ścieżkę do `audyt.md`. Raport jest dla niego do
przeczytania i decyzji — zaproponuj jednym zdaniem opublikowanie go jako
prywatnej strony (Artifact), nie publikuj bez prośby.

### 1.7 Po audycie

- Zapisz w pamięci krótką notatkę: data audytu, ścieżka, najważniejsze ustalenia
  i decyzje Pawła.
- Zaproponuj poprawki do tego skilla i do `site-auditor` wynikające z przebiegu
  (co było zbędne, czego brakowało).
- Do etapu 2 przechodzisz dopiero po wyraźnym „zatwierdzam audyt” / odpowiedziach
  Pawła na pytania z raportu — zapisz je w `audyt.md` w sekcji „Decyzje Pawła”.
