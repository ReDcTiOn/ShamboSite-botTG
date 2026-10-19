import { STRIP } from '../content';

/** Полоса с четырьмя главными преимуществами под первым экраном. */
export function Strip() {
  return (
    <section className="strip" aria-label="Коротко о работе">
      <ul className="wrap strip__in">
        {STRIP.map((item) => (
          <li key={item.title}>
            <b>{item.title}</b>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
