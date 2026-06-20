# Nakshatra

Nakshatra is a 2.5D celestial birth atlas built with React, TypeScript, Vite, and Three.js. It turns birth details into a cinematic solar-system view that can move from the live present moment back to a paused birth snapshot.

## Concept

The product vision is to make birth-based celestial context feel immediate, visual, and explorable:

- **Live mode** shows the current solar-system view.
- **Birth input** lets the user enter a birth date, time, coordinates, and timezone.
- **Rewind mode** animates from now back to the birth moment.
- **Birth snapshot** pauses the scene at the calculated birth-time sky for exploration.

This is designed as a visually rich observatory-style experience rather than a traditional chart-only interface or astrology reading.

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- Zustand
- Tailwind CSS
- GSAP
- astronomy-engine
- luxon
- geo-tz

## Installation

```bash
npm install
```

## Run the App

### Development

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

### Production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## How birth input works

Nakshatra asks for:

- **Birth date**
- **Birth time**
- **Latitude**
- **Longitude**
- **Timezone**

Behavior:

1. The user enters a date and time.
2. The user enters latitude and longitude in decimal degrees.
3. Nakshatra attempts to infer a timezone from the coordinates.
4. The timezone remains editable in case the estimate needs correction.
5. On save, the app converts the birth input into a UTC moment.
6. The astronomy provider calculates planet positions for that timestamp.
7. The scene rewinds and lands on a paused birth snapshot.

Quick location presets are included for faster testing during development.

## Accuracy note

*Nakshatra calculates date-based planetary positions, but planet sizes and distances are artistically scaled for visual clarity. It is a 2.5D visualization, not a physically scaled simulator, and the MVP does not include astrology readings.*

Additional context:

- Planetary positions are derived from timestamp-based astronomy calculations.
- Scene distances are intentionally compressed so the full experience fits the camera framing.
- Vertical depth and presentation are visually exaggerated for readability.
- The result is best understood as an expressive visualization layer over astronomical time data.

## Visual scaling note

The solar system scene is deliberately stylized:

- orbital distances are non-linearly compressed,
- planets are not rendered at true relative size,
- the camera and composition prioritize clarity, mood, and usability.

## Project structure

```text
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

## Roadmap

Possible next steps:

- richer planetary metadata and labels,
- stronger birthplace context and geocoding refinement,
- deeper timeline controls beyond the current rewind flow,
- optional interpretive overlays outside the MVP,
- mobile UX polish and performance tuning,
- testing coverage for time conversion and astronomy mapping.

## For new developers

If you are new to the project, start here:

1. Run `npm install`
2. Run `npm run dev`
3. Open `src/App.tsx` for the main app flow
4. Open `src/components/BirthForm.tsx` for the input experience
5. Open `src/services/astronomyService.ts` for position calculation and scene scaling rules

That should give you the full mental model in under 5 minutes.
