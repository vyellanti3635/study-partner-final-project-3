// Type declarations for SCSS CSS Modules
declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

// Type declaration for direct SCSS imports (side-effect only)
declare module '*.scss' {
  const content: never;
  export default content;
}

// Type declarations for vite-plugin-pwa virtual modules
declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
