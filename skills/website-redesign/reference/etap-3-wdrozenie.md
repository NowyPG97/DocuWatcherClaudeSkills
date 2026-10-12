# Etap 3 — Wdrożenie przez EMCP

Katalog: `Strona/wdrozenie/`. Wejście: zatwierdzony `Strona/projekt/` (prototyp,
`teksty/`, `DESIGN.md`, `strategia.md` z mapą przekierowań). Brak zatwierdzenia →
zatrzymaj się.

To jedyny etap, który **zapisuje na produkcyjnym WordPressie**. Strona nie ma
stagingu — bezpieczeństwo zapewnia kolejność: kopie → szkice → przegląd →
publikacja za zgodą → kontrola po publikacji.

```
Strona/wdrozenie/
├── kopie/<post_id>.json   # export-page każdej strony przed zmianą
├── dziennik.md            # każda operacja zapisu: kiedy, co, post_id, change id
└── wdrozenie.md           # stan, wyniki przeglądów, lista do publikacji
```

## Zasady

1. **Budujemy obok, nie na żywo.** Każda nowa i przebudowana strona powstaje
   jako **nowy szkic** (`status: draft`). Opublikowanych stron nie edytujemy w
   miejscu aż do kroku publikacji.
2. **Tokeny tylko dodawane.** Nowe kolory i typografia wchodzą do ustawień
   globalnych jako **nowe wpisy z prefiksem `dw-`**. Nie zmieniamy istniejących
   wpisów ani slotów systemowych (primary/secondary/text/accent) przed publikacją —
   to zmieniłoby wygląd obecnej strony od razu.
3. **Każdy zapis do dziennika** — EMCP zapisuje zmiany w swoim rejestrze
   (`list-changes`); w `dziennik.md` notuj id zmiany przy każdej operacji, żeby
   `rollback-change` był możliwy bez szukania.
4. **Treść 1:1 z projektu.** Teksty dosłownie z `teksty/`, układ i tokeny z
   prototypu. Odstępstwo wymuszone przez Elementor → zapisz w `wdrozenie.md`
   i pokaż Pawłowi przy przeglądzie, nie rozstrzygaj po cichu.
5. **Ustawienia całej witryny, menu, strona główna, przekierowania, publikacja i
   usuwanie** — wyłącznie orkiestrator, wyłącznie w kroku 3.5, po zgodzie Pawła.
   `elementor-builder` nie ma do tego narzędzi.

## 3.1 Przygotowanie

- Utwórz `dziennik.md` (nagłówek tabeli `czas · operacja · post_id · id zmiany ·
  opis`) i `wdrozenie.md`; `list-changes` — zanotuj punkt wyjścia w dzienniku.
- `export-page` dla każdej strony, którą projekt zmienia albo zastępuje →
  `kopie/<post_id>.json`. Bez kopii nie ruszasz dalej.
- Media: zrzuty i grafiki z `projekt/zrzuty/` i `projekt/prototyp/assets/` wgraj
  przez `upload-media` (SVG ikon: `upload-svg-icon`), z tekstem alternatywnym z
  `teksty/`. Zanotuj id i URL każdego pliku w `wdrozenie.md` — builder ich użyje.
- Tokeny z `DESIGN.md` → `update-global-colors` / `update-global-typography`
  (nowe wpisy `dw-*`, zasada 2). Fonty spoza Google Fonts — zatrzymaj się i zapytaj.

## 3.2 Budowa — `elementor-builder`

Jedno wywołanie agenta `docuwatcher-skills:elementor-builder` = **jedna podstrona**.
Niezależne podstrony możesz zlecać równolegle (w jednej wiadomości, maks. 3 —
wszystkie piszą do tego samego WordPressa). Zacznij od strony głównej sam
na sam i obejrzyj wynik, zanim zlecisz resztę — błędy wzorca wyłapiesz raz.

Brief dla agenta:
- podstrona: nazwa, docelowy slug, tytuł;
- ścieżki: `prototyp/<plik>.html` (+ CSS), `teksty/<slug>.md`, `DESIGN.md`;
- mapa tokenów `dw-*` → wartości, mapa mediów (plik → id/URL);
- ścieżka do `dziennik.md` (agent dopisuje swoje operacje).

Agent zwraca: `post_id` szkicu, link podglądu, id zmian EMCP, listę odstępstw od
prototypu.

## 3.3 Przegląd szkiców

Szkiców nie widać publicznie (`get-page-html` działa tylko dla opublikowanych).
Dla każdej podstrony:

1. **Zgodność wizualna** — `qa` otwiera podgląd szkicu
   (`https://docuwatcher.com/?page_id=<id>&preview=true`, w przeglądarce Pawła
   zalogowanej do WP; brak sesji → zablokowane, poproś Pawła o zalogowanie) i
   prototyp obok, desktop 1440 + mobile 390 (iframe, jeśli okno nie daje się
   zmienić). Zwraca zrzuty i listę różnic.
2. **Treść** — `get-page-structure` / `get-element-settings`: tekst każdego widgetu
   zgodny z `teksty/` (porównujesz Ty albo `qa`).
3. **Jakość** — `impeccable:impeccable` `critique` na podglądzie: czy wdrożenie nie
   zgubiło jakości prototypu.

Poprawki zlecasz temu samemu `elementor-builder` (`SendMessage`) z listą różnic.
Maksymalnie dwie rundy poprawek na stronę; co zostaje — do `wdrozenie.md` jako
znany kompromis dla Pawła.

## 3.4 SEO na szkicach

Dla każdej podstrony z `teksty/` ustaw meta Yoast przez `update-post` (`meta`):
`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`; slug przez
`update-post` (`slug`). **Przy pierwszym użyciu sprawdź**, że Yoast czyta te pola
(po publikacji `get-page-html` → `<title>` i meta description) — jeśli nie,
zatrzymaj się i ustal z Pawłem ustawienie ręczne w panelu.

Dane strukturalne (Organization, SoftwareApplication, FAQPage) — Yoast generuje
część sam; brakujące dodaj tylko jeśli projekt je przewiduje, i sprawdź po
publikacji w HTML.

## 3.5 Publikacja  ⟶ wyraźna zgoda Pawła

Przedstaw Pawłowi `wdrozenie.md`: lista szkiców z linkami podglądu, znane
kompromisy, dokładna lista operacji publikacji w kolejności. Każda z nich
zmienia publiczną stronę — **zgoda obejmuje tę listę, nic poza nią**.

Typowa kolejność (dostosuj do projektu):
1. Ostateczne tokeny: jeśli projekt zmienia sloty systemowe Elementora — to
   osobny punkt na liście (dotyka wszystkich stron, także starych wpisów).
2. Publikacja szkiców (`update-post` `status: publish`).
3. Strona główna: `update-settings` (grupa `reading`: strona główna = nowa strona).
4. Menu: `menu-write` wg mapy strony.
5. Stare strony: zgodnie z `strategia.md` — szkic/prywatna zamiast usuwania
   (usunięcie tylko na wyraźne polecenie). **Przekierowania 301**: EMCP ma tylko
   `list-redirects`; jeśli narzędzia do zapisu przekierowań nie ma, przygotuj
   Pawłowi listę `stary URL → nowy URL` do wprowadzenia ręcznie (Yoast Premium /
   wtyczka przekierowań) **przed** wycofaniem starych stron.
6. Ustawienia witryny (hasło witryny „Automatyczne pilnowanie terminów…” →
   nowe z `strategia.md`) przez `update-settings`.

Każdą operację dopisz do `dziennik.md`.

## 3.6 Kontrola po publikacji

- `site-auditor` w trybie skróconym (zleć: tylko nowe/zmienione URL-e, sitemap,
  robots, meta, H1, linki, wydajność strony głównej i cennika) → porównaj z
  `inwentarz.md` z audytu: co się poprawiło, czy nic nie zginęło.
- `find-broken-links`, `analyze-performance`.
- Zgłoś Pawłowi: co opublikowano, wynik kontroli, otwarte punkty (np. ręczne
  przekierowania, aktualizacja ElementsKit Pro).

**Wycofanie:** pojedyncza strona — `rollback-change <id>` z `dziennik.md`;
konflikt (strona zmieniona później) → pokaż Pawłowi, nie używaj `force` bez jego
zgody. Strona główna — przywróć poprzednie ustawienie `reading` z dziennika.

## 3.7 Po wdrożeniu

Notatka w pamięci (data, co opublikowano, otwarte punkty) i propozycje poprawek
do tego skilla i agentów z przebiegu.
