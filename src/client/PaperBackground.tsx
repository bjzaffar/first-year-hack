import { useEffect, useState } from 'react';
import Particles from './vendor/reactbits/Particles.js';

const colors = ['#b4cba5', '#c5b4db', '#e4bc9b', '#d9abb9'];

export function PaperBackground() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <div className="paper-background" aria-hidden="true">
    <Particles key={String(reducedMotion)} particleCount={140} particleColors={colors} particleBaseSize={5}
      sizeRandomness={0} speed={0.035} opacity={0.45}
      glow={0} twinkle={0} connections={false} intro={false}
      moveParticlesOnHover={false} clickBurst={false} disableRotation
      drift="up" driftSpeed={0.12} pixelRatio={1.5} paused={reducedMotion} />
  </div>;
}
