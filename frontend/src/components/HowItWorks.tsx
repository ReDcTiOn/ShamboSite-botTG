import { STEPS } from '../content';
import { Reveal } from './Reveal';

export function HowItWorks() {
  return (
    <section className="sec sec--tint" id="how">
      <div className="wrap">
        <Reveal as="h2">{STEPS.title}</Reveal>
        <ol className="steps">
          {STEPS.items.map((step, i) => (
            <Reveal as="li" key={step.title} delay={(i % 3) * 60}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
