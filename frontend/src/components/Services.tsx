import { TEL_HREF } from '../config';
import { SERVICES } from '../content';
import { Reveal } from './Reveal';

export function Services() {
  return (
    <section className="sec" id="services">
      <div className="wrap">
        <Reveal as="h2">{SERVICES.title}</Reveal>
        <p className="sec__sub">{SERVICES.sub}</p>
        <div className="services">
          <Reveal as="article" className="feature">
            <h3>{SERVICES.feature.title}</h3>
            <p>{SERVICES.feature.text}</p>
            <a className="feature__link" href={TEL_HREF}>
              {SERVICES.feature.link}
            </a>
          </Reveal>
          <ul className="list">
            {SERVICES.list.map((item, i) => (
              <Reveal as="li" key={item.title} delay={(i % 3) * 60}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
