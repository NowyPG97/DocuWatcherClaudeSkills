# Dokumenty KZR INiG — mapa źródeł

Lokalizacja: `C:\DocuWatcherWorkspace\Dokumenty KZR\`. Numery stron wg spisów
treści PDF (stan plików na 2026-09-30).

## Jak czytać

PDF-y wyciągaj do scratchpada sesji, **z `-enc UTF-8`** (bez tego polskie znaki
giną i grep po „zbiórki”/„łańcuch” nie trafia):

```bash
pdftotext -enc UTF-8 -layout "<plik>.pdf" "<scratchpad>/k7.txt"
grep -n -i "okres bilansowy" "<scratchpad>/k7.txt"
```

Potem czytaj fragment z kontekstem (±30 linii), a nie pojedynczą linię —
wymogi KZR często mają wyjątki w następnym akapicie albo w „UWAGA N”.
Jeśli tabela wyjdzie poszarpana, spróbuj bez `-layout` albo przez `pdf-parse`
(`npm i pdf-parse` w scratchpadzie).

Cytując, podawaj: **dokument (np. /7) · rozdział · strona · dosłowny fragment**.

## Dokumenty

| Skrót | Plik | Wersja | O czym — szukaj tu, gdy pytanie dotyczy… |
| --- | --- | --- | --- |
| **/1** | `System_KZR_INiG_1-Opis-Systemu…ver-4-PL_25.pdf` | wyd. 4, 05.2025 | Ról uczestników łańcucha (§7: miejsce pochodzenia, FGP, przedsiębiorstwa handlowe…), **tabeli ~48 kodów zakresu certyfikacji** (§4, ok. str. 7–10, kody FGWS/FGWW/FGFS/FGFW/TR/TRS/SAW…), identyfikowalności i danych transakcji w łańcuchu (§12.1–12.2, str. 53–54), Unijnej Bazy Danych |
| **/2** | `System_KZR_INiG_2-Definicje-ver-4-PL_25-1.pdf` | wer. 4, 05.2025 | Definicji pojęć (§3, str. 5–43) — zanim zinterpretujesz termin (np. „partia”, „grupa produktów”, „odpad/pozostałość”), sprawdź definicję tutaj |
| **/7** | `System_KZR_INiG_7-Wytyczne…bilansu-masy-ver-3-PL_23.pdf` | wer. 3, 12.2023 | **Rdzeń modułu massbalance.** §4.1 zasady ogólne (str. 6: okresy 3/12 mies., z/bez magazynowania, surowce bez deklaracji w bilansie) · §4.2 szczegółowe wytyczne (str. 11: grupy produktów, Przykłady 1–3 o mieszaniu, konwersja) · §4.3 przypadki szczególne (str. 21: 4.3.1 producent rolny, **4.3.2 FGP**, 4.3.3 przetwórca, 4.3.4–4.3.8 producenci paliw/biogaz/energetyka) · **§5 dokumentowanie danych** (str. 32: treść PoS/dokumentów dostawy, UWAGA 1–8) · §6 drzewo decyzyjne (str. 37) |
| **/8** | `System_KZR_INIG_8_GHG.pdf` | — | Emisji GHG: §4.1 kiedy wartości standardowe vs rzeczywiste (str. 7) · §4.2.2 jednostki · §4.5 korygowanie szacunków w łańcuchu · §4.6 stosowanie wartości standardowych (str. 50) · §5 dokumentowanie · §6 zmiana rodzaju emisji |
| **/10** | `System_KZR_INiG_10_Wytyczne_dla_audytora…ver_3_PL_23_2.pdf` | wer. 3 | Tego, **co sprawdzi audytor** — §5.4.1 rodzaje niezgodności (str. 15) · §6 wiarygodność danych · §7.3 tartaki · **§7.4 FGP** (str. 22) · §7.5 wiele lokalizacji · §7.7 GHG · **§7.8 bilans masy** (str. 29) · §8 ocena ryzyka |
| **/11.4** | `System_KZR_INiG_11.4-Deklaracja…biomasy-lesnej-ver-4a-PL_25-1.pdf` | wer. 4a | Wzoru deklaracji dostawcy biomasy leśnej (dane dostawcy/odbiorcy, okres ważności, obszar pozyskania, oświadczenia) — pola samodeklaracji dostawcy |

## Szybkie skojarzenia temat → źródło

| Temat w systemie | Zacznij od |
| --- | --- |
| Okres bilansowy 3 vs 12 mies., deficyt w trakcie/na koniec | /7 §4.1 |
| Grupy produktów, mieszanie surowców, „Zakres” (PPS/H/T/LEŚNA) | /7 §4.2 (Przykłady 1–3), /7 UWAGA 8, /1 §4 (tabela kodów) |
| Przeliczniki jednostek, wydajność przerobu | /7 §4.2, /8 §4.2.2 |
| Treść PoS, dane kontrahenta, numery certyfikatów | /7 §5, /1 §12.1–12.2 |
| GHG: wartość standardowa vs rzeczywista, worst-case | /8 §4.1, §4.5, §4.6; /7 §5 |
| Surowiec bez deklaracji KZR (`kzrCompliant=false`) | /7 §4.1, /7 §4.3.2 |
| Samodeklaracja dostawcy, ważność 12 mies. | /11.4, /1 §7.1–7.2, /10 §7.4 |
| Rola operatora (FGP, handlowiec, tartak) | /1 §7, /7 §4.3, /10 §7.3–7.4 |
| „Czy audytor to zakwestionuje?” | /10 §5.4.1, §7.8 |

## Zastrzeżenia

- Mapa pomaga znaleźć miejsce — **nie zastępuje przeczytania fragmentu**.
  Nie cytuj niczego, czego nie przeczytałeś w tej sesji.
- Jeśli w katalogu pojawi się nowsza wersja dokumentu, zaktualizuj tę tabelę
  (wersja + strony) i podbij `version` pluginu.
