# status-bar

Wtyczka Claude Code, która nad polem czatu pokazuje stały pasek:

```
Sesja (5h): 23% (reset 2h 10m) · Tydzień: 41% (reset 3d 5h) · Kontekst: 18% · Środowisko: chmura · cloud_default · mobile · Model: claude-opus-5-5 · Effort: medium
```

- **Sesja (5h)** i **Tydzień**: wykorzystanie limitów konta i czas do resetu (widoczne po pierwszej odpowiedzi modelu; tylko przy subskrypcji).
- **Kontekst**: zapełnienie okna kontekstu.
- **Środowisko**: `lokalnie` albo `chmura` z typem środowiska i aplikacją.
- **Model** i **Effort**: odświeżane przy każdym zapytaniu.

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
