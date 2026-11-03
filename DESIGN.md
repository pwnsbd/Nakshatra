# Nakshatra: a celestial instrument

The experience is a small kinetic sculpture in a large, quiet space. Fine bronze orbital threads, muted luminous bodies, and restrained typography replace the dashboard. The primary interaction is a thread of time between the present and a personal birth instant.

## Behavior

- Enter date, local time, coordinates, and an explicit regional timezone in the birth dialog.
- Travel back over 5.6 seconds, then hold the calculated birth snapshot. Reduced-motion preferences skip the travel.
- Scrub the time thread with touch, pointer, or keyboard; select a planet to inspect heliocentric longitude.
- Return to the current time or edit the moment. Birth details persist in this browser through the existing store.
- Astronomy Engine still calculates Mercury through Saturn. Distances and body sizes are artistic; this is not a local horizon view. Coordinates do not change heliocentric positions.
- City presets provide regional timezones. The previous longitude-based timezone guess was removed because it could silently choose an incorrect historical offset.

## Implementation

The active experience is App.tsx, three/CelestialInstrument.ts, styles/instrument.css, and components/BirthForm.tsx. Legacy scene components remain available but are not rendered. Existing astronomy and time services remain in use.

## Verification

Production TypeScript/Vite build passes. Browser checks covered desktop and 390px phone layout, form submission using sample data, exact arrival at 15 June 1994 08:30 Asia/Kathmandu, planetary longitude selection, keyboard scrubbing, and return to live. Vite reports a large JavaScript bundle (about 840 kB before gzip). Reduced-motion and WebGL fallback branches were inspected in source, not device-tested.
