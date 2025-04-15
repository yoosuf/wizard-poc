<template>
  <div class="wizard-footer">
    <button
      v-if="!isFirstStep"
      class="wizard-footer__button wizard-footer__button--secondary"
      @click="onPrevious"
      aria-label="Go to previous step"
    >
      Previous
    </button>
    <div 
      class="wizard-footer__progress" 
      v-if="totalSteps"
      aria-live="polite"
      aria-atomic="true"
    >
      Step {{ currentStep + 1 }} of {{ totalSteps }}
    </div>
    <button
      v-if="!isLastStep"
      class="wizard-footer__button wizard-footer__button--primary"
      @click="onNext"
      aria-label="Go to next step"
    >
      Next
    </button>
    <button
      v-else
      class="wizard-footer__button wizard-footer__button--primary"
      @click="onComplete"
      aria-label="Complete form"
    >
      Complete
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps({
  isFirstStep: {
    type: Boolean,
    required: true
  },
  isLastStep: {
    type: Boolean,
    required: true
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

const emit = defineEmits(['previous', 'next', 'complete']);

const onPrevious = () => emit('previous');
const onNext = () => emit('next');
const onComplete = () => emit('complete');
</script>

<style scoped>
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--wizard-border-color, #e5e7eb);
  width: 100%;
}

.wizard-footer__progress {
  font-size: 0.875rem;
  color: var(--wizard-secondary-color, #6b7280);
  font-weight: 500;
  display: none;
}

.wizard-footer__button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wizard-footer__button:focus {
  outline: 2px solid var(--wizard-primary-color, #42b883);
  outline-offset: 2px;
}

.wizard-footer__button:focus:not(:focus-visible) {
  outline: none;
}

.wizard-footer__button--primary {
  background-color: var(--wizard-primary-color, #42b883);
  color: white;
}

.wizard-footer__button--primary:hover {
  opacity: 0.9;
}

.wizard-footer__button--secondary {
  background-color: var(--wizard-border-color, #e5e7eb);
  color: var(--wizard-text-color, #374151);
}

.wizard-footer__button--secondary:hover {
  background-color: var(--wizard-secondary-color, #6b7280);
  color: white;
}

@media (max-width: 768px) {
  .wizard-footer__progress {
    display: block;
  }
  
  .wizard-footer {
    flex-wrap: wrap;
    gap: 1rem;
  }
}

@media (forced-colors: active) {
  .wizard-footer__button--primary {
    forced-color-adjust: none;
  }
}
</style>
