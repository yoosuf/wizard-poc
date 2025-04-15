/**
 * @file socialLinksValidation.ts
 * @description Validation schema for the Social Links step
 */

import * as yup from 'yup';
import type { SocialLinksData } from '../types/steps';

/**
 * Validation schema for the Social Links step
 */
export const socialLinksSchema = yup.object<SocialLinksData>({
  linkedin: yup.string()
    .url('Please enter a valid LinkedIn URL')
    .notRequired(),
  twitter: yup.string()
    .url('Please enter a valid Twitter URL')
    .notRequired(),
  github: yup.string()
    .url('Please enter a valid GitHub URL')
    .notRequired(),
  website: yup.string()
    .url('Please enter a valid website URL')
    .notRequired()
});
