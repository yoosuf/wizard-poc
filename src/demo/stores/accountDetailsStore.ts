/**
 * @file accountDetailsStore.ts
 * @description Pinia store for the Account Details step
 * 
 * This store manages the state and validation for the account details step
 * in the wizard registration process.
 * 
 * @module AccountDetailsStore
 * @category Stores
 * @subcategory WizardStores
 */

import { createStepStore } from './stepStoreFactory';
import type { AccountDetailsData } from '../types/steps';

/**
 * Creates a Pinia store for managing account details
 * 
 * @remarks
 * This store handles:
 * - Initial form data for account creation
 * - Username, password, and password confirmation fields
 * - Step configuration in the wizard workflow
 * 
 * @returns A Pinia store with methods for managing account details state
 * 
 * @example
 * ```typescript
 * const accountDetailsStore = useAccountDetailsStore();
 * accountDetailsStore.setData({ username: 'newuser' });
 * ```
 */
export const useAccountDetailsStore = createStepStore<AccountDetailsData>({
  /**
   * Unique identifier for the account details step
   * @type {string}
   */
  id: 'account-details',

  /**
   * Display title for the account details step
   * @type {string}
   */
  title: 'Account Details',

  /**
   * Indicates that this step is required in the wizard
   * @type {boolean}
   */
  optional: false,

  /**
   * Initial form data with empty string values
   * @type {AccountDetailsData}
   */
  initialData: {
    username: '',     // User's chosen username
    password: '',     // User's password
    passwordConfirm: '' // Password confirmation
  }
});
