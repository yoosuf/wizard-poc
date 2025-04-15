<template>
  <div class="summary-step">
    <h3>Registration Summary</h3>
    
    <!-- Debug section to help troubleshoot -->
    <div v-if="Object.keys(debugData).length === 0" class="debug-info">
      <p class="warning">No data available from previous steps. Please complete the previous steps first.</p>
    </div>
    
    <div class="summary-content">
      <!-- Personal Information Section -->
      <div v-if="data.personalInfo && Object.keys(data.personalInfo).length > 0" class="summary-section">
        <h4>Personal Information</h4>
        <div class="summary-item">
          <span class="label">First Name:</span>
          <span class="value">{{ data.personalInfo.firstName || 'Not provided' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Last Name:</span>
          <span class="value">{{ data.personalInfo.lastName || 'Not provided' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Email:</span>
          <span class="value">{{ data.personalInfo.email || 'Not provided' }}</span>
        </div>
        <div v-if="data.personalInfo.phone" class="summary-item">
          <span class="label">Phone:</span>
          <span class="value">{{ data.personalInfo.phone }}</span>
        </div>
      </div>

      <!-- Account Details Section -->
      <div v-if="data.accountDetails && Object.keys(data.accountDetails).length > 0" class="summary-section">
        <h4>Account Details</h4>
        <div class="summary-item">
          <span class="label">Username:</span>
          <span class="value">{{ data.accountDetails.username || 'Not provided' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Password:</span>
          <span class="value">•••••••••</span>
        </div>
      </div>

      <!-- Profile Picture Section -->
      <div v-if="data.profilePicture && data.profilePicture.imageUrl" class="summary-section">
        <h4>Profile Picture</h4>
        <div class="profile-preview">
          <img :src="data.profilePicture.imageUrl" :alt="data.profilePicture.altText || 'Profile Picture'" />
        </div>
        <div v-if="data.profilePicture.altText" class="summary-item">
          <span class="label">Alt Text:</span>
          <span class="value">{{ data.profilePicture.altText }}</span>
        </div>
      </div>

      <!-- Preferences Section -->
      <div v-if="data.preferences && Object.keys(data.preferences).length > 0" class="summary-section">
        <h4>Preferences</h4>
        <div class="summary-item">
          <span class="label">Theme:</span>
          <span class="value theme-value">
            <span :class="['theme-indicator', data.preferences.theme]"></span>
            {{ formatThemeName(data.preferences.theme) || 'Default' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="label">Notifications:</span>
          <span class="value">
            <ul v-if="data.preferences.notifications" class="notification-list">
              <li v-if="data.preferences.notifications.email" class="notification-item">
                <span class="notification-icon">📧</span> Email Notifications
              </li>
              <li v-if="data.preferences.notifications.push" class="notification-item">
                <span class="notification-icon">🔔</span> Push Notifications
              </li>
              <li v-if="data.preferences.notifications.sms" class="notification-item">
                <span class="notification-icon">📱</span> SMS Notifications
              </li>
            </ul>
            <span v-else>None selected</span>
          </span>
        </div>
      </div>

      <!-- Social Links Section -->
      <div v-if="data.socialLinks && Object.keys(data.socialLinks).length > 0" class="summary-section">
        <h4>Social Links</h4>
        <div v-if="data.socialLinks.linkedin" class="summary-item">
          <span class="label">LinkedIn:</span>
          <span class="value">
            <a :href="formatUrl(data.socialLinks.linkedin)" target="_blank" class="social-link">
              {{ data.socialLinks.linkedin }}
            </a>
          </span>
        </div>
        <div v-if="data.socialLinks.twitter" class="summary-item">
          <span class="label">Twitter:</span>
          <span class="value">
            <a :href="formatUrl(data.socialLinks.twitter)" target="_blank" class="social-link">
              {{ data.socialLinks.twitter }}
            </a>
          </span>
        </div>
        <div v-if="data.socialLinks.github" class="summary-item">
          <span class="label">GitHub:</span>
          <span class="value">
            <a :href="formatUrl(data.socialLinks.github)" target="_blank" class="social-link">
              {{ data.socialLinks.github }}
            </a>
          </span>
        </div>
        <div v-if="data.socialLinks.website" class="summary-item">
          <span class="label">Website:</span>
          <span class="value">
            <a :href="formatUrl(data.socialLinks.website)" target="_blank" class="social-link">
              {{ data.socialLinks.website }}
            </a>
          </span>
        </div>
        <div v-if="!data.socialLinks.linkedin && !data.socialLinks.twitter && !data.socialLinks.github && !data.socialLinks.website" class="summary-item">
          <span class="value">No social links provided</span>
        </div>
      </div>
      
      <!-- Terms and Conditions Section -->
      <div class="summary-section">
        <h4>Terms and Conditions</h4>
        <div class="summary-item checkbox-item">
          <input 
            type="checkbox" 
            id="termsAccepted" 
            v-model="storeData.termsAccepted"
            @change="handleTermsChange"
          />
          <label for="termsAccepted">I accept the terms and conditions</label>
        </div>
        <div v-if="validationTriggered && !storeData.termsAccepted" class="error-message">
          You must accept the terms and conditions to proceed
        </div>
      </div>
      
      <!-- Show a message if no data is available -->
      <div v-if="!Object.values(data).some(section => section && Object.keys(section).length > 0)" class="empty-state">
        <p>No data available. Please complete the previous steps first.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useWizardStore } from '../stores/wizardStore';
import { useSummaryStore } from '../stores/summaryStore';
import { storeToRefs } from 'pinia';

// Get the wizard store to access all step data
const wizardStore = useWizardStore();

// Get the summary store
const summaryStore = useSummaryStore();
const { data: storeData, validationTriggered } = storeToRefs(summaryStore);

// Debug data to help troubleshoot
const debugData = ref({});
onMounted(() => {
  // Get all step data for debugging
  const stepsData = {
    'personal-info': wizardStore.getStepData('personal-info'),
    'account-details': wizardStore.getStepData('account-details'),
    'profile-picture': wizardStore.getStepData('profile-picture'),
    'preferences': wizardStore.getStepData('preferences'),
    'social-links': wizardStore.getStepData('social-links')
  };
  
  console.log('[SummaryStep] All steps data:', stepsData);
  console.log('[SummaryStep] Registered steps:', wizardStore.steps);
  debugData.value = stepsData;
  
  // Initialize the summary store
  summaryStore.validate();
});

// Handle terms and conditions checkbox change
const handleTermsChange = () => {
  summaryStore.setData({ termsAccepted: storeData.value.termsAccepted });
  summaryStore.validate();
};

// Organize data by step
const data = computed(() => {
  return {
    personalInfo: wizardStore.getStepData('personal-info'),
    accountDetails: wizardStore.getStepData('account-details'),
    profilePicture: wizardStore.getStepData('profile-picture'),
    preferences: wizardStore.getStepData('preferences'),
    socialLinks: wizardStore.getStepData('social-links')
  };
});

// Format theme name for display
const formatThemeName = (theme: string): string => {
  if (!theme) return 'Default';
  
  const themeMap: Record<string, string> = {
    'light': 'Light Mode',
    'dark': 'Dark Mode',
    'system': 'System Default'
  };
  
  return themeMap[theme] || theme;
};

// Format URL to ensure it has http/https prefix
const formatUrl = (url: string): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Expose methods for the wizard
defineExpose({
  validate: async () => {
    validationTriggered.value = true;
    const result = await summaryStore.validate();
    return result;
  },
  getData: () => {
    return summaryStore.data;
  },
  showValidationErrors: async () => {
    validationTriggered.value = true;
    await summaryStore.showValidationErrors();
  }
});
</script>

<style scoped>
.summary-step {
  max-width: 800px;
  margin: 0 auto;
}

h3 {
  margin-bottom: 1.5rem;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

h4 {
  margin-bottom: 1rem;
  color: #42b883;
  font-size: 1.25rem;
  font-weight: 500;
  border-bottom: 2px solid #42b883;
  padding-bottom: 0.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-section {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-item {
  display: flex;
  margin-bottom: 0.75rem;
  align-items: flex-start;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #6b7280;
  width: 150px;
  flex-shrink: 0;
}

.value {
  flex-grow: 1;
  color: #111827;
}

.profile-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.profile-preview img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #42b883;
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notification-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.notification-icon {
  margin-right: 0.5rem;
}

.theme-value {
  display: flex;
  align-items: center;
}

.theme-indicator {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.theme-indicator.light {
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
}

.theme-indicator.dark {
  background-color: #1f2937;
  border: 1px solid #374151;
}

.theme-indicator.system {
  background: linear-gradient(135deg, #f9fafb 50%, #1f2937 50%);
  border: 1px solid #d1d5db;
}

.social-link {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.social-link:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.warning {
  color: #ef4444;
  font-weight: 500;
}

.debug-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #fee2e2;
  border-radius: 0.375rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-item input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #42b883;
  cursor: pointer;
}

.checkbox-item label {
  cursor: pointer;
  font-weight: 500;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 500;
}
</style>