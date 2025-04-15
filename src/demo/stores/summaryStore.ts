/**
 * @file summaryStore.ts
 * @description Pinia store for the Summary step
 */

import { createStepStore } from './stepStoreFactory';

// Create and export the store
export const useSummaryStore = createStepStore<{ termsAccepted: boolean }>({
  id: 'summary',
  title: 'Summary',
  optional: false,
  initialData: {
    termsAccepted: false
  }
});
