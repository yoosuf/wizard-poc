/**
 * @file personalInfoValidation.ts
 * @description Validation schema for the Personal Information step
 */

import * as yup from 'yup';
import type { PersonalInfoData } from '../types/steps';

/**
 * Validation schema for the Personal Information step
 */
export const personalInfoSchema = yup.object<PersonalInfoData>({
  firstName: yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid phone number')
});
