# Szablon briefu dla implementera

Wypełnia orkiestrator. Sekcje 1–2 **wklejone dosłownie** z treści zadania
(`fetch-task.js` → `content.body`) — nie streszczaj, nie poprawiaj.

```
# Brief: <KEY> — <tytuł zadania>

Repo: <ścieżka>   Branch (już utworzony, jesteś na nim): <KEY>   Główny branch: <main|master>
Ścieżka procesu: <S | pełna>

## 1. Kryteria ukończenia (dosłownie z zadania)
<wklejone>

## 2. NIE WCHODZI (dosłownie z zadania; brak sekcji → „brak”)
<wklejone>

## 3. Plan
Pliki i kolejność:
1. <plik> — <co i dlaczego>
2. …
Decyzje projektowe (z uzasadnieniem):
- <decyzja> — <dlaczego; jakie alternatywy odrzucono>
Fakty z kodu, na których opiera się plan (plik:linia):
- …

## 4. Testy do napisania
Z zadania:
- …
Dodatkowe z planu (przypadki brzegowe):
- …
Backend — każdy nowy endpoint na zasobie workspace'u: oba warianty IDOR.

## 5. Ograniczenia
- Reguła skauta tylko w plikach zmienianych przez zadanie; większy dług → „Otwarte kwestie”.
- Zakaz `git commit`/`push`/`stash`/merge/rebase, zmiany brancha i zmian na tablicy.
- Nigdy `--no-verify`.
- Brakujący fundament (frontend: httpClient, QueryClientProvider, MSW) = stop → DECYZJA POTRZEBNA.
- Decyzja spoza planu (podejście, model danych, kontrakt API, niezmienniki domeny,
  dług, rozbieżność zadania z kodem) = stop → DECYZJA POTRZEBNA. Drobiazgi rozstrzygasz sam.
- Pełny zestaw testów uruchamiasz sam (log do pliku, na pierwszym planie); przed raportem zielony.

## 6. Raport zwrotny
Format z Twojej definicji agenta: Zmienione pliki · Decyzje podjęte samodzielnie ·
Odstępstwa od planu · Testy (napisane + wynik pełnego zestawu) · Otwarte kwestie.
Bez wklejania kodu.
```

## Brief przy wznowieniu po pauzie (nowy implementer)

Jak wyżej, plus na końcu:

```
## 7. Stan zastany (praca przerwana)
Notatka przekazania: <wklejona treść .claude/handoff/<KEY>.md>
Zmiany już na branchu: przejrzyj sam `git diff <główny-branch>...HEAD` i `git status`
— nie zakładaj, że notatka jest kompletna; rozbieżność notatki z repo zgłoś w raporcie.
Do zrobienia: <lista z notatki, potwierdzona z użytkownikiem>
```

## Wznowienie tego samego implementera (`SendMessage`)

Tylko delta, bez powtarzania briefu:

```
Poprawki po review (<KEY>) — zrealizuj wyłącznie te punkty:
1. plik:linia — <problem> — <oczekiwana zmiana>
…
Pozostałe uwagi reviewera świadomie pomijamy: <punkt — powód>.
Zwróć raport w tym samym formacie, opisując zmiany od poprzedniego raportu.
```

```
Rozstrzygnięcie DECYZJI (<KEY>): wybieramy <opcja> — <uzasadnienie / ewentualne doprecyzowanie>.
Kontynuuj od miejsca, w którym przerwałeś.
```
