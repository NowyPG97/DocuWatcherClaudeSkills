# Etap 2 — Projekt przebudowy

Katalog: `Strona/projekt/`. Wejście: zatwierdzony `audyt.md` (z sekcją „Decyzje
Pawła”) i `fakty-systemu.md` z najnowszego audytu. Brak zatwierdzonego audytu →
zatrzymaj się i zaproponuj etap 1.

Wynik etapu to **kompletny projekt, który da się wdrożyć bez zgadywania**:
strategia, teksty z SEO per podstrona i klikalny prototyp HTML z tymi tekstami.

```
Strona/projekt/
├── strategia.md          # odbiorcy, przekaz, mapa strony, mapa fraz, blog
├── PRODUCT.md            # kontekst produktu dla impeccable (impeccable init)
├── DESIGN.md             # system wizualny (impeccable, po zbudowaniu prototypu)
├── teksty/<slug>.md      # teksty + SEO każdej podstrony (web-copywriter)
├── zrzuty/               # prawdziwe zrzuty aplikacji (qa) do użycia na stronie
├── prototyp/             # HTML/CSS z impeccable — kontrakt dla etapu 3
└── projekt.md            # podsumowanie do zatwierdzenia
```

Pracuj **w czterech krokach z bramkami** — każdy krok kończy się krótkim
podsumowaniem dla Pawła i jego akceptacją, zanim zaczniesz następny. Zmiana
strategii po napisaniu tekstów to przepisanie wszystkiego.

## 2.1 Strategia → `strategia.md`  ⟶ bramka

Wyprowadź z audytu (nie wymyślaj od zera):

1. **Odbiorcy** — 2–4 persony operatorów KZR (np. FGP/punkt zbiórki, tartak z
   własnym przerobem, handlowiec biomasą, firma prowadząca kilka podmiotów).
   Dla każdej: co dziś robi (Excel, papier), co ją boli, co musi pokazać
   audytorowi, kto decyduje o zakupie. Podstawa: fakty, notatki z pamięci o
   klientach (Hydrew, Rozmaitex, Jacek — przez `history-researcher`), nie stereotyp.
2. **Przekaz** — jedno zdanie wartości, 3–5 filarów (każdy filar = grupa faktów
   `F-xx`), dowody (zrzuty, przykładowy PoS/raport, migracja z arkusza).
   Terminy/dokumenty jako filar poboczny, nie oś.
3. **Mapa strony** — lista podstron z celem każdej (np. główna, „Bilans masy KZR”,
   podstrony per persona/rola, cennik, FAQ, kontakt/demo, blog, prawne).
   Zostaw miejsce na przyszłe certyfikaty (struktura URL i nawigacji), bez
   obiecywania ich. Przy każdej istniejącej stronie: zostaje (ten sam URL) /
   nowy URL + przekierowanie 301 / usunięcie.
4. **Mapa fraz** — fraza główna + 2–4 poboczne na podstronę, bez kanibalizacji
   (jedna fraza = jedna strona). Frazy z audytu (1.4); wolumenów nie podawaj bez
   źródła. Intencja frazy (informacyjna → blog, transakcyjna → podstrona produktu).
5. **Blog** — decyzja per wpis z audytu (zostaw / przepisz / przekieruj / wycofaj)
   i 3–6 tematów nowych wpisów wspierających frazy KZR.
6. **Konwersja** — główne CTA (demo? konto próbne? kontakt?) i co dzieje się po
   kliknięciu. Jeśli nie wiadomo, jakie CTA jest realne (np. czy istnieje
   samodzielna rejestracja) — sprawdź w aplikacji albo zapytaj Pawła.

## 2.2 Teksty → `teksty/<slug>.md`  ⟶ bramka

Zleć `docuwatcher-skills:web-copywriter` — jedno wywołanie na 2–3 podstrony,
równolegle (w jednej wiadomości). W briefie przekaż ścieżki: `strategia.md`,
`fakty-systemu.md`, `audyt.md`, `tresc/` (stare teksty — co warto ocalić),
`packages/shared/src/translations/pl/` (słownictwo UI) i listę podstron z ich
celem i frazami.

Po zwrocie **sprawdź sam** (to Twoja odpowiedzialność, nie agenta):
- każde twierdzenie o produkcie ma odwołanie `[F-xx]` i fakt to potwierdza;
  nic z sekcji „Nie obiecywać”;
- twierdzenia o KZR (zgodność, wymogi, audyt) — przez `kzr-expert`, z cytatem;
  słowa „zgodny z KZR”, „certyfikowany” tylko z podstawą;
- frazy z mapy w title / H1 / pierwszym akapicie, title ≤ 60 znaków, meta
  description ≤ 155, jeden H1;
- spójny ton między podstronami, nazwy funkcji jak w aplikacji.

Poprawki — wznów tego samego agenta (`SendMessage`).

## 2.3 Zrzuty aplikacji → `zrzuty/`

Prawdziwy produkt sprzedaje lepiej niż ilustracja. Zleć `qa` zrzuty kluczowych
ekranów (lista partii, saldo/bilans okresu, rejestracja partii, PoS PDF, raport
okresowy) z workspace z realistycznymi danymi — **bez danych prawdziwych klientów**
(nazwy firm, NIP-y, numery certyfikatów zamaskowane albo dane demo; jeśli nie ma
odpowiedniego workspace — zapytaj Pawła, czy go przygotować). Desktop 1440 px,
pliki PNG z nazwą ekranu.

## 2.4 Projekt wizualny — impeccable  ⟶ bramka

Uruchom skill `impeccable:impeccable` z katalogiem roboczym `Strona/projekt/`:

1. **`init`** — PRODUCT.md. Treść bierzesz z `strategia.md` i `fakty-systemu.md`;
   na pytania wywiadu odpowiadasz z tych plików, a Pawła pytasz tylko o to, czego
   tam nie ma (np. charakter marki).
2. **Nowa praca wizualna** (redesign = zastąpienie obecnego wyglądu; stary wygląd to
   dowód i antywzorzec, nie baza). Tryb impeccable: **Persuade** dla stron
   sprzedażowych, **Read** dla bloga.
3. **Ograniczenia, które podajesz impeccable jako część briefu** (prototyp musi dać
   się wiernie odtworzyć w Elementorze 4 przez EMCP):
   - układ z kontenerów flex/grid, typowe widgety (nagłówek, tekst, obraz, przycisk,
     ikona, lista, akordeon/FAQ, zakładki, formularz Contact Form 7);
   - bez WebGL/canvas, własnych bibliotek JS i animacji zależnych od JS; ruch tylko
     prosty (CSS, `prefers-reduced-motion`);
   - fonty z Google Fonts; kolory i typografia jako tokeny (wejdą do globalnych
     ustawień Elementora);
   - obrazy: zrzuty z `zrzuty/` + ewentualne grafiki od impeccable (wtedy jako
     pliki PNG/SVG w `prototyp/assets/`);
   - teksty **dosłownie** z `teksty/` — impeccable nie przepisuje treści; jeśli
     układ wymaga zmiany tekstu (np. krótszy nagłówek), zgłasza to, a Ty decydujesz
     i aktualizujesz `teksty/`.
4. Zbuduj prototyp **wszystkich podstron z mapy** (blog: szablon listy i wpisu),
   desktop + mobile, i doprowadź go do końca procesem impeccable (jego przegląd
   końcowy, DESIGN.md przez `document`).

## 2.5 `projekt.md`  ⟶ zatwierdzenie etapu

```
# Projekt przebudowy docuwatcher.com — RRRR-MM-DD
## Co się zmienia (5–8 punktów)
## Mapa strony (tabela: URL · cel · fraza główna · status: nowa/zmieniona/bez zmian · stary URL → 301)
## Przekaz i persony (skrót strategia.md)
## Wygląd (zrzuty prototypu: główna desktop/mobile + 1–2 podstrony; tokeny)
## Ryzyka wdrożenia (np. elementy trudne w Elementorze, brakujące zdjęcia, CTA)
## Plan wdrożenia (kolejność stron, co publikujemy razem)
## Pytania do Pawła
```

Prototyp otwórz Pawłowi lokalnie (ścieżka do `prototyp/index.html`). Zaproponuj
jednym zdaniem publikację prototypu jako prywatnego Artifact (do pokazania
innym) — tylko na prośbę. Do etapu 3 przechodzisz po wyraźnym zatwierdzeniu.
