<template>
  <form @submit.prevent="onSubmit" class="step-form">
    <div class="form-group">
      <label>Theme Preference</label>
      <div class="radio-group" :class="{ 'error-container': validationTriggered && errors.theme }">
        <div class="radio-option">
          <input 
            type="radio" 
            id="light" 
            name="theme"
            value="light" 
            :checked="values.theme === 'light'"
            @change="handleRadioChange($event, 'theme')"
          />
          <label for="light">Light</label>
        </div>
        <div class="radio-option">
          <input 
            type="radio" 
            id="dark" 
            name="theme"
            value="dark" 
            :checked="values.theme === 'dark'"
            @change="handleRadioChange($event, 'theme')"
          />
          <label for="dark">Dark</label>
        </div>
        <div class="radio-option">
          <input 
            type="radio" 
            id="system" 
            name="theme"
            value="system" 
            :checked="values.theme === 'system'"
            @change="handleRadioChange($event, 'theme')"
          />
          <label for="system">System Default</label>
        </div>
      </div>
      <div v-if="validationTriggered && errors.theme" class="error-message">
        {{ errors.theme }}
      </div>
    </div>

    <div class="form-group">
      <label>Notification Preferences</label>
      <div class="checkbox-group">
        <div class="checkbox-option">
          <input 
            type="checkbox" 
            id="emailNotifications" 
            name="email"
            :checked="values.notifications.email"
            @change="handleCheckboxChange($event, 'email')"
          />
          <label for="emailNotifications">Email Notifications</label>
        </div>
        <div class="checkbox-option">
          <input 
            type="checkbox" 
            id="pushNotifications" 
            name="push"
            :checked="values.notifications.push"
            @change="handleCheckboxChange($event, 'push')"
          />
          <label for="pushNotifications">Push Notifications</label>
        </div>
        <div class="checkbox-option">
          <input 
            type="checkbox" 
            id="smsNotifications" 
            name="sms"
            :checked="values.notifications.sms"
            @change="handleCheckboxChange($event, 'sms')"
          />
          <label for="smsNotifications">SMS Notifications</label>
        </div>
      </div>
      <div v-if="validationTriggered && errors['notifications.email']" class="error-message">
        {{ errors['notifications.email'] }}
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { PreferencesData } from '../types/steps';
import { usePreferencesStore } from '../stores/preferencesStore';
import { storeToRefs } from 'pinia';

// Get the Pinia store
const preferencesStore = usePreferencesStore();

// Use storeToRefs to extract reactive properties from the store
// This preserves reactivity, unlike destructuring
const { data, validationTriggered } = storeToRefs(preferencesStore);

// Define validation schema with yup
const validationSchema = yup.object({
  theme: yup.string()
    .required('Please select a theme preference')
    .oneOf(['light', 'dark', 'system'], 'Invalid theme selection'),
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

// Get initial form data from the store or use defaults
const initialFormData = computed(() => {
  // If we have data in the store, use it
  if (data.value && Object.keys(data.value).length > 0) {
    return {
      theme: data.value.theme || 'system',
      notifications: {
        email: data.value.notifications?.email ?? true,
        push: data.value.notifications?.push ?? false,
        sms: data.value.notifications?.sms ?? false
      }
    };
  }
  
  // Otherwise use defaults
  return {
    theme: 'system',
    notifications: {
      email: true,
      push: false,
      sms: false
    }
  };
});

// Use vee-validate form with yup schema
const { handleSubmit, resetForm, validate, values, errors, setFieldValue } = useForm<PreferencesData>({
  validationSchema,
  initialValues: {
    theme: initialFormData.value.theme,
    notifications: initialFormData.value.notifications
  },
  validateOnMount: false  // Prevent validation on mount
});

// Sync form with store data when store data changes
watch(() => data.value, (newData) => {
  if (newData) {
    // Reset the form with new values from the store
    resetForm({
      values: {
        theme: data.value.theme || 'light',
        notifications: {
          email: data.value.notifications?.email ?? true,
          push: data.value.notifications?.push ?? false,
          sms: data.value.notifications?.sms ?? false
        }
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
  const { theme, notifications } = formValues as PreferencesData;
  preferencesStore.setData({ theme, notifications });
  
  // Update the store's validation state
  preferencesStore.setValidationState(isValid.valid, Object.values(errors.value));
  
  return isValid.valid;
});

// Handle radio button changes
const handleRadioChange = (event: Event, fieldName: 'theme') => {
  const target = event.target as HTMLInputElement;
  setFieldValue(fieldName, target.value);
  
  // Update data in the store as the user makes selections
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    if (fieldName === 'theme') {
      preferencesStore.setData({ theme: target.value });
    }
  }, 0);
  
  // Validate after a short delay to prevent excessive validation cycles
  setTimeout(() => {
    validate().then((result) => {
      // If all fields are valid, update the store validation state
      if (Object.keys(errors.value).length === 0) {
        // Clear validation triggered if all fields are valid
        if (validationTriggered.value) {
          validationTriggered.value = false;
        }
        // Update the store's validation state
        preferencesStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }, 100);
};

// Handle checkbox changes
const handleCheckboxChange = (event: Event, notificationType: 'email' | 'push' | 'sms') => {
  const target = event.target as HTMLInputElement;
  const fieldPath = `notifications.${notificationType}` as 'notifications.email' | 'notifications.push' | 'notifications.sms';
  setFieldValue(fieldPath, target.checked);
  
  // Update data in the store as the user makes selections
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    preferencesStore.setData({
      notifications: {
        ...values.notifications,
        [notificationType]: target.checked
      }
    });
  }, 0);
  
  // Validate after a short delay to prevent excessive validation cycles
  setTimeout(() => {
    validate().then((result) => {
      // If all fields are valid, update the store validation state
      if (Object.keys(errors.value).length === 0) {
        // Clear validation triggered if all fields are valid
        if (validationTriggered.value) {
          validationTriggered.value = false;
        }
        // Update the store's validation state
        preferencesStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }, 100);
};

// Initialize the component
onMounted(async () => {
  console.log('[PreferencesStep] Mounted, store data:', data.value);
  
  // If we have data in the store, use it to reset the form
  if (data.value && Object.keys(data.value).length > 0) {
    resetForm({
      values: {
        theme: data.value.theme || 'light',
        notifications: {
          email: data.value.notifications?.email ?? true,
          push: data.value.notifications?.push ?? false,
          sms: data.value.notifications?.sms ?? false
        }
      }
    });
  }
  
  // Validate silently without showing errors or triggering validation UI
  const isValid = await validate();
  
  // Set initial data in the store if not already set
  if (!data.value || Object.keys(data.value).length === 0) {
    const { theme, notifications } = values as PreferencesData;
    preferencesStore.setData({ theme, notifications });
  }
  
  // Update validation in the store without triggering the UI
  preferencesStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  // Ensure validation is not triggered on initial load
  validationTriggered.value = false;
  
  console.log(`[PreferencesStep] Initial validation: isValid=${isValid.valid}, errors=`, Object.values(errors.value));
});

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    // When wizard calls validate, trigger error display
    validationTriggered.value = true;
    const isValid = await validate();
    
    // Update data in the store
    preferencesStore.setData(values);
    
    // Update the store's validation state
    preferencesStore.setValidationState(isValid.valid, Object.values(errors.value));
    
    console.log(`[PreferencesStep] validate() called, isValid: ${isValid.valid}, errors:`, errors.value);
    
    return isValid.valid;
  },
  getData: () => {
    return preferencesStore.data;
  },
  showValidationErrors: async () => {
    // Force validation to run and show all errors
    validationTriggered.value = true;
    await validate();
    
    // Show validation errors in the store
    preferencesStore.showValidationErrors();
    
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

.radio-group, .checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option, .checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio-option label, .checkbox-option label {
  cursor: pointer;
}

input[type="radio"], input[type="checkbox"] {
  cursor: pointer;
}

.error-container {
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 500;
}
</style>