# MeetCraft AI Desktop App

## Build & Packaging Instructions

### 1. Development Mode

```
npm run dev:desktop
```
- Launches Electron, Express backend, and React frontend concurrently.

### 2. Production Build

```
npm run build:desktop
```
- Builds React frontend.
- Packages Electron app.

### 3. Generate Installers

```
npm run dist
```
- Creates installers for Windows (.exe, portable), macOS (.dmg, .app), and Linux (AppImage, .deb).

### 4. Environment Variables

- Place your `.env` file in the project root.
- Electron will load environment variables for backend and frontend.

### 5. Offline Support

- App works offline except for AI API requests.

### 6. Launching

- Double-click installer or portable executable.

### 7. Customization

- See `electron/main.js` for server and window logic.
- See `electron/preload.js` for secure API exposure.

### 8. Troubleshooting

- Ensure ports 3000 (frontend) and 5000 (backend) are available.
- For port conflicts, update Electron logic for auto-detection.

---

For advanced configuration, see [electron-builder docs](https://www.electron.build/).
