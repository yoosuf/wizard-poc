<template>
  <div class="wizard-example">
    <div class="layout-controls">
      <div class="layout-toggle">
        <label class="layout-toggle__label">
          <input 
            type="checkbox" 
            v-model="isVertical"
            class="layout-toggle__input"
          >
          <span class="layout-toggle__text">Vertical Layout</span>
        </label>
      </div>
      
      <div class="controls-right">
        <button @click="resetWizard" class="reset-button">Reset Wizard</button>
      </div>
    </div>

    <Wizard
      :key="wizardKey"
      title="Registration Form"
      subtitle="Please fill in your details to complete the registration"
      :vertical="isVertical"
      @step-change="handleStepChange"
      @complete="handleComplete"
      @step-complete="handleStepComplete"
    >
      <!-- Personal Information Step -->
      <PersonalInfoStep id="personal-info" title="Personal Information"/>

      <!-- Profile Picture Step (Optional) -->
      <ProfilePictureStep id="profile-picture" title="Profile Picture"/>

      <!-- Account Details Step -->
      <AccountDetailsStep id="account-details" title="Account Details" />

      <!-- Social Links Step (Optional) -->
      <SocialLinksStep id="social-links" title="Social Links"/>

      <!-- Preferences Step (Optional) -->
      <PreferencesStep id="preferences" title="Preferences"/>

      <!-- Summary Step -->
      <SummaryStep id="summary" title="Summary" />
    </Wizard>

    <div v-if="wizardCompleted" class="completion-message">
      <h2>Registration Complete!</h2>
      <p>Thank you for registering. Your account has been created successfully.</p>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
      <button @click="resetWizard" class="reset-button">Start Over</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Wizard } from '../lib';
import PersonalInfoStep from './steps/PersonalInfoStep.vue';
import AccountDetailsStep from './steps/AccountDetailsStep.vue';
import PreferencesStep from './steps/PreferencesStep.vue';
import SummaryStep from './steps/SummaryStep.vue';
import SocialLinksStep from './steps/SocialLinksStep.vue';
import ProfilePictureStep from './steps/ProfilePictureStep.vue';
import type { StepChangeEvent, CompleteEvent, StepCompleteEvent } from '../lib/types/wizard';

// Import our Pinia stores
import { 
  useWizardStore,
  usePersonalInfoStore,
  useAccountDetailsStore,
  useProfilePictureStore,
  useSocialLinksStore,
  usePreferencesStore,
  useSummaryStore
} from './stores';

// Initialize stores
const wizardStore = useWizardStore();
const personalInfoStore = usePersonalInfoStore();
const accountDetailsStore = useAccountDetailsStore();
const profilePictureStore = useProfilePictureStore();
const socialLinksStore = useSocialLinksStore();
const preferencesStore = usePreferencesStore();
const summaryStore = useSummaryStore();

// State
const wizardCompleted = ref<boolean>(false);
const formData = ref<Record<string, any>>({});
const isVertical = ref<boolean>(false);
const wizardKey = ref<number>(0);

// Event handlers
const handleStepChange = (event: StepChangeEvent) => {
  console.log('Step changed:', event);
  
  // Update the current step in our wizard store
  wizardStore.goToStepById(event.toStepId);
};

const handleComplete = (event: CompleteEvent) => {
  console.log('Wizard completed:', event);
  
  // Get data from our wizard store instead of the event
  formData.value = wizardStore.getFlattenedData();
  wizardCompleted.value = true;
};

const handleStepComplete = (event: StepCompleteEvent) => {
  console.log('Step completed:', event);
  
  // The step stores automatically update the wizard store,
  // so we can just get the flattened data
  formData.value = wizardStore.getFlattenedData();
};

const resetWizard = () => {
  wizardCompleted.value = false;
  formData.value = {};
  
  // Reset all stores
  wizardStore.reset();
  personalInfoStore.reset();
  accountDetailsStore.reset();
  profilePictureStore.reset();
  socialLinksStore.reset();
  preferencesStore.reset();
  summaryStore.reset();
  
  // Force wizard to re-render
  wizardKey.value++;
};

// Watch for changes in the wizard store's flattened data
watch(() => wizardStore.getFlattenedData(), (newData) => {
  formData.value = newData;
}, { deep: true });

// Initialize the wizard when the component is mounted
onMounted(() => {
  // Register steps in the wizard store if needed
  // (This is already handled by the individual step stores)
  
  // Set up any initial data or state
  console.log('Wizard Example mounted, stores initialized');
});
</script>

<style scoped>
.wizard-example {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.layout-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.layout-toggle {
  display: flex;
  justify-content: flex-end;
}

.layout-toggle__label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.layout-toggle__input {
  margin-right: 0.5rem;
}

.layout-toggle__text {
  font-size: 0.875rem;
  font-weight: 500;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reset-button {
  padding: 0.25rem 0.75rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background-color: #1e2a36;
}

.completion-message {
  margin-top: 2rem;
  padding: 2rem;
  background-color: #f0f9ff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.completion-message button {
  margin-top: 1rem;
}

pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow: auto;
  max-height: 300px;
  width: 100%;
}
</style>