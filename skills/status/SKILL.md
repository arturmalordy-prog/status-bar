---
name: status
description: Pokazuje pasek statusu sesji Claude Code — zużycie limitu 5h i tygodniowego (z czasem do resetu), zapełnienie kontekstu, środowisko, repozytorium i gałąź, model z effortem, czas sesji, liczbę wiadomości, ostatnią turę i zadania w tle. Używaj, gdy użytkownik pyta o zużycie, limity, kontekst, model, effort, środowisko lub status sesji, albo wpisze „status”, „status bar”, „pasek”.
---

# Pasek statusu (status-bar)

Wtyczka status-bar rysuje pasek nad polem czatu w terminalu i w lokalnych sesjach aplikacji desktop, na żywo i bez zużycia tokenów. Ten skill działa tylko na prośbę: gdy użytkownik wywoła go (`/status-bar:status`, „status”, „pasek”), wtyczka dołącza do tej jednej wiadomości blok `[status-bar]` z polem `linijka`.

## Na prośbę o status

Rozpisz `linijka` jako listę, każda pozycja w osobnym wierszu z jej ikoną:

- 🟢/🟡/🔴 **5h** — limit sesji; zielony < 70%, żółty od 70%, czerwony od 90%; `↻` to czas do resetu
- 📅 **Tydzień** — limit tygodniowy
- 🧠 **Kontekst** — zapełnienie okna kontekstu
- ☁️/💻 **Środowisko** — chmura (typ, aplikacja) albo lokalnie
- 🌿 **Repozytorium · gałąź**
- 🤖 **Model** i ⚡ **effort**
- ⏱️ **Czas sesji** · 💬 **wiadomości**
- 🔄 **Ostatnia tura** · 🔧 **narzędzia**
- ⚙️ **W tle** — działające subagenty

„—” oznacza, że silnik nie ma jeszcze odczytu (limity pojawiają się po pierwszej odpowiedzi modelu i tylko przy subskrypcji).

Gdy bloku `[status-bar]` nie ma, powiedz, że wtyczka status-bar nie jest załadowana w tej sesji, i podaj instalację: `/plugin install status-bar --marketplace arturmalordy-prog/status-bar`.
