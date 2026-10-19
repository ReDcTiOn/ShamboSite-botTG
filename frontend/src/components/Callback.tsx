import { PHONE_DISPLAY, TEL_HREF } from '../config';
import { CALLBACK } from '../content';
import { CallbackForm } from './CallbackForm';
import { Reveal } from './Reveal';

export function Callback() {
  return (
    <section className="sec sec--accent sec--after-divider" id="callback">
      <div className="wrap callback">
        <Reveal>
          <h2>{CALLBACK.title}</h2>
          <p className="sec__sub">{CALLBACK.sub}</p>
          <p className="callback__tel">
            {CALLBACK.or}
            <br />
            <a href={TEL_HREF}>{PHONE_DISPLAY}</a>
          </p>
        </Reveal>
        <Reveal delay={60}>
          <CallbackForm />
        </Reveal>
      </div>
    </section>
  );
}
