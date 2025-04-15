import { App } from 'vue';
import Wizard from './components/Wizard.vue';

// Export components
export { default as Wizard } from './components/Wizard.vue';

// Export composables
export { useWizard } from './composables/useWizard';
export { useWizardStep } from './composables/useWizardStep';
export { createWizardContext, useWizardContext, WizardContextKey } from './composables/useWizardContext';
export { useWizardState } from './composables/useWizardState';
export { useWizardEvents } from './composables/useWizardEvents';

// Export types
export * from '../lib/types/wizard';

// Vue plugin
export default {
  install: (app: App) => {
    // Register the Wizard component globally
    app.component('Wizard', Wizard);
  }
};
