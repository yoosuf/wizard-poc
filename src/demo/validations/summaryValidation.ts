/**
 * @file summaryValidation.ts
 * @description Validation schema for the Summary step
 */

import * as yup from 'yup';

export const summaryValidationSchema = yup.object({
  termsAccepted: yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions')
});
