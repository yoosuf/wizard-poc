/**
 * @file preferencesStore.ts
 * @description Pinia store for the Preferences step
 */

import { createStepStore } from './stepStoreFactory';
import type { PreferencesData } from '../types/steps';

// Create and export the store
export const usePreferencesStore = createStepStore<PreferencesData>({
  id: 'preferences',
  title: 'Preferences',
  optional: true,
  initialData: {
    theme: 'light',
    notifications: {
      email: true,
      push: false,
      sms: false
    }
  }
});
