import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { REVISION } from 'three';
import { GenerateResponseSchema, HealthSchema } from '../shared/schemas.js';
import './style.css';

function App() {
  const [status, setStatus] = useState('Check the local server or load the synthetic contract fixture.');
  const [busy, setBusy] = useState(false);
  const [fixture, setFixture] = useState<unknown>(null);
  async function request(kind: 'health' | 'fixture') {
    setBusy(true);
    setFixture(null);
    try {
      const response = await fetch(kind === 'health' ? '/api/health' : '/api/generate', kind === 'health' ? undefined : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractVersion: '1', mode: 'fixture' }),
      });
      const json: unknown = await response.json();
      if (kind === 'health') {
        const health = HealthSchema.parse(json);
        if (!response.ok) throw new Error('Health check failed.');
        setStatus(`Backend ${health.backend}. Model and compiler are not configured. Live generation is unavailable.`);
      } else {
        const result = GenerateResponseSchema.parse(json);
        if (!result.ok) throw new Error(result.error.message);
        if (!response.ok) throw new Error('Fixture request failed.');
        setFixture(result.tutorial);
        setStatus('Synthetic fixture loaded. No photograph was analysed; physical foldability is unverified.');
      }
    } catch {
      setStatus('Could not read a valid local server response. Start the backend and retry.');
    } finally { setBusy(false); }
  }
  return <main>
    <p className="eyebrow">FoldLens · development foundation</p>
    <h1>From photograph to paper.</h1>
    <p>The application foundation is ready for development. Upload, live generation, geometry compilation and the tutorial player are separate tickets.</p>
    <section aria-labelledby="diagnostics"><h2 id="diagnostics">Local diagnostics</h2>
      <p>Contract version 1 · Three.js r{REVISION} installed</p>
      <div className="actions"><button disabled={busy} onClick={() => request('health')}>Check server</button>
      <button disabled={busy} onClick={() => request('fixture')}>Load synthetic fixture</button></div>
      <p role="status">{busy ? 'Contacting local server…' : status}</p>
      {fixture !== null && <details open><summary>Synthetic contract data</summary><pre>{JSON.stringify(fixture, null, 2)}</pre></details>}
    </section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
