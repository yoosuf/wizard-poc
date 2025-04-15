/**
 * @file socialLinksStore.ts
 * @description Pinia store for the Social Links step
 */

import { createStepStore } from './stepStoreFactory';
import type { SocialLinksData } from '../types/steps';

// Create and export the store
export const useSocialLinksStore = createStepStore<SocialLinksData>({
  id: 'social-links',
  title: 'Social Links',
  optional: true,
  initialData: {
    linkedin: '',
    twitter: '',
    github: '',
    website: ''
  }
});
