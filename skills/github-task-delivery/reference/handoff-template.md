# Szablon notatki przekazania (pauza)

Plik: `C:\DocuWatcherWorkspace\.claude\handoff\<KEY>.md` — poza każdym repo git
(workspace nie jest repozytorium), więc nigdy nie trafi do commita. Nadpisuj przy
każdej kolejnej pauzie tego samego zadania; usuń po zamknięciu zadania (krok 8).

```
# Przekazanie <KEY> — <tytuł>
Data: <YYYY-MM-DD HH:MM>   Ścieżka procesu: <S | pełna>   Etap: <np. po review, przed poprawkami>

## Repo i branche
- <repo> — branch <KEY>, główny <main|master>, ostatni commit na branchu: <hash | brak>,
  niezacommitowane zmiany: <tak/nie — lista plików z git status>

## Zrobione
- …
## Zostało
- …
## Stan testów
- <ostatni wynik pełnego zestawu: PASS/FAIL + kiedy> 
## Decyzje (podjęte przez orkiestratora lub użytkownika)
- <decyzja> — <uzasadnienie> — <kto>
## Otwarte pytania / DECYZJA POTRZEBNA w toku
- …
## Review
- <nie było | runda 1: punkty blokujące / do poprawy i ich stan>
## Implementerzy (kontekstu nie da się wznowić w nowej sesji — tylko do śledzenia)
- <np. backend-dev-T-220>
```
