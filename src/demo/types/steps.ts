/**
 * @file steps.ts
 * @description Type definitions for wizard step data structures
 */

/**
 * Personal Information step data interface
 */
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

/**
 * Account Details step data interface
 */
export interface AccountDetailsData {
  username: string;
  password: string;
  passwordConfirm: string;
}

/**
 * Profile Picture step data interface
 */
export interface ProfilePictureData {
  imageUrl: string;
  altText: string;
}

/**
 * Social Links step data interface
 */
export interface SocialLinksData {
  linkedin: string;
  twitter: string;
  github: string;
  website: string;
}

/**
 * Preferences step data interface
 */
export interface PreferencesData {
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

/**
 * Summary step data interface
 */
export interface SummaryData {
  // This step typically doesn't have its own data
  // It displays data from other steps
  submitted: boolean;
}

/**
 * Union type of all step data interfaces
 */
export type StepData = 
  | PersonalInfoData 
  | AccountDetailsData 
  | ProfilePictureData 
  | SocialLinksData 
  | PreferencesData 
  | SummaryData;
