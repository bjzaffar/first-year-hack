import type { CompiledTutorial } from '../shared/schemas.js';

export function Prepare({
  tutorial,
  onStart,
}: {
  tutorial: CompiledTutorial;
  onStart: () => void;
}) {
  const sheets = tutorial.materials.sheets;

  return (
    <section className="prepare-section">
      <h2>Prepare your materials</h2>
      <p>You will need {sheets.length} square sheet{sheets.length > 1 ? 's' : ''} of the same size.</p>
      {sheets.length > 1 && (
        <ul className="sheet-list">
          {sheets.map(sheet => (
            <li key={sheet.id}>
              <strong>{sheet.id}</strong> — Component: {sheet.componentId}
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={onStart}>Start folding</button>
      </div>
    </section>
  );
}
