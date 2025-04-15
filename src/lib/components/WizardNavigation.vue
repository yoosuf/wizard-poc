<template>
  <div 
    class="wizard-navigation" 
    :class="{ 'wizard-navigation--vertical': vertical }"
    role="navigation"
    aria-label="Wizard steps"
  >
    <div class="wizard-navigation__list" role="tablist">
      <button
        v-for="(step, index) in steps"
        :key="step.id"
        class="wizard-navigation__button"
        :class="{
          'wizard-navigation__button--active': index === currentStepIndex,
          'wizard-navigation__button--completed': index < currentStepIndex,
          'wizard-navigation__button--error': hasErrors && index === currentStepIndex
        }"
        @click="onStepClick(index)"
        role="tab"
        :id="`tab-${step.id}`"
        :aria-selected="index === currentStepIndex"
        :aria-controls="`panel-${step.id}`"
        :aria-label="step.title"
        :tabindex="index === currentStepIndex ? 0 : -1"
      >
        <span class="wizard-navigation__step-count">{{ index + 1 }}</span>
        <span class="wizard-navigation__title">{{ step.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// Define the Step interface
interface WizardStep {
  id: string;
  title: string;
  componentName?: string;
  component?: any;
  props?: Record<string, any>;
  optional?: boolean;
}

defineProps({
  steps: {
    type: Array as () => WizardStep[],
    required: true
  },
  currentStepIndex: {
    type: Number,
    required: true
  },
  hasErrors: {
    type: Boolean,
    default: false
  },
  vertical: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['step-click']);

const onStepClick = (index: number) => {
  emit('step-click', index);
};
</script>

<style scoped>
.wizard-navigation {
  flex-shrink: 0;
  width: 100%;
}

.wizard-navigation--vertical {
  width: 250px;
  min-width: 200px;
  max-width: 300px;
  border-right: 1px solid var(--wizard-border-color, #e5e7eb);
  padding-right: 1.5rem;
}

.wizard-navigation__list {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}

.wizard-navigation--vertical .wizard-navigation__list {
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.wizard-navigation__button {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 0.375rem;
}

.wizard-navigation__button:hover {
  background-color: var(--wizard-hover-bg, #f3f4f6);
}

.wizard-navigation__button--active {
  font-weight: 600;
  background-color: rgba(66, 184, 131, 0.1);
  border-color: var(--wizard-primary-color, #42b883);
  box-shadow: 0 0 0 1px var(--wizard-primary-color, #42b883);
}

.wizard-navigation__button--completed {
  color: var(--wizard-secondary-color, #6b7280);
  background-color: rgba(66, 184, 131, 0.05);
  border-color: rgba(66, 184, 131, 0.2);
}

.wizard-navigation__button--error {
  color: #ef4444;
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.wizard-navigation__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wizard-navigation__step-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--wizard-step-count-color, #6b7280);
  background-color: var(--wizard-step-count-bg, #f3f4f6);
  border-radius: 50%;
  margin-right: 0.5rem;
}

.wizard-navigation__button--active .wizard-navigation__step-count {
  color: var(--wizard-active-step-count-color, #111827);
  background-color: var(--wizard-active-step-count-bg, #e5e7eb);
}

@media (max-width: 768px) {
  .wizard-navigation--vertical {
    width: 100%;
    max-width: none;
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid var(--wizard-border-color, #e5e7eb);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
  
  .wizard-navigation--vertical .wizard-navigation__list {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
