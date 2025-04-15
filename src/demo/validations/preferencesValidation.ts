/**
 * @file preferencesValidation.ts
 * @description Validation schema for the Preferences step
 */

import * as yup from 'yup';
import type { PreferencesData } from '../types/steps';

/**
 * Validation schema for the Preferences step
 */
export const preferencesSchema = yup.object<PreferencesData>({
  theme: yup.string()
    .oneOf(['light', 'dark', 'system'], 'Theme must be light, dark, or system')
    .required('Theme is required'),
  notifications: yup.object({
    email: yup.boolean().required(),
    push: yup.boolean().required(),
    sms: yup.boolean().required()
  }).test(
    'at-least-one-notification',
    'Please select at least one notification method',
    (value) => value.email || value.push || value.sms
  )
});
