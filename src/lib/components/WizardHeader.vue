<template>
  <div class="wizard-header" v-if="title || subtitle">
    <h2 class="wizard-header__title" v-if="title" id="wizard-title">{{ title }}</h2>
    <p class="wizard-header__subtitle" v-if="subtitle" id="wizard-subtitle">{{ subtitle }}</p>
    <div 
      class="wizard-header__progress" 
      v-if="totalSteps"
      aria-live="polite"
      aria-atomic="true"
    >
      Step {{ currentStep + 1 }} of {{ totalSteps }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  currentStep: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  }
});
</script>

<style scoped>
.wizard-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.wizard-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--wizard-primary-color, #42b883);
}

.wizard-header__subtitle {
  font-size: 1rem;
  color: var(--wizard-text-color, #374151);
  margin: 0;
}

.wizard-header__progress {
  font-size: 0.875rem;
  color: var(--wizard-secondary-color, #6b7280);
  font-weight: 500;
  margin-top: 0.5rem;
}
</style>
