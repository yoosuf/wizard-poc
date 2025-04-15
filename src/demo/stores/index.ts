/**
 * @file index.ts
 * @description Exports all stores for easy importing
 */

// Export the main wizard store
export { useWizardStore } from './wizardStore';

// Export step stores
export { usePersonalInfoStore } from './personalInfoStore';
export { useAccountDetailsStore } from './accountDetailsStore';
export { useProfilePictureStore } from './profilePictureStore';
export { useSocialLinksStore } from './socialLinksStore';
export { usePreferencesStore } from './preferencesStore';
export { useSummaryStore } from './summaryStore';

// Export factory for creating custom step stores
export { createStepStore } from './stepStoreFactory';
export type { StepStoreOptions } from './stepStoreFactory';
