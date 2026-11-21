export function GenerationStates({ stage }: { stage: 'analysing' | 'fitting' | 'preparing' }) {
  const messages = {
    analysing: 'Analysing photograph…',
    fitting: 'Fitting a folding recipe…',
    preparing: 'Preparing instructions…',
  };
  return (
    <section className="generation-states" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{messages[stage]}</p>
    </section>
  );
}
