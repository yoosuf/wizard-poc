<template>
  <form @submit.prevent="onSubmit" class="step-form">
    <div class="form-group">
      <label for="linkedin">LinkedIn</label>
      <input 
        id="linkedin" 
        name="linkedin"
        :value="values.linkedin"
        @input="handleInput($event, 'linkedin')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.linkedin }"
        placeholder="https://linkedin.com/in/username"
      />
      <div v-if="validationTriggered && errors.linkedin" class="error-message">
        {{ errors.linkedin }}
      </div>
    </div>

    <div class="form-group">
      <label for="twitter">Twitter</label>
      <input 
        id="twitter" 
        name="twitter"
        :value="values.twitter"
        @input="handleInput($event, 'twitter')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.twitter }"
        placeholder="https://twitter.com/username"
      />
      <div v-if="validationTriggered && errors.twitter" class="error-message">
        {{ errors.twitter }}
      </div>
    </div>

    <div class="form-group">
      <label for="github">GitHub</label>
      <input 
        id="github" 
        name="github"
        :value="values.github"
        @input="handleInput($event, 'github')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.github }"
        placeholder="https://github.com/username"
      />
      <div v-if="validationTriggered && errors.github" class="error-message">
        {{ errors.github }}
      </div>
    </div>
    
    <div class="form-group">
      <label for="website">Website</label>
      <input 
        id="website" 
        name="website"
        :value="values.website"
        @input="handleInput($event, 'website')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.website }"
        placeholder="https://yourwebsite.com"
      />
      <div v-if="validationTriggered && errors.website" class="error-message">
        {{ errors.website }}
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { SocialLinksData } from '../types/steps';
import { useSocialLinksStore } from '../stores/socialLinksStore';
import { storeToRefs } from 'pinia';

// Get the Pinia store
const socialLinksStore = useSocialLinksStore();

// Use storeToRefs to extract reactive properties from the store
// This preserves reactivity, unlike destructuring
const { data, validationTriggered } = storeToRefs(socialLinksStore);

// Define validation schema with yup
const validationSchema = yup.object({
  linkedin: yup.string()
    .nullable()
    .transform(value => value === '' ? null : value)
    .matches(
      /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
      'Please enter a valid LinkedIn URL'
    ),
  twitter: yup.string()
    .nullable()
    .transform(value => value === '' ? null : value)
    .matches(
      /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_-]+\/?$/,
      'Please enter a valid Twitter URL'
    ),
  github: yup.string()
    .nullable()
    .transform(value => value === '' ? null : value)
    .matches(
      /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
      'Please enter a valid GitHub URL'
    ),
  website: yup.string()
    .nullable()
    .transform(value => value === '' ? null : value)
    .url('Please enter a valid website URL')
});

// Get initial form data from the store or use defaults
const initialFormData = computed(() => {
  // If we have data in the store, use it
  if (data.value && Object.keys(data.value).length > 0) {
    return {
      linkedin: data.value.linkedin || '',
      twitter: data.value.twitter || '',
      github: data.value.github || '',
      website: data.value.website || ''
    };
  }
  
  // Otherwise use empty defaults
  return {
    linkedin: '',
    twitter: '',
    github: '',
    website: ''
  };
});

// Use vee-validate form with yup schema
const { handleSubmit, resetForm, validate, values, errors, setFieldValue } = useForm<SocialLinksData>({
  validationSchema,
  initialValues: {
    linkedin: initialFormData.value.linkedin || '',
    twitter: initialFormData.value.twitter || '',
    github: initialFormData.value.github || '',
    website: initialFormData.value.website || ''
  },
  validateOnMount: false  // Prevent validation on mount
});

// Sync form with store data when store data changes
watch(() => data.value, (newData) => {
  if (newData) {
    // Reset the form with new values from the store
    resetForm({
      values: {
        linkedin: data.value.linkedin || '',
        twitter: data.value.twitter || '',
        github: data.value.github || '',
        website: data.value.website || ''
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
  const { linkedin, twitter, github, website } = formValues as SocialLinksData;
  socialLinksStore.setData({ linkedin, twitter, github, website });
  
  // Update the store's validation state
  socialLinksStore.setValidationState(isValid.valid, Object.values(errors.value));
  
  return isValid.valid;
});

// Handle input changes
const handleInput = (event: Event, fieldName: keyof SocialLinksData) => {
  const target = event.target as HTMLInputElement;
  setFieldValue(fieldName, target.value);
  
  // Update data in the store as the user types
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    socialLinksStore.setData({ [fieldName]: target.value });
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
        socialLinksStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }
};

// Initialize the component
onMounted(async () => {
  console.log('[SocialLinksStep] Mounted, store data:', data.value);
  
  // If we have data in the store, use it to reset the form
  if (data.value && Object.keys(data.value).length > 0) {
    resetForm({
      values: {
        linkedin: data.value.linkedin || '',
        twitter: data.value.twitter || '',
        github: data.value.github || '',
        website: data.value.website || ''
      }
    });
  }
  
  // Validate silently without showing errors or triggering validation UI
  const isValid = await validate();
  
  // Set initial data in the store if not already set
  if (!data.value || Object.keys(data.value).length === 0) {
    const { linkedin, twitter, github, website } = values as SocialLinksData;
    socialLinksStore.setData({ linkedin, twitter, github, website });
  }
  
  // Update validation in the store without triggering the UI
  socialLinksStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  // Ensure validation is not triggered on initial load
  validationTriggered.value = false;
  
  console.log(`[SocialLinksStep] Initial validation: isValid=${isValid.valid}, errors=`, Object.values(errors.value));
});

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    // When wizard calls validate, trigger error display
    validationTriggered.value = true;
    const isValid = await validate();
    
    // Update data in the store
    socialLinksStore.setData(values);
    
    // Update the store's validation state
    socialLinksStore.setValidationState(isValid.valid, Object.values(errors.value));
    
    console.log(`[SocialLinksStep] validate() called, isValid: ${isValid.valid}, errors:`, errors.value);
    
    return isValid.valid;
  },
  getData: () => {
    return socialLinksStore.data;
  },
  showValidationErrors: async () => {
    // Force validation to run and show all errors
    validationTriggered.value = true;
    await validate();
    
    // Show validation errors in the store
    socialLinksStore.showValidationErrors();
    
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
