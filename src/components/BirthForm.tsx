import { useState, type FormEvent } from 'react';
import { IANAZone } from 'luxon';
import { useNakshatraStore, type BirthInput } from '../state/nakshatraStore';

const cities = [
  ['Kathmandu, Nepal', 27.7172, 85.3240, 'Asia/Kathmandu'],
  ['Bengaluru, India', 12.9716, 77.5946, 'Asia/Kolkata'],
  ['New York, USA', 40.7128, -74.0060, 'America/New_York'],
  ['London, UK', 51.5074, -0.1278, 'Europe/London'],
  ['Damak, Nepal', 26.6609, 87.6975, 'Asia/Kathmandu'],
] as const;
type Values = Record<keyof BirthInput, string>;
export default function BirthForm({ onEditingStart, onBirthSubmit }: {
  onEditingStart?: () => void; onBirthSubmit: (input: BirthInput) => void;
}) {
  const details = useNakshatraStore(s => s.birthDetails);
  const [values, setValues] = useState<Values>({birthDate: details.birthDate, birthTime: details.birthTime, latitude: String(details.latitude), longitude: String(details.longitude), timezone: details.timezone});
  const [error, setError] = useState('');
  function update(key: keyof Values, value: string) {
    onEditingStart?.(); setValues(v => ({...v, [key]: value})); setError('');
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Values;
    if (!IANAZone.isValidZone(values.timezone.trim())) { setError('Enter a timezone such as Asia/Kathmandu or America/Chicago.'); return; }
    onBirthSubmit({...values, timezone: values.timezone.trim(), latitude: Number(values.latitude), longitude: Number(values.longitude)});
  }
  return <form className="birth-form" onSubmit={submit}>
    <label className="birth-field">A familiar place
      <select className="birth-input" defaultValue="" onChange={e => {
        const city = cities[Number(e.target.value)]; if (!city) return;
        onEditingStart?.(); setValues(v => ({...v, latitude: String(city[1]), longitude: String(city[2]), timezone: city[3]})); setError('');
      }}><option value="" disabled>Choose a city, or enter coordinates below</option>{cities.map((c,i) => <option key={c[0]} value={i}>{c[0]}</option>)}</select>
    </label>
    <div className="birth-fields">
      <label className="birth-field">Birth date<input className="birth-input" type="date" required max={new Date().toLocaleDateString('en-CA')} name="birthDate" value={values.birthDate} onChange={e => update('birthDate',e.target.value)}/></label>
      <label className="birth-field">Local time<input className="birth-input" type="time" required name="birthTime" value={values.birthTime} onChange={e => update('birthTime',e.target.value)}/></label>
      <label className="birth-field">Latitude<input className="birth-input" type="number" required min="-90" max="90" step="any" name="latitude" value={values.latitude} onChange={e => update('latitude',e.target.value)}/></label>
      <label className="birth-field">Longitude<input className="birth-input" type="number" required min="-180" max="180" step="any" name="longitude" value={values.longitude} onChange={e => update('longitude',e.target.value)}/></label>
    </div>
    <label className="birth-field">Birthplace timezone<input className="birth-input" required placeholder="Asia/Kathmandu" name="timezone" value={values.timezone} onChange={e => update('timezone', e.target.value)} aria-describedby="timezone-note"/></label>
    <p id="timezone-note" className="birth-help">Use the birthplace’s regional timezone. Coordinates alone cannot determine historical clock changes.</p>
    {error && <p className="birth-error" role="alert">{error}</p>}
    <button className="birth-submit-button" type="submit">Find my first sky <span aria-hidden="true">↗</span></button>
  </form>;
}

