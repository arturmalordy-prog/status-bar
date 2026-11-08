# status-bar

Wtyczka Claude Code, która nad polem czatu pokazuje stały pasek na lekko szarym, półprzezroczystym tle:

```
🟢 5h 23% ↻2h 10m  📅 Tydz. 41% ↻3d 5h  🧠 Kontekst 18%  ☁️ chmura · cloud_default · mobile
🌿 artur-01-repository · main  🤖 claude-opus-5-5 ⚡medium  ⏱️ 1h 25m · 💬 14  🔄 48s · 🔧 7  ⚙️ 1 w tle  ✕ Ukryj
```

- 🟢/🟡/🔴 **5h**, 📅 **Tydz.**, 🧠 **Kontekst**: wykorzystanie limitów i kontekstu z czasem do resetu; kolor zielony < 70%, żółty od 70%, czerwony od 90%. Po przekroczeniu 90% limitu pojawia się jednorazowe powiadomienie.
- ☁️/💻 **Środowisko**: chmura (typ środowiska, aplikacja) albo lokalnie.
- 🌿 **Repozytorium i gałąź git**.
- 🤖 **Model** i ⚡ **effort**.
- ⏱️ **Czas sesji** i 💬 **liczba wiadomości**.
- 🔄 **Ostatnia tura**: czas odpowiedzi i 🔧 liczba użytych narzędzi.
- ⚙️ **Subagenty działające w tle** (gdy są).
- **✕ Ukryj** zwija pasek do przycisku **📊 Pokaż pasek**.

Na telefonie i w przeglądarce (gdzie aplikacja nie rysuje paska nad polem czatu) pasek pojawia się jako ostatni wiersz rozmowy po każdej odpowiedzi; komenda `/pasek` otwiera go w panelu.

Limity pojawiają się po pierwszej odpowiedzi modelu w sesji (tylko przy subskrypcji).

## Linijka statusu w każdej odpowiedzi

Aplikacje Claude (desktop, telefon, przeglądarka) nie rysują elementów wtyczek w sesjach w chmurze. Dlatego wtyczka ma też skill `status`: do każdej wiadomości dołącza aktualne dane, a Claude kończy każdą odpowiedź jedną linijką statusu. Ta linijka jest widoczna wszędzie. Na prośbę („status”, „pasek”, `/status-bar:status`) Claude rozpisuje status jako listę.

## Instalacja

W terminalu, w sesji Claude Code:

```
/plugin install status-bar --marketplace arturmalordy-prog/status-bar
```

Potwierdź `y` (dodanie marketplace), potem wybierz zakres **user**. Wtyczka włącza się wtedy w każdej sesji i każdym projekcie na tym komputerze.

Z powłoki:

```
claude plugin install status-bar --marketplace arturmalordy-prog/status-bar
```

W aplikacji desktop: **+** obok pola czatu → **Plugins** → **Add marketplace** `arturmalordy-prog/status-bar` → **Add plugin**.

## Automatyczne włączanie (ustawienia)

Ten sam efekt daje wpis w `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "status-bar": { "source": { "source": "github", "repo": "arturmalordy-prog/status-bar" } }
  },
  "enabledPlugins": { "status-bar@status-bar": true }
}
```

W sesjach Claude Code w chmurze można go zapisać skryptem startowym środowiska (setup script), żeby pasek włączał się w każdej nowej sesji.
