<template>
  <div 
    class="wizard" 
    :class="{ 'wizard--vertical': vertical }"
    role="region"
    aria-label="Multi-step form wizard"
  >
    <!-- Header Section -->
    <WizardHeader
      :title="title"
      :subtitle="subtitle"
      :current-step="currentStepIndex"
      :total-steps="steps.length"
    />

    <!-- Main Content Section -->
    <div class="wizard__main">
      <!-- Navigation Section -->
      <WizardNavigation
        :steps="steps"
        :current-step-index="currentStepIndex"
        :has-errors="currentValidationErrors.length > 0"
        :vertical="vertical"
        @step-click="goToStep"
      />

      <!-- Content Section -->
      <WizardContent
        v-if="steps.length > 0 && currentStepIndex < steps.length"
        :step-id="steps[currentStepIndex].id"
      >
        <component
          :is="steps[currentStepIndex].component"
          :key="steps[currentStepIndex].id"
          ref="currentStepRef"
          v-bind="steps[currentStepIndex].props || {}"
        />
      </WizardContent>
    </div>

    <!-- Footer Section -->
    <WizardFooter
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
      :current-step="currentStepIndex"
      :total-steps="steps.length"
      @previous="goToPrevStep"
      @next="goToNextStep"
      @complete="handleComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, onMounted, useSlots, watch, markRaw, onUnmounted } from 'vue';
import { WizardContextKey, createWizardContext } from '../composables/useWizardContext';
import type { StepRef, CompleteEvent, StepCompleteEvent, StepChangeEvent } from '../types/wizard';

// Import atomic components
import WizardHeader from './WizardHeader.vue';
import WizardNavigation from './WizardNavigation.vue';
import WizardContent from './WizardContent.vue';
import WizardFooter from './WizardFooter.vue';

// Define the Step interface
interface WizardStep {
  id: string;
  title: string;
  componentName: string;
  component?: any;
  props?: Record<string, any>;
  optional?: boolean;
}

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  vertical: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'step-change', event: StepChangeEvent): void;
  (e: 'complete', event: CompleteEvent): void;
  (e: 'step-complete', event: StepCompleteEvent): void;
}>();

// Get slots to extract step components
const slots = useSlots();
const defaultSlot = computed(() => {
  return slots.default ? slots.default() : [];
});

// Current step state
const currentStepIndex = ref<number>(0);
const currentStepRef = ref<StepRef | null>(null);
const currentValidationErrors = ref<string[]>([]);

// Create steps array
const steps = ref<WizardStep[]>([]);

// Process slots to extract step components and their titles
function processSlots() {
  // Check for existing steps to prevent duplicates
  const existingStepIds = steps.value.map(step => step.id);
  console.log('[Wizard] Existing step IDs:', existingStepIds);
  
  if (!defaultSlot.value || defaultSlot.value.length === 0) {
    console.warn('[Wizard] No slots found');
    return;
  }
  
  const processedSteps = defaultSlot.value
    .filter(slot => slot.type && typeof slot.type !== 'symbol') // Filter out non-component slots
    .map((slot, index) => {
      // Extract the component name or use a fallback
      const componentName = typeof slot.type === 'string' 
        ? slot.type 
        : (slot.type as any)?.name || `Step${index + 1}`;
      
      // Use provided id or generate one from the component name
      const id = slot.props?.id || `${componentName.toLowerCase().replace(/[^a-z0-9-]/g, '')}-${index}`;
      
      // Check if this step already exists
      const existingStepIndex = steps.value.findIndex(step => step.id === id);
      if (existingStepIndex !== -1) {
        // If the step already exists, use its existing data and just update the component
        const existingStep = steps.value[existingStepIndex];
        console.log(`[Wizard] Step already exists: ${id}, reusing existing data`);
        
        return {
          ...existingStep,
          component: typeof slot.type === 'object' ? markRaw(slot.type) : slot.type,
          props: slot.props ? {...slot.props} : {}
        };
      }
      
      // For new steps, determine the title
      let title = '';
      
      // Highest priority: Check for exposed stepTitle from useWizardStep
      if (slot.component?.exposed && 'stepTitle' in (slot.component.exposed as Record<string, any>)) {
        const exposedTitle = (slot.component.exposed as Record<string, any>).stepTitle;
        // Handle both direct string values and computed refs
        title = typeof exposedTitle === 'object' && 'value' in exposedTitle ? exposedTitle.value : exposedTitle;
        console.log(`[Wizard] Using exposed stepTitle for ${id}:`, title);
      }
      // Next priority: Check for stepTitle property on component type (set by useWizardStep)
      else if (typeof slot.type === 'object' && (slot.type as any).stepTitle) {
        const typeTitle = (slot.type as any).stepTitle;
        // Handle both direct string values and computed refs
        title = typeof typeTitle === 'object' && 'value' in typeTitle ? typeTitle.value : typeTitle;
        console.log(`[Wizard] Using component type stepTitle for ${id}:`, title);
      }
      // Next priority: Check for title in props
      else if (slot.props?.title) {
        title = slot.props.title;
        console.log(`[Wizard] Using props title for ${id}:`, title);
      }
      // Next priority: Check for __name property
      else if (typeof slot.type === 'object' && (slot.type as any).__name) {
        title = (slot.type as any).__name;
        console.log(`[Wizard] Using __name for ${id}:`, title);
      } 
      // Last resort: Format the component name
      else {
        // Format component name to be more readable (e.g., "PersonalInfoStep" -> "Personal Info")
        title = componentName
          .replace(/Step$/, '') // Remove trailing "Step" if present
          .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
          .trim(); // Remove any leading/trailing spaces
        console.log(`[Wizard] Using formatted component name for ${id}:`, title);
      }
      
      // Handle component type properly - only use markRaw for objects
      const component = typeof slot.type === 'object' ? markRaw(slot.type) : slot.type;
      
      console.log(`[Wizard] Processing new step ${index}:`, { id, title, componentName });
      
      return {
        id,
        title,
        componentName,
        component,
        // Use markRaw for props as well if they contain complex objects
        props: slot.props ? {...slot.props} : {}
      };
    });
  
  // Merge steps rather than replacing to preserve any steps registered by useWizardStep
  // but only if steps array is empty (first initialization)
  if (steps.value.length === 0) {
    steps.value = processedSteps;
  } else {
    // Update existing steps with new component data but preserve titles
    processedSteps.forEach(processedStep => {
      const existingIndex = steps.value.findIndex(step => step.id === processedStep.id);
      if (existingIndex !== -1) {
        // Update component and props but preserve title if it exists
        const existingStep = steps.value[existingIndex];
        steps.value[existingIndex] = {
          ...processedStep,
          title: existingStep.title || processedStep.title
        };
      } else {
        // Add new step
        steps.value.push(processedStep);
      }
    });
  }
  
  // Log for debugging
  console.log('[Wizard] Steps after processing:', steps.value);
}

// Watch for slot changes and process them
watch(defaultSlot, () => {
  processSlots();
}, { immediate: true });

// Create wizard context and provide it
const wizardContext = createWizardContext({
  steps,
  currentStepIndex,
  currentStepRef
});

// Provide the context to child components
provide(WizardContextKey, wizardContext);

// Navigation state
const isFirstStep = computed(() => currentStepIndex.value === 0);
const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1);

// Navigation methods
async function goToStep(index: number) {
  if (index < 0 || index >= steps.value.length) {
    console.warn(`[Wizard] Invalid step index: ${index}`);
    return false;
  }
  
  // If trying to navigate away from current step, validate it first
  if (index !== currentStepIndex.value) {
    const isValid = await validateCurrentStep();
    
    if (!isValid && index > currentStepIndex.value) {
      console.warn('[Wizard] Cannot navigate forward - current step is invalid');
      return false;
    }
  }
  
  // If navigating to a different step, emit step change event
  if (index !== currentStepIndex.value) {
    const fromIndex = currentStepIndex.value;
    const toIndex = index;
    const fromId = steps.value[fromIndex]?.id || '';
    const toId = steps.value[toIndex]?.id || '';
    
    // Update current step index
    currentStepIndex.value = index;
    
    // Emit step change event
    emit('step-change', {
      fromStepIndex: fromIndex,
      toStepIndex: toIndex,
      fromStepId: fromId,
      toStepId: toId
    });
    
    return true;
  }
  
  return true;
}

async function goToNextStep() {
  // Validate current step before proceeding
  const isValid = await validateCurrentStep();
  
  // Add debugging to understand validation result
  console.log(`[Wizard] goToNextStep validation result: isValid=${isValid}`);
  console.log(`[Wizard] Current step: ${currentStepIndex.value}, Step ID: ${steps.value[currentStepIndex.value]?.id}`);
  
  if (!isValid) {
    console.warn('[Wizard] Cannot proceed - current step is invalid');
    
    // Trigger validation errors display on fields
    if (currentStepRef.value && typeof currentStepRef.value.showValidationErrors === 'function') {
      currentStepRef.value.showValidationErrors();
    } else if (currentStepRef.value && typeof currentStepRef.value.validate === 'function') {
      // Fallback: re-validate to ensure errors are displayed
      await currentStepRef.value.validate();
    }
    
    return false;
  }
  
  // If this is the last step, handle completion
  if (isLastStep.value) {
    return handleComplete();
  }
  
  // Get data from current step
  const currentStepData = await getCurrentStepData();
  
  // Emit step complete event
  if (currentStepData) {
    emit('step-complete', {
      stepIndex: currentStepIndex.value,
      stepId: steps.value[currentStepIndex.value]?.id,
      data: currentStepData
    });
  }
  
  // Navigate to next step
  return goToStep(currentStepIndex.value + 1);
}

function goToPrevStep() {
  return goToStep(currentStepIndex.value - 1);
}

// Handle form completion
async function handleComplete() {
  // Validate current step before completing
  const isValid = await validateCurrentStep();
  
  if (!isValid) {
    console.warn('[Wizard] Cannot complete - current step is invalid');
    return false;
  }
  
  // Get data from current step
  const currentStepData = await getCurrentStepData();
  
  // Emit step complete event for the last step
  if (currentStepData) {
    emit('step-complete', {
      stepIndex: currentStepIndex.value,
      stepId: steps.value[currentStepIndex.value]?.id,
      data: currentStepData
    });
  }
  
  // Get all data from all steps
  const allData = wizardContext.getFlattenedData();
  
  // Emit complete event
  emit('complete', {
    data: allData
  });
  
  return true;
}

// Validate current step before navigation
async function validateCurrentStep() {
  // If no current step, return true
  if (!steps.value[currentStepIndex.value]) {
    return true;
  }
  
  // Get step ID
  const stepId = steps.value[currentStepIndex.value].id;
  
  // Clear current validation errors
  currentValidationErrors.value = [];
  
  // Add debugging to understand validation process
  console.log(`[Wizard] Validating step: ${stepId}`);
  console.log(`[Wizard] Current step ref:`, currentStepRef.value);
  
  // Check if the step has a validate method
  if (currentStepRef.value && typeof currentStepRef.value.validate === 'function') {
    console.log(`[Wizard] Step has validate method, calling it directly`);
    // Call the step's validate method directly
    const stepValid = await currentStepRef.value.validate();
    console.log(`[Wizard] Step validate method returned: ${stepValid}`);
    return stepValid;
  }
  
  // Validate step using wizard context
  console.log(`[Wizard] Using context validateStep`);
  const isValid = await wizardContext.validateStep(stepId);
  console.log(`[Wizard] Context validateStep returned: ${isValid}`);
  
  // If not valid, get validation errors
  if (!isValid) {
    currentValidationErrors.value = wizardContext.validationErrors.value[stepId] || [];
    console.log(`[Wizard] Validation errors:`, currentValidationErrors.value);
  }
  
  return isValid;
}

// Get data from current step
async function getCurrentStepData() {
  // If no current step component, return null
  if (!currentStepRef.value) {
    return null;
  }
  
  // If component has getData method, call it
  if (typeof currentStepRef.value.getData === 'function') {
    return currentStepRef.value.getData();
  }
  
  // Otherwise, return null
  return null;
}

// Setup theme variables and keyboard navigation
onMounted(() => {
  // Process slots on mount
  processSlots();
  
  const style = document.documentElement.style;
  style.setProperty('--wizard-primary-color', '#42b883');
  style.setProperty('--wizard-secondary-color', '#6b7280');
  style.setProperty('--wizard-text-color', '#374151');
  style.setProperty('--wizard-border-color', '#e5e7eb');
  style.setProperty('--wizard-background-color', '#ffffff');
  style.setProperty('--wizard-vertical-width', '250px');
  style.setProperty('--wizard-vertical-gap', '2rem');
  
  // Setup keyboard navigation
  setupKeyboardNavigation();
  
  // Log props for debugging purposes
  console.log('Wizard props:', {
    vertical: props.vertical,
    title: props.title,
    subtitle: props.subtitle
  });
});

// Keyboard navigation for accessibility
function setupKeyboardNavigation() {
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown);
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
  
  function handleKeyDown(event: KeyboardEvent) {
    // Only handle keyboard navigation when wizard has focus
    const activeElement = document.activeElement;
    const wizardElement = document.querySelector('.wizard');
    
    if (!wizardElement || !wizardElement.contains(activeElement)) {
      return;
    }
    
    // Handle arrow keys
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        // Navigate to next step
        if (!isLastStep.value) {
          event.preventDefault();
          goToNextStep();
        }
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        // Navigate to previous step
        if (!isFirstStep.value) {
          event.preventDefault();
          goToPrevStep();
        }
        break;
    }
  }
}

// Expose methods to template
defineExpose({
  goToStep,
  goToNextStep,
  goToPrevStep,
  handleComplete
});
</script>

<style scoped>
.wizard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background-color: var(--wizard-background-color);
  color: var(--wizard-text-color);
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.wizard__main {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.wizard--vertical .wizard__main {
  flex-direction: row;
  gap: 2rem;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .wizard--vertical .wizard__main {
    flex-direction: column;
  }
}
</style>
