# copyboard

Del tekst øjeblikkeligt mellem alle enheder på dit netværk — ingen konto, ingen app, ingen sporing.

## Sådan virker det

Serveren læser besøgerens IP-adresse og gemmer en tekstblok pr. IP. Alle enheder bag samme router (typisk alle i din husstand/kontor) deler automatisk samme board.

## Kom i gang lokalt

```bash
npm install
npm start
# Åbn http://localhost:3000 på alle enheder
```

Under udvikling med auto-reload:
```bash
npm run dev
```

## Deploy til nettet

### Render.com (gratis, anbefalet)
1. Push koden til GitHub
2. Opret et nyt "Web Service" på [render.com](https://render.com)
3. Vælg dit repo → build command: `npm install`, start command: `npm start`
4. (Valgfrit) Sæt env-variablen `USE_FILE=true` for at bevare data ved genstart

### Railway.app
1. Push til GitHub
2. Opret nyt projekt på [railway.app](https://railway.app)
3. "Deploy from GitHub repo" → klar

### Fly.io
```bash
npm install -g flyctl
fly launch
fly deploy
```

### Selv-hostet (VPS/Raspberry Pi)
```bash
git clone <dit-repo>
cd copyboard
npm install
# Brug PM2 til at holde den kørende
npm install -g pm2
pm2 start server.js --name copyboard
pm2 startup && pm2 save
```

## Miljøvariabler

| Variabel   | Standard | Beskrivelse |
|------------|----------|-------------|
| `PORT`     | `3000`   | Port serveren lytter på |
| `USE_FILE` | `false`  | Gem data i `data.json` (overlever genstart) |

## Begrænsninger

- Data gemmes i hukommelsen som standard (nulstilles ved servergenstart)
- Sæt `USE_FILE=true` for simpel fillagring
- For produktion med mange brugere: skift til SQLite eller Redis
- Max 100.000 tegn pr. board
- Boards ryddes automatisk efter 24 timers inaktivitet

## Licens

MIT
