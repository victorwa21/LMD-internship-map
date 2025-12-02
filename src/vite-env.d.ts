/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_EDIT_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

