/** Оранжевая волна перед формой. Период узора кратен ширине, поэтому цикл анимации бесшовный. */
const WAVE_PATH = `M0 60q90-40 180 0${'t180 0'.repeat(15)}V120H0z`;

export function WaveDivider() {
  return (
    <div className="divider" aria-hidden="true">
      <svg className="wave wave--d" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path d={WAVE_PATH} />
      </svg>
    </div>
  );
}
