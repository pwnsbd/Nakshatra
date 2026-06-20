# Nakshatra — Agent Todo
### Build Checklist · 31 Tasks · 10 Milestones

> Stack: Vite · React · TypeScript · Three.js · Zustand · astronomy-engine · luxon · geo-tz · GSAP · Tailwind CSS

---

## Milestone 1 — Project Foundation

### T00 · Project Setup

Scaffold the Nakshatra project with Vite, React, TypeScript, Three.js, Zustand, Tailwind CSS, GSAP, astronomy-engine, luxon, and geo-tz. Create the full folder structure as specified in the PRD.

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

**Acceptance Criteria**
- [ ] Project runs locally with no TypeScript errors
- [ ] Three.js is installed and a blank canvas renders
- [ ] All folders exist per structure above
- [ ] README added with project purpose and setup commands

---

### T01 · Main Visual Layout Shell

Build the full-screen dark cosmic UI shell matching the concept image. Left glassmorphism panel, center canvas area, right location card, bottom timeline, bottom-right control dock, top navigation. Use placeholder content for now.

**Acceptance Criteria**
- [ ] Layout matches concept image direction
- [ ] Left panel uses glass-style UI with backdrop blur
- [ ] Background is dark and cinematic (`#030712`)
- [ ] Top nav shows logo, links, My Snapshots, profile icon
- [ ] All placeholder areas are correctly positioned

---

## Milestone 2 — 3D Scene Foundation

### T02 · Three.js Canvas & Scene

Implement the Three.js scene inside the main canvas area. Set up: Scene, PerspectiveCamera, WebGLRenderer, resize handling, animation loop, and basic lighting. Camera at `position(0, 45, 75)` looking at origin. Add a placeholder sphere so the scene is visually confirmed.

**Acceptance Criteria**
- [ ] Three.js canvas renders inside the page
- [ ] Canvas resizes with the browser window
- [ ] A placeholder glowing sphere appears at center
- [ ] No memory leaks on component unmount
- [ ] View feels semi-top-down, not first-person

---

### T03 · Starfield Background

Create a reusable `Starfield` module using Three.js instanced particles or `Points`. Stars fill the scene background with variation in size and brightness. Add subtle twinkling if performance allows.

**Acceptance Criteria**
- [ ] Scene has a rich deep-space background
- [ ] Small white/blue dots, a few brighter stars
- [ ] Performance remains smooth (60 FPS)
- [ ] Starfield sits behind the solar system

---

### T04 · Static Stylized Solar System

Create a static 2.5D solar system with Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn (Uranus/Neptune optional). Use placeholder orbit positions arranged around elliptical orbit rings on the XZ plane. Style each planet distinctly.

Planet visual guide:
- Sun — orange/gold, glowing
- Earth — blue with atmosphere
- Mars — reddish
- Jupiter — large, tan/striped
- Saturn — with a ring
- Venus — warm cream
- Mercury — gray/brown, small

**Acceptance Criteria**
- [ ] Beautiful static solar system is visible
- [ ] Sun is clearly the center, orange/gold
- [ ] Orbit rings are thin with blue/gold glow
- [ ] Saturn has a visible ring
- [ ] Each planet is visually distinguishable

---

## Milestone 3 — Camera & Interaction

### T05 · Camera Orbit Controls

Add orbit, zoom, and pan camera controls. Left drag to orbit, scroll to zoom, right drag (or shift+drag) to pan. Add zoom limits preventing going inside planets. Add camera flip prevention. Implement a reset function. Disable controls during rewind animation.

**Acceptance Criteria**
- [ ] Mouse drag orbits the camera smoothly
- [ ] Scroll zooms in/out without going inside planets
- [ ] Camera does not flip upside down
- [ ] Reset camera returns to default position `(0, 45, 75)`
- [ ] Controls feel premium, not jittery

---

### T06 · Floating Planet Labels

Add planet name labels near each planet using `CSS2DRenderer` or HTML overlay labels. Labels must always face the camera. Implement toggle on/off via the control dock state.

**Acceptance Criteria**
- [ ] All 6+ planets have visible, readable labels
- [ ] Labels move correctly with planet positions
- [ ] Labels can be hidden via UI toggle
- [ ] Scene still looks clean with labels on

---

### T07 · Compass Rose

Add an N/S/E/W compass rose to the top-right corner of the 3D scene, matching the concept image. The compass updates visually to reflect the camera's current horizontal orientation as the user orbits.

**Acceptance Criteria**
- [ ] Compass rose is visible in top-right of scene
- [ ] N/S/E/W labels are readable
- [ ] Compass updates correctly as camera orbits
- [ ] Matches the style in the concept image

---

## Milestone 4 — Form, Validation & State

### T08 · Birth Form With Validation

Implement the birth input form. Fields: Date of Birth (date picker), Time of Birth (time picker), Latitude (decimal), Longitude (decimal), Timezone (auto-inferred via `geo-tz` when lat/long are entered, shown as editable field). Show friendly inline validation errors.

Example values:
```
Date:      1992-05-14
Time:      07:35
Latitude:  12.9716
Longitude: 77.5946
Timezone:  Asia/Kolkata  ← auto-inferred, editable
```

Validation rules:
- Date: required
- Time: required
- Latitude: required, `-90` to `90`
- Longitude: required, `-180` to `180`
- Timezone: required (auto-filled or manual)

**Acceptance Criteria**
- [ ] User can enter all birth details
- [ ] Timezone auto-infers from lat/long on blur
- [ ] Inline errors appear for invalid lat/long
- [ ] Valid submit calls `onBirthSubmit(input)`
- [ ] Form looks premium, not like a default HTML form

---

### T09 · App State Modes

Create the Zustand store with the full `NakshatraState`. Wire all mode transitions.

```ts
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

Mode transitions:
- Initial → `live`
- Form editing → `input`
- Valid submit → `rewinding`
- Animation complete → `birth-snapshot`
- Return to live → `live`
- Any failure → `error`

**Acceptance Criteria**
- [ ] App starts in `live` mode
- [ ] Submit transitions to `rewinding`
- [ ] Animation complete transitions to `birth-snapshot`
- [ ] Return to live clears snapshot state
- [ ] Mode is readable in debug/console

---

### T10 · Status Bar Component

Build the top-center two-state status bar matching the concept image. Not just a pill — a visual mode switcher showing both `LIVE` and `BIRTH SNAPSHOT` with an arrow (`→→→`) between them. Active state is highlighted; inactive is muted.

States:
- `LIVE` — green dot, "Real-time now"
- `BIRTH SNAPSHOT` — blue pause icon, "Paused at birth moment"

**Acceptance Criteria**
- [ ] Status bar shows both states with arrow between them
- [ ] Active state is highlighted; inactive is muted
- [ ] Updates correctly on mode change
- [ ] Matches concept image layout

---

## Milestone 5 — Astronomy Service

### T11 · Time Conversion Service

Create `timeService.ts` using `luxon`. Convert birth date + time + IANA timezone string into a stable UTC ISO timestamp. Do not use or assume the browser's local timezone.

```ts
type BirthInput = {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  latitude: number;
  longitude: number;
  timezone: string;  // IANA, e.g. "Asia/Kolkata"
};

type BirthMoment = {
  localDateTime: string;
  timezone: string;
  utcDateTime: string;  // ISO UTC
  latitude: number;
  longitude: number;
};

convertBirthInputToMoment(input: BirthInput): BirthMoment
```

**Acceptance Criteria**
- [ ] Same input always returns the same UTC timestamp
- [ ] Different timezone correctly changes UTC output
- [ ] Function is isolated from UI
- [ ] Unit tests or console test examples provided

---

### T12 · Astronomy Service Interface (Fake Provider)

Create `astronomyService.ts` with the `AstronomyProvider` abstraction. First implement with simplified circular-orbit math so positions change with date. Wire to the scene for visual testing before adding a real engine.

```ts
interface AstronomyProvider {
  getSolarSystemSnapshot(timestampUtc: string): Promise<SolarSystemSnapshot>;
}
```

**Acceptance Criteria**
- [ ] Function returns correct `PlanetPosition[]` structure
- [ ] Different dates return different positions
- [ ] Scene consumes snapshot data correctly
- [ ] Interface is clean and swappable

---

### T13 · Real Astronomy Engine (astronomy-engine)

Replace the fake orbit math with `astronomy-engine` calculations for Mercury, Venus, Earth, Mars, Jupiter, Saturn. Convert ecliptic heliocentric coordinates into the Three.js XZ plane. Keep real angular relationships but compress distances artistically.

**Acceptance Criteria**
- [ ] Planet positions are based on the real timestamp
- [ ] Birth date (1992-05-14) produces a visibly different arrangement from today
- [ ] Same date always produces the same result
- [ ] Scene components do not know which provider is used

---

### T14 · Planet Position Scaling System

Create an isolated `mapAstronomyPositionToScene()` function. Use non-linear compression so all planets are visible in the default camera view. Add clear comments explaining this is artistic scaling, not physical.

```ts
mapAstronomyPositionToScene(position: AstronomyPosition): { x: number; y: number; z: number }
```

**Acceptance Criteria**
- [ ] All planets visible in the default camera view
- [ ] Inner planets do not overlap the Sun
- [ ] Jupiter and Saturn are clearly farther out
- [ ] Scaling logic is in one isolated, commented function

---

## Milestone 6 — Live Mode

### T15 · Live Mode — Real-Time Solar System

On page load, use the current UTC timestamp to compute and render planet positions. Update positions every 30–60 seconds or via smooth interpolation. Earth rotates slowly. Status bar shows `LIVE`.

**Acceptance Criteria**
- [ ] App opens with the current solar system
- [ ] Planets are not frozen in live mode
- [ ] Current date/time is visible somewhere in the UI
- [ ] Status bar shows `LIVE` state
- [ ] Earth rotates slowly

---

## Milestone 7 — Rewind Animation

### T16 · Timeline Scrubber UI

Build the bottom timeline component matching the concept image. Left side: `NOW` with current date/time. Right side: `BIRTH MOMENT` in gold with birth date/time. Center: year markers (e.g. 2020, 2010, 2000, 1992, 1980). A glowing particle dot scrubs from right to left during rewind. Play/pause button on left.

**Acceptance Criteria**
- [ ] Timeline shows NOW, year markers, and BIRTH MOMENT
- [ ] Particle dot animates left during rewind
- [ ] Year at birth position is highlighted in gold
- [ ] Pauses correctly at final birth-snapshot state
- [ ] Matches concept image layout exactly

---

### T17 · Rewind Animation — Core

On valid submit: compute current and birth snapshots, set mode to `rewinding`, run a 4-second GSAP ease-in-out interpolation of planet XZ positions from current to birth. Animate `transitionProgress` 0→1. On complete: set mode to `birth-snapshot`, freeze planets, enable camera.

```ts
onSubmitBirthInput(input) {
  const birthMoment = convertBirthInputToMoment(input);
  const currentSnapshot = getSolarSystemSnapshot(nowUtc);
  const birthSnapshot = getSolarSystemSnapshot(birthMoment.utcDateTime);
  setMode("rewinding");
  animateTimeline(nowUtc, birthMoment.utcDateTime); // 4s GSAP
  animatePlanets(currentSnapshot, birthSnapshot);   // interpolate XZ
  onComplete(() => {
    setSnapshot(birthSnapshot);
    setMode("birth-snapshot");
    enableCameraControls();
  });
}
```

**Acceptance Criteria**
- [ ] Planets visibly move from current to birth positions
- [ ] Animation takes 4 seconds with smooth easing
- [ ] Timeline scrubs correctly during animation
- [ ] App pauses cleanly at birth moment
- [ ] No abrupt jumps or flickers

---

### T18 · Reduced Motion Mode

Add a reduced-motion toggle (also respects `prefers-reduced-motion` media query). When enabled: skip the 4-second animation, fade directly from live to birth snapshot. All UI transitions become minimal.

**Acceptance Criteria**
- [ ] Toggle is accessible from settings or control dock
- [ ] Rewind animation is skipped when enabled
- [ ] App transitions directly to `birth-snapshot`
- [ ] App remains fully usable and beautiful

---

## Milestone 8 — Earth Marker & Location

### T19 · EarthWithMarker Component

Create `EarthWithMarker` in Three.js. Render Earth sphere with atmosphere glow. Accept lat/long, convert to sphere surface coordinates, place a glowing blue pin mesh parented to Earth. Orient Earth so the marker is visible after rewind completes.

Coordinate formula:
```ts
const latRad = latitude * Math.PI / 180;
const lonRad = longitude * Math.PI / 180;
const x = radius * Math.cos(latRad) * Math.cos(lonRad);
const y = radius * Math.sin(latRad);
const z = radius * Math.cos(latRad) * Math.sin(lonRad);
```

**Acceptance Criteria**
- [ ] Different lat/long values move the marker correctly
- [ ] Marker sits on Earth surface, not floating
- [ ] Marker glows and is clearly visible
- [ ] Earth orients toward marker after snapshot completes

---

### T20 · Geocode Service — Place Name

Create `geocodeService.ts` using OpenStreetMap Nominatim reverse geocoding (free, no API key). Given latitude and longitude, return a human-readable place name (e.g. `"Bengaluru, India"`). Show in the location card. Handle failures gracefully by falling back to coordinates.

```ts
reverseGeocode(lat: number, lon: number): Promise<string>
// Returns: "Bengaluru, India" or "12.9716° N, 77.5946° E" on failure
```

**Acceptance Criteria**
- [ ] Place name appears in location card after submit
- [ ] Matches concept image style (e.g. `"Bengaluru, India"`)
- [ ] Failure falls back to showing coordinates only
- [ ] API call is made once on submit, not on every keystroke

---

### T21 · Location Card Component

Build the right-side location card. Show: place name (bold, large), mini Earth globe with pin, latitude, longitude, timezone, birth date/time. `"View on Map"` button links to Google Maps with the coordinates. Uses glassmorphism style matching the concept image.

```
https://www.google.com/maps?q={latitude},{longitude}
```

**Acceptance Criteria**
- [ ] Card appears after birth input is submitted
- [ ] All values match user input exactly
- [ ] Mini globe with pin is visible
- [ ] "View on Map" opens Google Maps correctly
- [ ] Card does not obscure the main solar system

---

## Milestone 9 — Polish & Controls

### T22 · Control Dock

Build the bottom-right control dock with icon buttons matching the concept image: Orbits, Planets, Stars, Labels, Settings. Active buttons glow blue. Wire actions: Reset Camera and Return to Live.

**Acceptance Criteria**
- [ ] All toggles work correctly (orbits, planets, stars, labels)
- [ ] Active state has blue glow
- [ ] Reset camera restores default view `(0, 45, 75)`
- [ ] Return to live clears snapshot and resumes live mode
- [ ] Dock matches concept image icon style

---

### T23 · Birth Snapshot Success State

When rewind completes, show success message in the left panel:

> *"System rewound to your birth moment. Paused and ready for exploration."*

Status bar switches to `BIRTH SNAPSHOT`. Planets freeze completely. Earth marker remains visible. Camera controls fully activate.

**Acceptance Criteria**
- [ ] Success message is readable and satisfying
- [ ] Planets stop moving completely after pause
- [ ] Status bar is in `BIRTH SNAPSHOT` state
- [ ] Camera is freely explorable
- [ ] Subtle effects (Sun glow, star twinkle) can continue

---

### T24 · Sun Glow, Bloom & Lighting

Add Three.js `EffectComposer` with `UnrealBloomPass` for bloom. Sun uses emissive material with warm orange/gold glow. A point light emanates from the Sun position. Planets have subtle rim lighting. Optionally add animated surface noise shader on Sun. Do not overbloom until UI text is unreadable.

**Acceptance Criteria**
- [ ] Sun is visually dominant and warm
- [ ] Bloom is visible but not overwhelming
- [ ] Planet visibility improves with rim lighting
- [ ] Performance stays at 60 FPS on modern desktop

---

### T25 · Saturn Ring & Planet Materials

Polish all planet materials: Saturn ring (flat ellipse mesh with opacity), Jupiter subtle banding, Earth blue with atmosphere glow shader, Mars reddish, Venus warm cream, Mercury gray-brown. Use free NASA texture maps for Earth if available.

**Acceptance Criteria**
- [ ] Saturn ring is immediately recognizable
- [ ] Earth is clearly Earth — blue with atmosphere glow
- [ ] Each planet is visually distinct from the others
- [ ] Overall style is premium 2.5D cosmic, not cartoon

---

### T26 · Loading & Error States

Add graceful loading states at every async step:
- `"Calculating birth sky…"`
- `"Preparing solar system…"`
- `"Rewinding time…"`

Add error states for:
- Invalid input (inline, per field)
- Timezone inference failure
- Astronomy calculation failure
- WebGL unsupported

User must never see a frozen blank screen.

**Acceptance Criteria**
- [ ] Loading states are shown at the right moments
- [ ] Error messages are friendly and human-readable
- [ ] App can recover without a page refresh where possible
- [ ] WebGL unsupported shows a clear fallback message

---

### T27 · Demo Presets

Add small preset buttons for quick testing. Each fills latitude, longitude, and timezone. Keep visually secondary — small helper strip below the form or collapsed in a dev section.

Presets:
| Label | Latitude | Longitude | Timezone |
|-------|----------|-----------|----------|
| Kathmandu, Nepal | 27.7172 | 85.3240 | Asia/Kathmandu |
| Bengaluru, India | 12.9716 | 77.5946 | Asia/Kolkata |
| New York, USA | 40.7128 | -74.0060 | America/New_York |
| London, UK | 51.5074 | -0.1278 | Europe/London |

**Acceptance Criteria**
- [ ] Presets fill correct lat/long/timezone values
- [ ] User can still edit values manually after filling
- [ ] Presets are visually secondary to the main form

---

## Milestone 10 — Final Polish & Handoff

### T28 · Responsive Layout

Improve layout for tablet and mobile. Desktop is primary — do not break it. Tablet: left panel narrows, location card collapsible. Mobile: form becomes a bottom sheet, timeline compact, labels hidden by default, control dock simplified, canvas remains full-screen.

**Acceptance Criteria**
- [ ] Desktop looks excellent, matching concept image
- [ ] Tablet layout does not break
- [ ] Mobile form is accessible as a bottom sheet
- [ ] Canvas remains the main focus on all breakpoints

---

### T29 · Final Visual Polish Pass

Full UI polish pass against the concept image. Check every surface.

Checklist:
- [ ] Glass panels have subtle blur and correct border
- [ ] Buttons have blue glow on active state
- [ ] Orbit rings are elegant and low-opacity
- [ ] Timeline has glowing particle and year markers
- [ ] Status bar looks premium
- [ ] Planet labels are subtle and readable
- [ ] Earth marker is a clear glowing blue pin
- [ ] Background has depth (star parallax if possible)
- [ ] UI spacing feels intentional
- [ ] Typography feels observatory-grade

**Acceptance Criteria**
- [ ] App feels like a real product, not a prototype
- [ ] Visual design strongly matches the concept image
- [ ] No element looks placeholder or unstyled

---

### T30 · README — Usage & Accuracy Note

Update README with: project name, concept, installation, dev/build commands, how birth input works, accuracy disclaimer, visual scaling note, future roadmap.

Accuracy note must include:

> *Nakshatra calculates date-based planetary positions, but planet sizes and distances are artistically scaled for visual clarity. It is a 2.5D visualization, not a physically scaled simulator.*

**Acceptance Criteria**
- [ ] README explains how to run the app
- [ ] README explains the product vision clearly
- [ ] Accuracy limitation is stated honestly
- [ ] A new developer can understand the project in under 5 minutes

---

### T31 · Final MVP Acceptance Test

Run a full manual test with the following input:

```
Date:      1992-05-14
Time:      07:35
Latitude:  12.9716
Longitude: 77.5946
Timezone:  Asia/Kolkata
```

Expected flow:
1. App opens in live mode — solar system is moving
2. User fills the form — timezone auto-infers
3. User clicks "Show My Birth Sky"
4. Rewind animation starts — timeline scrubs left
5. Planets move from current to birth positions
6. Earth marker appears at Bengaluru coordinates
7. Location card shows "Bengaluru, India"
8. App pauses at birth moment — success message appears
9. User can orbit and zoom freely
10. User toggles labels, orbits, stars — all work
11. User clicks Return to Live — live mode resumes
12. No console errors at any step

**Acceptance Criteria**
- [ ] All 12 flow steps pass
- [ ] No console errors throughout
- [ ] No broken layout at any stage
- [ ] No obvious frame drops during rewind animation
- [ ] The experience feels cinematic and personal

---

## Important Implementation Notes

- Do not build astrology readings in the MVP
- Do not over-focus on physical astronomical scale
- Planet sizes and distances are artistically scaled — this is intentional and should be stated in the UI
- The astronomy abstraction (`AstronomyProvider`) must be kept clean so the engine can be swapped later
- Precompute start and end planet positions before animating — never calculate per animation frame
- `EffectComposer` / bloom should be added as its own task (T24) — it is a meaningful dependency

> *The user should feel like the universe rewound to the moment they were born.*
