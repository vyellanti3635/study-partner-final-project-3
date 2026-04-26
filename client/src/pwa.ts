// Service worker registration helper.
// Uses vite-plugin-pwa's virtual module to register the SW and hook
// into the update lifecycle. When a new build is available, the SW
// calls onNeedRefresh — we prompt the user to reload.
//
// This file is imported once from main.tsx as a side-effect.

import { registerSW } from 'virtual:pwa-register';

registerSW({
  // Called when a new service worker is installed and waiting to activate.
  onNeedRefresh() {
    // Show a simple confirm dialog — no fancy toast needed here
    // since this fires infrequently (only on new deployments).
    const confirmed = window.confirm(
      'A new version of StudyPartner is available. Reload to update?'
    );
    if (confirmed) {
      window.location.reload();
    }
  },

  // Called when the SW has taken control (first install or update applied).
  onOfflineReady() {
    // Silent — no UI clutter on first install.
  },
});
