<template>
  <form @submit.prevent="onSubmit" class="step-form">
    <div class="form-group">
      <label for="firstName">First Name</label>
      <input 
        id="firstName" 
        name="firstName"
        :value="values.firstName"
        @input="handleInput($event, 'firstName')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.firstName }"
      />
      <div v-if="validationTriggered && errors.firstName" class="error-message">
        {{ errors.firstName }}
      </div>
    </div>

    <div class="form-group">
      <label for="lastName">Last Name</label>
      <input 
        id="lastName" 
        name="lastName"
        :value="values.lastName"
        @input="handleInput($event, 'lastName')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.lastName }"
      />
      <div v-if="validationTriggered && errors.lastName" class="error-message">
        {{ errors.lastName }}
      </div>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input 
        id="email" 
        name="email"
        type="email" 
        :value="values.email"
        @input="handleInput($event, 'email')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.email }"
      />
      <div v-if="validationTriggered && errors.email" class="error-message">
        {{ errors.email }}
      </div>
    </div>

    <div class="form-group">
      <label for="phone">Phone</label>
      <input 
        id="phone" 
        name="phone"
        :value="values.phone"
        @input="handleInput($event, 'phone')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.phone }"
      />
      <div v-if="validationTriggered && errors.phone" class="error-message">
        {{ errors.phone }}
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { storeToRefs } from 'pinia';
import { usePersonalInfoStore } from '../stores';
import { PersonalInfoData } from '../types/steps';
import { personalInfoSchema } from '../validations';

// Get the Pinia store
const personalInfoStore = usePersonalInfoStore();

// This preserves reactivity, unlike destructuring
const { data, validationTriggered } = storeToRefs(personalInfoStore);

// Define field name types for type safety
type FormFields = keyof PersonalInfoData;

// Get initial form data from the store or use defaults
const initialFormData = computed(() => {
  // If we have data in the store, use it
  if (data.value && Object.keys(data.value).length > 0) {
    return {
      firstName: data.value.firstName || '',
      lastName: data.value.lastName || '',
      email: data.value.email || '',
      phone: data.value.phone || ''
    };
  }
  
  // Otherwise use empty defaults
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };
});

// Initialize the form with validation
const { handleSubmit, resetForm, validate, values, errors, setFieldValue } = useForm<PersonalInfoData>({
  validationSchema: personalInfoSchema,
  initialValues: {
    firstName: initialFormData.value.firstName || '',
    lastName: initialFormData.value.lastName || '',
    email: initialFormData.value.email || '',
    phone: initialFormData.value.phone || ''
  },
  validateOnMount: false  // Prevent validation on mount
});

// Sync form with store data when store data changes
watch(() => data.value, (newData) => {
  if (newData) {
    // Reset the form with new values from the store
    resetForm({
      values: {
        firstName: data.value.firstName || '',
        lastName: data.value.lastName || '',
        email: data.value.email || '',
        phone: data.value.phone || ''
      }
    });
  }
}, { deep: true });

// Form submission handler
const onSubmit = handleSubmit(async (formValues) => {
  // Set validation triggered flag
  validationTriggered.value = true;
  
  // Validate the form
  const isValid = await validate();
  
  // Update the data in the store
  const { firstName, lastName, email, phone } = formValues as PersonalInfoData;
  personalInfoStore.setData({ firstName, lastName, email, phone });
  
  // Update the store's validation state
  personalInfoStore.setValidationState(isValid.valid, Object.values(errors.value));
  
  return isValid.valid;
});

// Handle input changes
const handleInput = (event: Event, fieldName: FormFields) => {
  const target = event.target as HTMLInputElement;
  setFieldValue(fieldName, target.value);
  
  // Update data in the store as the user types
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    personalInfoStore.setData({ [fieldName]: target.value });
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
        personalInfoStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }
};

// Initialize the component
onMounted(async () => {
  console.log('[PersonalInfoStep] Mounted, store data:', data.value);
  
  // If we have data in the store, use it to reset the form
  if (data.value && Object.keys(data.value).length > 0) {
    resetForm({
      values: {
        firstName: data.value.firstName || '',
        lastName: data.value.lastName || '',
        email: data.value.email || '',
        phone: data.value.phone || ''
      }
    });
  }
  
  // Validate silently without showing errors or triggering validation UI
  const isValid = await validate();
  
  // Set initial data in the store if not already set
  if (!data.value || Object.keys(data.value).length === 0) {
    const { firstName, lastName, email, phone } = values as PersonalInfoData;
    personalInfoStore.setData({ firstName, lastName, email, phone });
  }
  
  // Update validation in the store without triggering the UI
  personalInfoStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  // Ensure validation is not triggered on initial load
  validationTriggered.value = false;
  
  console.log(`[PersonalInfoStep] Initial validation: isValid=${isValid.valid}, errors=`, Object.values(errors.value));
});

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    // When wizard calls validate, trigger error display
    validationTriggered.value = true;
    const isValid = await validate();
    
    // Update data in the store
    personalInfoStore.setData(values);
    
    // Update the store's validation state
    personalInfoStore.setValidationState(isValid.valid, Object.values(errors.value));
    
    console.log(`[PersonalInfoStep] validate() called, isValid: ${isValid.valid}, errors:`, errors.value);
    
    return isValid.valid;
  },
  getData: () => {
    return personalInfoStore.data;
  },
  showValidationErrors: async () => {
    // Force validation to run and show all errors
    validationTriggered.value = true;
    await validate();
    
    // Show validation errors in the store
    personalInfoStore.showValidationErrors();
    
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