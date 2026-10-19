import { FAQ } from '../content';
import { Reveal } from './Reveal';

export function Faq() {
  return (
    <section className="sec" id="faq">
      <div className="wrap wrap--narrow">
        <Reveal as="h2">{FAQ.title}</Reveal>
        {FAQ.items.map((item, i) => (
          <Reveal as="details" key={item.q} delay={(i % 3) * 60}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
