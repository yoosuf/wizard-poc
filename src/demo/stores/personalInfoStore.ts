/**
 * @file personalInfoStore.ts
 * @description Pinia store for the Personal Information step
 */

import { createStepStore } from './stepStoreFactory';
import type { PersonalInfoData } from '../types/steps';

// Initial form data
const initialData: PersonalInfoData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
};

// Create and export the store
export const usePersonalInfoStore = createStepStore<PersonalInfoData>({
  id: 'personal-info',
  title: 'Personal Information',
  initialData,
});
