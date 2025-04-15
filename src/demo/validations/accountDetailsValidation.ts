/**
 * @file accountDetailsValidation.ts
 * @description Validation schema for the Account Details step
 */

import * as yup from 'yup';
import type { AccountDetailsData } from '../types/steps';

/**
 * Validation schema for the Account Details step
 */
export const accountDetailsSchema = yup.object<AccountDetailsData>({
  username: yup.string()
    .required('Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  passwordConfirm: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match')
});
