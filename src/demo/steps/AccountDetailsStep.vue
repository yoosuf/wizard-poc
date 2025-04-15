<!-- 
  @file AccountDetailsStep.vue
  @description Vue component for capturing user account details in a wizard workflow
  @module AccountDetailsStep
  @category WizardSteps
  @subcategory UserRegistration

  @remarks
  This component handles the account details step in a multi-step registration process.
  It provides form inputs for username, password, and password confirmation with:
  - Real-time validation
  - Error handling
  - Seamless integration with Pinia store
-->
<template>
  <!-- 
    Account Details Form
    Prevents default form submission and uses custom validation
    Applies step-form class for consistent styling 
  -->
  <form @submit.prevent="onSubmit" class="step-form">
    <!-- Username Input Group -->
    <div class="form-group">
      <label for="username">Username</label>
      <input 
        id="username" 
        name="username"
        :value="values.username"
        @input="handleInput($event, 'username')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.username }"
        aria-describedby="username-error"
      />
      <!-- Username Error Message -->
      <div 
        v-if="validationTriggered && errors.username" 
        id="username-error" 
        class="error-message"
        role="alert"
      >
        {{ errors.username }}
      </div>
    </div>

    <!-- Password Input Group -->
    <div class="form-group">
      <label for="password">Password</label>
      <input 
        id="password" 
        name="password"
        type="password" 
        :value="values.password"
        @input="handleInput($event, 'password')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.password }"
        aria-describedby="password-error"
      />
      <!-- Password Error Message -->
      <div 
        v-if="validationTriggered && errors.password" 
        id="password-error" 
        class="error-message"
        role="alert"
      >
        {{ errors.password }}
      </div>
    </div>

    <!-- Password Confirmation Input Group -->
    <div class="form-group">
      <label for="passwordConfirm">Confirm Password</label>
      <input 
        id="passwordConfirm" 
        name="passwordConfirm"
        type="password" 
        :value="values.passwordConfirm"
        @input="handleInput($event, 'passwordConfirm')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.passwordConfirm }"
        aria-describedby="passwordConfirm-error"
      />
      <!-- Password Confirmation Error Message -->
      <div 
        v-if="validationTriggered && errors.passwordConfirm" 
        id="passwordConfirm-error" 
        class="error-message"
        role="alert"
      >
        {{ errors.passwordConfirm }}
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
/**
 * @file AccountDetailsStep.vue
 * @description Script logic for the Account Details step in the wizard
 * @module AccountDetailsStepScript
 * @category WizardSteps
 * @subcategory ScriptLogic
 * 
 * @remarks
 * Handles form validation, state management, and integration with Pinia store
 * Uses vee-validate for form validation and reactive form handling
 */

// Import required Vue and library dependencies
import { computed, onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { storeToRefs } from 'pinia';

// Import local dependencies
import { useAccountDetailsStore } from '../stores';
import { AccountDetailsData } from '../types/steps';
import { accountDetailsSchema } from '../validations';

/**
 * Get the Pinia store for account details
 * @type {ReturnType<typeof useAccountDetailsStore>}
 */
const accountDetailsStore = useAccountDetailsStore();

/**
 * Extract reactive store properties
 * @remarks
 * Uses storeToRefs to preserve reactivity and prevent destructuring issues
 * @type {Object}
 */
const { data, validationTriggered } = storeToRefs(accountDetailsStore);

/**
 * Compute initial form data from store or use defaults
 * @returns {Object} Initial form data with username, password, passwordConfirm
 */
const initialFormData = computed(() => {
  // If we have data in the store, use it
  if (data.value && Object.keys(data.value).length > 0) {
    return {
      username: data.value.username || '',
      password: data.value.password || '',
      passwordConfirm: data.value.passwordConfirm || ''
    };
  }
  
  // Otherwise use empty defaults
  return {
    username: '',
    password: '',
    passwordConfirm: ''
  };
});

/**
 * Initialize form with vee-validate
 * @type {Object}
 * @property {Function} handleSubmit - Submit handler
 * @property {Function} resetForm - Reset form method
 * @property {Function} validate - Form validation method
 * @property {Object} values - Current form values
 * @property {Object} errors - Current form errors
 * @property {Function} setFieldValue - Set individual field value
 */
const { handleSubmit, resetForm, validate, values, errors, setFieldValue } = useForm<AccountDetailsData>({
  validationSchema: accountDetailsSchema,
  initialValues: {
    username: initialFormData.value.username,
    password: initialFormData.value.password,
    passwordConfirm: initialFormData.value.passwordConfirm
  },
  validateOnMount: false  // Prevent validation on mount
});

/**
 * Watch for changes in store data and update form accordingly
 * @type {WatchEffect}
 */
watch(() => data.value, (newData) => {
  if (newData) {
    // Reset the form with new values from the store
    resetForm({
      values: {
        username: newData.username || '',
        password: newData.password || '',
        passwordConfirm: newData.passwordConfirm || ''
      }
    });
  }
}, { deep: true });

/**
 * Form submission handler
 * @param {AccountDetailsData} formValues - Validated form values
 * @returns {Promise<boolean>} Validation result
 */
const onSubmit = handleSubmit(async (formValues) => {
  // Set validation triggered flag
  validationTriggered.value = true;
  
  // Validate the form
  const isValid = await validate();
  
  // Update the data in the store
  accountDetailsStore.setData(formValues);
  
  // Update the store's validation state
  accountDetailsStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  return isValid.valid;
});

/**
 * Allowed form field names for type safety
 * @type {string[]}
 */
type FormFields = 'username' | 'password' | 'passwordConfirm';

/**
 * Handle input changes with debounced validation
 * @param {Event} event - Input event
 * @param {FormFields} field - Field being updated
 */
const handleInput = (event: Event, field: FormFields) => {
  const target = event.target as HTMLInputElement;
  setFieldValue(field, target.value);
  
  // Update data in the store as the user types
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    accountDetailsStore.setData({ [field]: target.value });
  }, 0);
  
  // Don't validate on every keystroke, only when the field is complete
  // This prevents excessive validation cycles
  if (target.value.length > 3 || target.value.length === 0) {
    validate().then((result) => {
      // If all fields are valid, update the store validation state
      if (Object.keys(errors.value).length === 0) {
        // Clear validation triggered if all fields are valid
        if (validationTriggered.value) {
          validationTriggered.value = false;
        }
        // Update the store's validation state
        accountDetailsStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }
};

/**
 * Initialize component on mount
 * Sets up initial form state, validates data, and syncs with store
 */
onMounted(async () => {
  console.log('[AccountDetailsStep] Mounted, store data:', data.value);
  
  // If we have data in the store, use it to reset the form
  if (data.value && Object.keys(data.value).length > 0) {
    resetForm({
      values: {
        username: data.value.username || '',
        password: data.value.password || '',
        passwordConfirm: data.value.passwordConfirm || ''
      }
    });
  }
  
  // Validate silently without showing errors or triggering validation UI
  const isValid = await validate();
  
  // Set initial data in the store if not already set
  if (!data.value || Object.keys(data.value).length === 0) {
    const { username, password, passwordConfirm } = values as AccountDetailsData;
    accountDetailsStore.setData({ username, password, passwordConfirm });
  }
  
  // Update validation in the store without triggering the UI
  accountDetailsStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  // Ensure validation is not triggered on initial load
  validationTriggered.value = false;
  
  console.log(`[AccountDetailsStep] Initial validation: isValid=${isValid.valid}, errors=`, Object.values(errors.value));
});

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    // When wizard calls validate, trigger error display
    validationTriggered.value = true;
    const isValid = await validate();
    
    // Update data in the store
    accountDetailsStore.setData(values);
    
    // Update the store's validation state
    accountDetailsStore.setValidationState(isValid.valid, 
      Object.values(errors.value)
        .filter((error): error is string => error !== undefined)
    );
    
    console.log(`[AccountDetailsStep] validate() called, isValid: ${isValid.valid}, errors:`, errors.value);
    
    return isValid.valid;
  },
  getData: () => {
    return accountDetailsStore.data;
  },
  showValidationErrors: async () => {
    // Force validation to run and show all errors
    validationTriggered.value = true;
    await validate();
    
    // Show validation errors in the store
    accountDetailsStore.showValidationErrors();
    
    // If there are specific UI updates needed to highlight errors, do them here
    const errorElements = document.querySelectorAll('.error-message');
    if (errorElements.length > 0) {
      errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});
</script>

<style scoped>
@import '../assets/styles/form.css';
</style>