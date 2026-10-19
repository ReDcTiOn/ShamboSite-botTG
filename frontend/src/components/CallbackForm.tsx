import { useRef, useState, type FormEvent } from 'react';
import { CALLBACK_URL, PHONE_DISPLAY } from '../config';
import { formatPhoneInput, isCompletePhone } from '../lib/phone';

type Status = 'idle' | 'sending' | 'ok' | 'error' | 'limited' | 'demo';

/** Демо-сборка (GitHub Pages): бэкенда нет, поэтому заявки не принимаются. */
const DEMO = import.meta.env.VITE_DEMO === 'true';

const MESSAGES: Record<Exclude<Status, 'idle' | 'sending'>, string> = {
  ok: 'Спасибо! Мы получили заявку и скоро перезвоним.',
  error: `Не удалось отправить. Позвоните нам напрямую: ${PHONE_DISPLAY}`,
  limited: `Слишком много заявок с вашего адреса. Позвоните нам напрямую: ${PHONE_DISPLAY}`,
  demo: `Это демо-версия сайта: заявки здесь не принимаются. На рабочем сайте форма отправит их в Telegram. Позвонить можно: ${PHONE_DISPLAY}`,
};

/** Форма обратного звонка. Заявка уходит на бэкенд (/api/callback), оттуда в Telegram. */
export function CallbackForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // ловушка для ботов: людям не видна
  const [agree, setAgree] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [agreeError, setAgreeError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const phoneRef = useRef<HTMLInputElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('idle');

    const phoneProblem = isCompletePhone(phone) ? '' : 'Введите номер полностью, 10 цифр после +7';
    const agreeProblem = agree ? '' : 'Нужно ваше согласие, чтобы мы могли перезвонить';
    setPhoneError(phoneProblem);
    setAgreeError(agreeProblem);
    if (phoneProblem) return phoneRef.current?.focus();
    if (agreeProblem) return agreeRef.current?.focus();

    if (DEMO) return setStatus('demo');

    setStatus('sending');
    try {
      const response = await fetch(CALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone, comment: comment.trim(), website }),
      });
      if (response.status === 429) return setStatus('limited');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setName('');
      setPhone('');
      setComment('');
      setAgree(false);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <label>
        <span>Как к вам обращаться</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Иван"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label>
        <span>
          Телефон <i aria-hidden="true">*</i>
        </span>
        <input
          ref={phoneRef}
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (900) 123-45-67"
          required
          aria-invalid={phoneError ? true : undefined}
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
        />
        {phoneError && (
          <small className="err" role="alert">
            {phoneError}
          </small>
        )}
      </label>

      <label>
        <span>Что откачать и где</span>
        <textarea
          name="comment"
          rows={3}
          maxLength={400}
          placeholder="Например: выгребная яма, около 5 кубов, Хабаровский район"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>

      <input
        className="hp"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <label className="agree">
        <input ref={agreeRef} type="checkbox" name="agree" required checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>Согласен на обработку моих данных для обратного звонка</span>
      </label>
      {agreeError && (
        <small className="err" role="alert">
          {agreeError}
        </small>
      )}

      <button className="btn btn--dark" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : 'Заказать звонок'}
      </button>

      <p
        className={`form__status${status === 'ok' ? ' ok' : status === 'error' || status === 'limited' || status === 'demo' ? ' bad' : ''}`}
        role="status"
        aria-live="polite"
      >
        {status === 'ok' || status === 'error' || status === 'limited' || status === 'demo' ? MESSAGES[status] : ''}
      </p>
    </form>
  );
}
