/**
 * @file profilePictureStore.ts
 * @description Pinia store for the Profile Picture step
 */

import { createStepStore } from './stepStoreFactory';
import type { ProfilePictureData } from '../types/steps';

// Create and export the store
export const useProfilePictureStore = createStepStore<ProfilePictureData>({
  id: 'profile-picture',
  title: 'Profile Picture',
  initialData: {
    imageUrl: '',
    altText: ''
  }
});
