/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** «true» в демо-сборке для GitHub Pages: форма не отправляет заявки. */
  readonly VITE_DEMO?: string;
  readonly VITE_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Реквизиты оператора для подвала (пусто, пока legal/operator.json не заполнен). Подставляется при сборке в vite.config.ts. */
declare const __OPERATOR_LINE__: string;
/** Версия документа «Согласие»: уходит вместе с заявкой, чтобы знать, с каким текстом согласился человек. */
declare const __CONSENT_VERSION__: string;
