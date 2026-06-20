# Nakshatra — PRD
### 2.5D Birth Solar System Visualizer

---

## 1. Product Name

**Nakshatra**

---

## 2. One-Line Summary

Nakshatra is an interactive 2.5D web experience that lets a user enter their birth date, birth time, latitude, and longitude, then visualizes the solar system as it was at the moment they were born — with a glowing marker on Earth showing their exact birth location.

---

## 3. Product Vision

Nakshatra should feel like opening a cosmic memory.

The user should not feel like they are using a dry astronomy calculator. They should feel like they are entering a cinematic, personal, almost sacred data visualization:

> *"This is where Earth was. This is where the planets were. This is the moment I arrived."*

The website combines:

- Scientific solar-system positioning
- A stylized 2.5D visual interface
- Emotional birth-moment storytelling
- Smooth timeline animation
- Game-like camera exploration
- Clean glassmorphism UI

The experience should be beautiful enough to share, but grounded enough that it still feels like a real astronomical visualization.

---

## 4. Core User Story

As a user, I want to enter my birth date, birth time, and birth location so that I can see a visual snapshot of the solar system at the moment I was born.

---

## 5. Main Experience

When the user first opens Nakshatra, the solar system is alive and moving based on the current date and time. The Sun sits at the center. Planets orbit around it on elegant orbital paths. Earth is visible and rotating slowly. The scene feels like a premium cosmic map.

On the left side, the user sees a glass-style input panel:

- Date of Birth
- Time of Birth
- Latitude
- Longitude
- Timezone (auto-inferred from lat/long; shown as editable field if inference fails)
- **Show My Birth Sky** button

When the user submits:

1. The system validates the input.
2. A timeline appears and becomes active at the top center of the scene.
3. The system animates backward from the current moment to the user's birth moment.
4. Planets move along their orbital paths during the rewind animation.
5. Earth rotates to show the entered latitude/longitude.
6. A glowing blue pin marker appears on Earth at the birth location.
7. When the animation reaches the birth moment, the solar system pauses.
8. The UI switches from **LIVE** to **BIRTH SNAPSHOT**.
9. The user can orbit, zoom, and inspect the frozen cosmic arrangement.

---

## 6. Product Goals

### 6.1 Primary Goals

- Let users visualize the solar system at their exact birth moment.
- Show a personal location marker on Earth using latitude and longitude.
- Provide an elegant 2.5D visual experience using Three.js.
- Make the experience feel cinematic, smooth, and emotionally meaningful.
- Allow free camera exploration after the birth snapshot is reached.
- Keep the MVP technically achievable without needing a full NASA-grade simulator.

### 6.2 Secondary Goals

- Let users compare "Now" versus "Birth Moment."
- Let users save or share a birth snapshot.
- Let users toggle planet labels, orbit lines, stars, and visual effects.
- Eventually support Moon position, zodiac/nakshatra overlays, and sky-from-location mode.

---

## 7. Non-Goals for MVP

- Full astrology interpretation or horoscope predictions
- Complex Vedic chart calculations
- User accounts or paid subscriptions
- Mobile app
- Full-scale physically accurate solar system distances
- Real-time multiplayer
- AR/VR
- Full topocentric sky dome from user location

---

## 8. MVP Decision: Heliocentric View

There are two possible interpretations of "how the solar system looked when I was born":

**Option A — Heliocentric Solar System View**
Shows the planets around the Sun from a cosmic perspective. Best for MVP.

**Option B — Sky View From Birth Location**
Shows how planets appeared in the sky from the user's location on Earth. More like a planetarium or astrology chart.

**MVP uses Option A.** Option B can be added later as an advanced mode.

---

## 9. Target Users

### Primary
- People curious about their birth moment
- Astronomy enthusiasts
- Astrology-adjacent users who enjoy cosmic visuals
- People who like personal, emotional web experiences
- Users who want a shareable visual memory

### Secondary
- Designers/developers exploring creative data visualization
- Educators explaining planetary motion
- Storytellers creating personal birth visuals

---

## 10. Design Direction

Nakshatra should look like a premium cosmic interface, matching the visual concept image:

- Dark starfield background
- Deep navy, black, and cosmic blue base colors
- Gold/orange glow from the Sun
- Neon blue/cyan interaction highlights
- Glassmorphism panels
- Thin orbital rings with subtle glow
- Soft particle trails on the timeline
- Clean, elegant typography
- Minimal but readable planet labels
- Game-like 2.5D camera perspective
- Cinematic lighting and bloom
- Compass rose (N/S/E/W) in the top right corner of the scene

### Visual Mood Keywords

Cosmic · Personal · Sacred · Cinematic · Elegant · Scientific · Magical · Minimal · Premium · Exploratory · Calm · Deep-space · 2.5D data visualization

---

## 11. Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background deep black | Space black | `#030712` |
| Background navy | Deep navy | `#07111F` |
| Background blue | Space blue | `#0B1730` |
| Primary accent | Electric blue | `#3B82F6` |
| Glow accent | Cyan glow | `#22D3EE` |
| Soft highlight | Soft blue | `#60A5FA` |
| Sun gold | Sun gold | `#FBBF24` |
| Sun warm | Warm orange | `#F97316` |
| UI text | Soft cream | `#F8E7B0` |
| Live status | Live green | `#34D399` |
| Snapshot status | Paused blue | `#60A5FA` |
| Error | Error red | `#FB7185` |
| Warning | Warning amber | `#F59E0B` |

---

## 12. Typography

- **Logo/title:** Cinzel, Cormorant Garamond, or Playfair Display
- **UI labels:** Inter, Manrope, or Geist
- **Numbers/coords:** Inter, Geist Mono, or IBM Plex Mono

The interface should feel like an observatory control panel, not a generic admin dashboard.

---

## 13. Layout — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  NAKSHATRA logo          Home  Explore  Learn  About  [Snapshots]│
├──────────────┬──────────────────────────────────┬───────────────┤
│              │  [LIVE >>>>>> BIRTH SNAPSHOT]     │               │
│  Left Panel  │                                  │  Location     │
│  ─────────── │       2.5D Solar System          │  Card         │
│  Title       │          Scene                   │               │
│  Subtitle    │                                  │  [Globe]      │
│  Form fields │                           [N/S   │  Lat/Long     │
│              │                            Compass│  Timezone     │
│  [CTA btn]   │                            Rose] │  Birth time   │
│              │                                  │               │
│  [Success    │                                  │  [View on Map]│
│   message]   │                                  │               │
├──────────────┴──────────────────────────────────┴───────────────┤
│  NOW · date/time  [▶]  ──●────────────────────  BIRTH MOMENT   │
│                     2020  2010  2000  1992  1980  date/time     │
├─────────────────────────────────────────────────────────────────┤
│  Drag to orbit · Scroll to zoom     [Orbits][Planets][Stars]    │
│                                     [Labels][Settings]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Application States

### 14.1 Live Mode (default)
- Solar system runs based on current date/time.
- Planets move slowly. Earth rotates slowly.
- Status: **LIVE · Real-time now** (green dot).
- Birth form is available.

### 14.2 Input Mode
- User is entering birth information.
- Solar system continues moving in background.
- Submit button reads: **Show My Birth Sky**.

### 14.3 Rewind Mode
- Timeline becomes active with particle trail moving left.
- Text: **Rewinding time…**
- Planets interpolate from current to birth positions.
- Camera can drift slightly for cinematic effect.
- User controls temporarily reduced.

### 14.4 Birth Snapshot Mode
- Planets paused at birth timestamp.
- Earth marker (glowing blue pin) visible.
- Status: **BIRTH SNAPSHOT · Paused at birth moment** (blue pause icon).
- Camera controls fully enabled.
- Left panel shows: *"System rewound to your birth moment. Paused and ready for exploration."*

### 14.5 Error State
- Friendly inline validation messages.
- Scene continues in live mode.
- User input is preserved.

---

## 15. Input Requirements

### Required Fields
| Field | Format | Validation |
|-------|--------|------------|
| Date of Birth | Date picker → `YYYY-MM-DD` | Required |
| Time of Birth | Time picker → `HH:mm` | Required |
| Latitude | Decimal degrees | Required, `-90` to `90` |
| Longitude | Decimal degrees | Required, `-180` to `180` |
| Timezone | IANA string (auto-inferred or manual) | Required |

### Timezone Handling
- Auto-infer timezone from latitude/longitude when both are entered (using a tz-from-coordinates library).
- Show the inferred value as an editable field.
- Only prompt the user manually if inference fails.
- Example values: `Asia/Kathmandu`, `America/New_York`, `Europe/London`.

### Example Input
```
Date:      1992-05-14
Time:      07:35
Latitude:  12.9716
Longitude: 77.5946
Timezone:  Asia/Kolkata
```

---

## 16. Core Functional Requirements

### FR1 — Live Solar System
Render a stylized animated solar system on page load, driven by the current timestamp. Status shows LIVE.

### FR2 — Birth Input Form
Allow entry of date, time, latitude, longitude, and timezone. Validate all fields with friendly inline errors. Valid submit triggers rewind mode.

### FR3 — UTC Conversion
Convert local birth date/time + timezone into a precise UTC timestamp. Do not use the browser's local timezone unless it matches the selected timezone. Store both local and UTC values.

### FR4 — Planet Position Calculation
Use a JavaScript astronomy library (recommended: `astronomy-engine` by Don Cross) to compute heliocentric positions for Mercury, Venus, Earth, Mars, Jupiter, Saturn. Abstract behind a service interface so the provider can be swapped later.

### FR5 — 2.5D Scene Rendering
Three.js scene with semi-top-down camera (`position: (0, 45, 75)`, `lookAt: (0,0,0)`). Planets on the XZ plane with Y for depth. Artistic scaling — not physically proportional. User can orbit and zoom after snapshot.

### FR6 — Earth Birth Location Marker
Convert latitude/longitude to a point on the Earth sphere:
```js
const latRad = latitude * Math.PI / 180;
const lonRad = longitude * Math.PI / 180;
const x = radius * Math.cos(latRad) * Math.cos(lonRad);
const y = radius * Math.sin(latRad);
const z = radius * Math.cos(latRad) * Math.sin(lonRad);
```
Show a glowing blue pin at that point, parented to Earth mesh so it rotates correctly.

### FR7 — Rewind Animation
4-second ease-in-out interpolation from current snapshot to birth snapshot. Timeline scrubs from NOW to BIRTH MOMENT. App ends in paused Birth Snapshot mode.

### FR8 — Camera Exploration
After snapshot: orbit (left drag), zoom (scroll), pan (right drag or shift+drag). Zoom limits prevent going inside planets. Reset camera restores default view.

### FR9 — UI Controls (Control Dock)
Toggle: Orbits · Planets · Stars · Labels. Actions: Reset Camera · Return to Live. Active controls glow blue.

### FR10 — Location Card
Show after birth input: place name (reverse geocoded via OpenStreetMap Nominatim), latitude, longitude, timezone, birth date/time, mini globe with pin. "View on Map" button links to Google Maps with coordinates.

### FR11 — Compass Rose
Display N/S/E/W compass rose in the top-right corner of the 3D scene. Updates with camera rotation.

### FR12 — Status Bar
Top-center two-state bar: `LIVE →→→ BIRTH SNAPSHOT`. Switches between states on mode change. Not just a pill — a visual mode switcher.

---

## 17. Technical Architecture

### Stack
| Layer | Choice |
|-------|--------|
| Build | Vite |
| Framework | React + TypeScript |
| 3D | Three.js (raw, not R3F) |
| State | Zustand |
| Styling | Tailwind CSS |
| Animation | GSAP (timeline/UI) |
| Astronomy | `astronomy-engine` (Don Cross) |
| Time | `luxon` |
| Bloom | Three.js `EffectComposer` + `UnrealBloomPass` |
| Reverse Geocoding | OpenStreetMap Nominatim (free) |
| Timezone inference | `@vvo/tzdata` or `geo-tz` |

### Folder Structure
```
src/
  App.tsx
  main.tsx
  styles/
    globals.css
    tokens.css
  components/
    BirthForm.tsx
    StatusBar.tsx
    TimelineScrubber.tsx
    LocationCard.tsx
    ControlDock.tsx
    CompassRose.tsx
  three/
    SolarSystemScene.ts
    Starfield.ts
    PlanetMesh.ts
    OrbitRing.ts
    EarthWithMarker.ts
    CameraController.ts
    PostProcessing.ts
  services/
    astronomyService.ts
    timeService.ts
    geocodeService.ts
    timezoneService.ts
  state/
    nakshatraStore.ts
  types/
    birth.ts
    astronomy.ts
```

---

## 18. Data Models

```ts
type BirthInput = {
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  latitude: number;    // -90 to 90
  longitude: number;   // -180 to 180
  timezone: string;    // IANA, e.g. "Asia/Kolkata"
};

type BirthMoment = {
  localDateTime: string;
  timezone: string;
  utcDateTime: string;
  latitude: number;
  longitude: number;
};

type PlanetPosition = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  distanceAU?: number;
  eclipticLongitude?: number;
  eclipticLatitude?: number;
  radiusVisual: number;
  colorHint: string;
};

type SolarSystemSnapshot = {
  timestampUtc: string;
  mode: "live" | "birth-snapshot";
  planets: PlanetPosition[];
  earthMarker: {
    latitude: number;
    longitude: number;
    x: number;
    y: number;
    z: number;
  };
};

type AppMode = "live" | "input" | "rewinding" | "birth-snapshot" | "error";

type NakshatraState = {
  mode: AppMode;
  birthInput: BirthInput | null;
  currentSnapshot: SolarSystemSnapshot | null;
  birthSnapshot: SolarSystemSnapshot | null;
  transitionProgress: number;
  showLabels: boolean;
  showOrbits: boolean;
  showStars: boolean;
  selectedPlanetId: string | null;
};
```

---

## 19. Accuracy Philosophy

Nakshatra should be honest about its visualization. The app should never claim distances or planet sizes are to scale. The correct framing is:

> *Planetary positions are calculated for the selected date and time. Distances and planet sizes are artistically scaled for visual clarity.*

This protects the product from being misleading while allowing a beautiful visual style.

---

## 20. Performance Requirements

- 60 FPS on modern desktop
- 30 FPS acceptable on lower-end devices
- Load under 3 seconds after assets are cached
- Smooth 4-second rewind animation with no frame drops
- Precompute start and end planet positions before animating — do not calculate per-frame

---

## 21. Accessibility

- All form fields must have labels
- Text contrast must be WCAG AA compliant
- Keyboard navigation must work for all form fields and buttons
- Provide a reduced-motion toggle that skips the rewind animation and fades directly to the birth snapshot
- Do not rely on color alone for status indicators

---

## 22. Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| Desktop (1280px+) | Full layout as designed |
| Tablet (768–1280px) | Left panel narrows; location card collapsible |
| Mobile (<768px) | Form becomes bottom sheet; timeline compact; labels hidden by default; scene remains full-screen |

Mobile is not the primary target for MVP but the layout must not break.

---

## 23. Edge Cases

| Case | Behavior |
|------|----------|
| Latitude out of range | Inline error, prevent submit |
| Longitude out of range | Inline error, prevent submit |
| Missing timezone | Auto-infer; if fails, prompt user |
| Future birth date | Warning: "This date is in the future. Visualize a future sky?" |
| Very old date (<1900) | Warning: "Accuracy may be reduced for dates before 1900." |
| WebGL unsupported | Friendly fallback message |
| Astronomy calculation fails | Error state with retry option |

---

## 24. UI Copy

| Context | Text |
|---------|------|
| Left panel title | Nakshatra |
| Left panel subtitle | Visualize the sky at the moment you were born. |
| CTA button | Show My Birth Sky |
| Live status | LIVE · Real-time now |
| Rewind status | Rewinding time… |
| Snapshot status | BIRTH SNAPSHOT · Paused at birth moment |
| Success message | System rewound to your birth moment. Paused and ready for exploration. |
| Camera hint | Drag to orbit · Scroll to zoom |
| Location card title | Your Location on Earth |

---

## 25. Future Features

- **Shareable snapshot** — export PNG, copy link
- **Sky from birthplace mode** — show sky from lat/long with horizon, stars, planet positions
- **Nakshatra/zodiac overlay** — optional cultural layer, clearly separate from astronomy
- **Guided story mode** — narrative sequence explaining the birth moment
- **Snapshot gallery** — save multiple snapshots (birth, friends, historical dates)
- **Moon position** — add Moon as a tracked body
- **Sound design** — ambient cosmic audio
- **JPL Horizons integration** — high-accuracy backend mode

---

## 26. MVP Acceptance Criteria

The MVP is complete when a user can:

1. Open the site and see a live animated solar system.
2. Enter date, time, latitude, longitude, and have timezone auto-inferred.
3. See inline errors for invalid input.
4. Click "Show My Birth Sky" and watch the solar system rewind.
5. See the timeline move from NOW to their BIRTH MOMENT.
6. See planets settle into their birth positions.
7. See a glowing location pin on Earth at their birth coordinates.
8. See their location resolved to a place name (e.g. "Bengaluru, India").
9. Orbit and zoom the camera freely after the snapshot.
10. Toggle labels, orbits, and stars using the control dock.
11. Return to live mode without a page refresh.
12. Read the status bar clearly at every stage.

---

## 27. Final Product Feeling

> *I entered the moment I was born, and the universe rewound itself for me.*

Nakshatra is part astronomy tool, part cinematic memory, part interactive cosmic artwork. It is not a website that calculates planets. It is a visual ritual for seeing a person's first moment in the solar system.
