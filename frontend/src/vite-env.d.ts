/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** «true» в демо-сборке для GitHub Pages: форма не отправляет заявки. */
  readonly VITE_DEMO?: string;
  readonly VITE_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
