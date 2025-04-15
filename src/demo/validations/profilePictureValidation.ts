/**
 * @file profilePictureValidation.ts
 * @description Validation schema for the Profile Picture step
 */

import * as yup from 'yup';
import type { ProfilePictureData } from '../types/steps';

/**
 * Validation schema for the Profile Picture step
 */
/**
 * Comprehensive validation schema for profile picture upload
 * @remarks
 * Validates image upload with rules for:
 * - File size
 * - File type
 * - Alt text requirements
 */
export const profilePictureSchema = yup.object<ProfilePictureData>({
  /**
   * Validates image URL/base64 data
   * @rules
   * - Optional for initial state
   * - Max file size of 5MB
   * - Must be an image file
   */
  imageUrl: yup.string()
    .test(
      'fileSize', 
      'Image size should be less than 5MB', 
      function(value) {
        // Skip validation if no image
        if (!value || value === '') return true;
        
        // For base64 strings, check the approximate size
        // base64 size is roughly 4/3 of the original file size
        const base64Length = value.length - (value.indexOf(',') + 1);
        const fileSize = (base64Length * 3) / 4;
        return fileSize < 5 * 1024 * 1024; // 5MB
      }
    )
    .test(
      'fileType',
      'Only image files are allowed',
      function(value) {
        // Skip validation if no image
        if (!value || value === '') return true;
        return value.startsWith('data:image/');
      }
    ),
  
  /**
   * Validates alt text
   * @rules
   * - Required when image is uploaded
   * - Optional when no image
   * - Minimum 5 characters when provided
   */
  altText: yup.string()
    .when('imageUrl', {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema
        .required('Alt text is required when an image is uploaded')
        .min(5, 'Alt text must be at least 5 characters long'),
      otherwise: (schema) => schema.notRequired()
    })
});
