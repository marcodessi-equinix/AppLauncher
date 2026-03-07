# FR2 AppLauncher

Interne Dashboard-Anwendung fuer Firmen-VMs mit Podman/Portainer. Die App ist auf einen einfachen Betrieb ausgelegt:

- Frontend oeffentlich auf `http://VM-HOSTNAME:9020`
- Backend nur intern im Compose-Netz
- Daten persistent in `data/` und `uploads/`
- Updates ueber Portainer Stack Update ohne Reset der App-Daten

## Architektur

| Komponente | Technologie |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Datenbank | SQLite |
| Webserver | Nginx |
| Betrieb | Podman / Portainer |

## Standard-Betriebsmodell

- Frontend-Port: `9020`
- Backend-Port intern: `3000`
- Zugriff fuer Benutzer: nur ueber das Frontend
- Kein oeffentliches Backend-Port-Mapping
- HTTP intern im Firmennetz, kein HTTPS-Zwang

## Portainer Deployment aus GitHub

Ja, du kannst den Stack direkt aus dem GitHub-Repo in Portainer deployen. Fuer einen sicheren Start musst du in Portainer aber diese zwei Environment-Variablen setzen:

- `JWT_SECRET`
- `ADMIN_PASSWORD`

Ohne diese beiden Werte startet der Stack absichtlich nicht.

### Empfohlene Portainer-Konfiguration

1. In Portainer `Stacks` oeffnen.
2. `Add stack` waehlen.
3. Deployment-Typ `Repository` oder `Git Repository` waehlen.
4. Repo-URL eintragen.
5. Als Compose-Datei `docker-compose.yml` verwenden.
6. Unter `Environment variables` mindestens setzen:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
7. Stack deployen.

### Optionale Environment-Variablen

| Variable | Zweck | Default |
|---|---|---|
| `FRONTEND_PORT` | Host-Port fuer das Frontend | `9020` |
| `DATABASE_PATH` | SQLite-Datei im Container | `/app/data/applauncher.db` |
| `FRONTEND_URL` | Zusaetzlich erlaubte Origins, kommagetrennt | leer |
| `COOKIE_SECURE` | Nur bei HTTPS auf `true` setzen | `false` |

Hinweis:

- `FRONTEND_URL` ist fuer den Standardbetrieb ueber denselben Host nicht zwingend noetig.
- Die App erkennt den aktuellen Host hinter Nginx und akzeptiert denselben Origin automatisch.

## Zugriff

Nach dem Deploy ist die App standardmaessig hier erreichbar:

- `http://VM-HOSTNAME:9020`

Der Admin-Login erfolgt ueber das Schloss-Symbol im Dashboard.

## Updates ueber Portainer

Fuer spaetere Updates reicht im Normalfall:

1. Code in GitHub aktualisieren.
2. In Portainer den bestehenden Stack oeffnen.
3. `Update` bzw. `Pull and redeploy` ausfuehren.

Die App-Daten bleiben erhalten, solange derselbe Stack weiterverwendet wird, weil `data/` und `uploads/` persistent gemountet sind.

## Lokale Installation auf der VM ohne Portainer

Wenn du direkt auf der VM deployen willst:

```bash
git clone <repo-url>
cd FR2\ AppLauncher
bash install.sh
```

Das Skript:

- erzeugt eine lokale `.env`
- generiert einen sicheren `JWT_SECRET`
- fragt das Admin-Passwort ab oder generiert eins
- startet den Stack mit Podman Compose

## Beispiel `.env`

```env
PORT=3000
FRONTEND_PORT=9020
DATABASE_PATH=/app/data/applauncher.db
FRONTEND_URL=
COOKIE_SECURE=false
ALLOW_INSECURE_DEFAULTS=false
JWT_SECRET=
ADMIN_PASSWORD=
```

## Betrieb und Wartung

```bash
# Start / Update
podman compose up -d --build

# Stoppen
podman compose down

# Logs
podman compose logs -f

# Backup
./backup.sh
```

## Wichtige Hinweise

- Keine echten Secrets ins Repo committen.
- `JWT_SECRET` und `ADMIN_PASSWORD` immer pro Umgebung separat setzen.
- Das Backend ist absichtlich nicht direkt von aussen erreichbar.
- `COOKIE_SECURE=true` erst aktivieren, wenn die App spaeter ueber HTTPS betrieben wird.
