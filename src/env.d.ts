/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly KIT_API_KEY: string;
  readonly KIT_FORM_ID: string;
  readonly KIT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}