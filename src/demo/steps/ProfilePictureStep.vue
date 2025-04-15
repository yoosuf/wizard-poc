<template>
  <form @submit.prevent="onSubmit" class="step-form">
    <div class="form-group">
      <label for="profilePicture">Profile Picture</label>
      <div class="profile-upload">
        <div 
          class="profile-preview" 
          :style="{ backgroundImage: values.imageUrl ? `url(${values.imageUrl})` : 'none' }"
        >
          <span v-if="!values.imageUrl">No Image</span>
        </div>
        <div class="upload-controls">
          <button 
            type="button" 
            class="upload-button"
            @click="triggerFileInput"
          >
            Upload Image
          </button>
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*" 
            class="file-input" 
            @change="handleFileChange"
          />
          <button 
            v-if="values.imageUrl" 
            type="button" 
            class="remove-button"
            @click="removeImage"
          >
            Remove
          </button>
        </div>
      </div>
      <div v-if="validationTriggered && errors.imageUrl" class="error-message">
        {{ errors.imageUrl }}
      </div>
    </div>
    
    <div v-if="values.imageUrl" class="form-group">
      <label for="altText">Image Description (Alt Text)</label>
      <input 
        id="altText" 
        name="altText"
        :value="values.altText"
        @input="handleInput($event, 'altText')"
        class="form-control"
        :class="{ 'error': validationTriggered && errors.altText }"
        placeholder="Describe your image for accessibility"
      />
      <div v-if="validationTriggered && errors.altText" class="error-message">
        {{ errors.altText }}
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useForm } from 'vee-validate';

import { ProfilePictureData } from '../types/steps';
import { useProfilePictureStore } from '../stores/profilePictureStore';
import { storeToRefs } from 'pinia';

// Get the Pinia store
const profilePictureStore = useProfilePictureStore();

// Use storeToRefs to extract reactive properties from the store
// This preserves reactivity, unlike destructuring
const { data, validationTriggered } = storeToRefs(profilePictureStore);

// Import validation schema
import { profilePictureSchema } from '../validations/profilePictureValidation';

// Get initial form data from the store or use defaults
const initialFormData = computed(() => {
  // If we have data in the store, use it
  if (data.value && Object.keys(data.value).length > 0) {
    return {
      imageUrl: data.value.imageUrl || '',
      altText: data.value.altText || ''
    };
  }
  
  // Otherwise use empty defaults
  return {
    imageUrl: '',
    altText: ''
  };
});

// Use vee-validate form
const { handleSubmit, errors, values, validate, setFieldValue, resetForm } = useForm<ProfilePictureData>({
  validationSchema: profilePictureSchema,
  initialValues: {
    imageUrl: initialFormData.value.imageUrl,
    altText: initialFormData.value.altText
  },
  validateOnMount: false // Prevent validation on mount
});

const fileInput = ref<HTMLInputElement | null>(null);

// Sync form with store data when store data changes
watch(() => data.value, (newData) => {
  if (newData) {
    // Reset the form with new values from the store
    resetForm({
      values: {
        imageUrl: newData.imageUrl || '',
        altText: newData.altText || ''
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
  const { imageUrl, altText } = formValues as ProfilePictureData;
  profilePictureStore.setData({ imageUrl, altText });
  
  // Validate the store data
  await profilePictureStore.validate();
  
  return isValid.valid;
});

// Handle input changes
const handleInput = (event: Event, fieldName: keyof ProfilePictureData) => {
  const target = event.target as HTMLInputElement;
  setFieldValue(fieldName, target.value);
  
  // Update data in the store as the user types
  // Use a timeout to avoid triggering validation in a tight loop
  setTimeout(() => {
    profilePictureStore.setData({ [fieldName]: target.value });
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
        profilePictureStore.setValidationState(result.valid, Object.values(errors.value));
      }
    });
  }
};

// File handling methods
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    
    // Validate file size before processing
    if (file.size > 5 * 1024 * 1024) { // 5MB
      errors.value.imageUrl = 'Image size should be less than 5MB';
      validationTriggered.value = true;
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errors.value.imageUrl = 'Only image files are allowed';
      validationTriggered.value = true;
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (e.target && typeof e.target.result === 'string') {
        await setFieldValue('imageUrl', e.target.result);
        
        // Set a default alt text based on the file name
        if (!values.altText) {
          const fileName = file.name.split('.')[0];
          const formattedName = fileName
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          await setFieldValue('altText', formattedName);
        }
        
        // Update the store with the new values
        // Use a timeout to avoid triggering validation in a tight loop
        const imageUrl = e.target.result; // Store in a variable to avoid null checks later
        setTimeout(() => {
          if (typeof imageUrl === 'string') {
            profilePictureStore.setData({
              imageUrl: imageUrl,
              altText: values.altText
            });
            
            // Validate the form
            validationTriggered.value = true;
            validate().then((result) => {
              // Update the store's validation state
              profilePictureStore.setValidationState(result.valid, Object.values(errors.value));
            });
          }
        }, 0);
      }
    };
    
    reader.readAsDataURL(file);
  }
};

const removeImage = async () => {
  await setFieldValue('imageUrl', '');
  await setFieldValue('altText', '');
  
  // Update the store
  profilePictureStore.setData({
    imageUrl: '',
    altText: ''
  });
  
  validationTriggered.value = true;
  await validate();
  await profilePictureStore.validate();
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Initialize the component
onMounted(async () => {
  console.log('[ProfilePictureStep] Mounted, store data:', data.value);
  
  // If we have data in the store, use it to reset the form
  if (data.value && Object.keys(data.value).length > 0) {
    resetForm({
      values: {
        imageUrl: data.value.imageUrl || '',
        altText: data.value.altText || ''
      }
    });
  }
  
  // Validate silently without showing errors or triggering validation UI
  const isValid = await validate();
  
  // Set initial data in the store if not already set
  if (!data.value || Object.keys(data.value).length === 0) {
    const { imageUrl, altText } = values as ProfilePictureData;
    profilePictureStore.setData({ imageUrl, altText });
  }
  
  // Update validation in the store without triggering the UI
  profilePictureStore.setValidationState(isValid.valid, 
    Object.values(errors.value)
      .filter((error): error is string => error !== undefined)
  );
  
  // Ensure validation is not triggered on initial load
  validationTriggered.value = false;
  
  console.log(`[ProfilePictureStep] Initial validation: isValid=${isValid.valid}, errors=`, Object.values(errors.value));
});

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    // When wizard calls validate, trigger error display
    validationTriggered.value = true;
    const isValid = await validate();
    
    // Update data in the store
    profilePictureStore.setData(values);
    
    // Update the store's validation state
    profilePictureStore.setValidationState(isValid.valid, Object.values(errors.value));
    
    console.log(`[ProfilePictureStep] validate() called, isValid: ${isValid.valid}, errors:`, errors.value);
    
    return isValid.valid;
  },
  getData: () => {
    return profilePictureStore.data;
  },
  showValidationErrors: async () => {
    // Force validation to run and show all errors
    validationTriggered.value = true;
    await validate();
    
    // Show validation errors in the store
    profilePictureStore.showValidationErrors();
    
    // If there are specific UI updates needed to highlight errors, do them here
    const errorElements = document.querySelectorAll('.error-message');
    if (errorElements.length > 0) {
      errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});
</script>

<style scoped>
.step-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.profile-upload {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.profile-preview {
  width: 150px;
  height: 150px;
  color: white;
  border: none;
}

.remove-button:hover {
  background-color: #dc2626;
}

.file-input {
  display: none;
}
</style>
