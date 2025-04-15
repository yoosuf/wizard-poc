/**
 * @file useWizardStep.ts
 * @description Provides a composable for creating and managing wizard step components.
 * This module enables step components to interact with the wizard context and
 * handle their own data and validation.
 * 
 * @author Yoosuf Mohamed
 * @version 1.0.0
 * @license MIT
 */

import { computed, onMounted, ref, getCurrentInstance, watch } from 'vue';
import { useWizardContext } from './useWizardContext';

/**
 * Step options interface
 */
export interface StepOptions {
  id: string;
  title: string | (() => string);
  optional?: boolean;
  initialData?: Record<string, any>;
}

/**
 * Enhanced wizard step composable that handles step configuration, validation,
 * and component metadata in one place
 * 
 * This composable provides a unified API for step components to interact with
 * the parent wizard component. It handles step registration, data management,
 * validation, and component metadata.
 * 
 * @example
 * ```ts
 * // In a step component
 * import { useWizardStep } from '../composables/useWizardStep';
 * import { ref, computed } from 'vue';
 * 
 * const props = defineProps<{
 *   stepId: string;
 * }>();
 * 
 * const { updateData, updateStepValidation, isActive, getStepData } = useWizardStep({
 *   id: props.stepId,
 *   title: 'Personal Information',
 *   initialData: { name: '', email: '' }
 * });
 * 
 * const formData = ref({ name: '', email: '' });
 * 
 * const isValid = computed(() => {
 *   return !!formData.value.name && !!formData.value.email;
 * });
 * 
 * // Save data and validate when values change
 * watch(formData, (newData) => {
 *   updateData(newData);
 *   updateStepValidation(isValid.value, isValid.value ? [] : ['Please fill in all fields']);
 * }, { deep: true });
 * ```
 * 
 * @param {StepOptions} options - Configuration options for the step
 * @param {string} options.id - Unique identifier for the step
 * @param {string | (() => string)} options.title - Display title for the step
 * @param {boolean} [options.optional] - Whether the step is optional
 * @param {Record<string, any>} [options.data] - Initial data for the step
 * @param {any} [options.validationSchema] - Validation schema for the step
 * @param {Record<string, any>} [options.initialData] - Initial data to set when the step is mounted
 * @returns {Object} Step methods and state
 */
export function useWizardStep(options: StepOptions) {
  const { steps, currentStepIndex, updateStepData, updateStepValidation: contextUpdateStepValidation, stepsData, registerStep } = useWizardContext();
  const instance = getCurrentInstance();

  // Create a computed property for the title that handles both string and function cases
  const stepTitle = computed(() => {
    if (typeof options.title === 'function') {
      return options.title();
    }
    return options.title;
  });

  /**
   * Register the step with the wizard context
   * This ensures the step title is available to the wizard component
   */
  const stepId = ref(options.id);
  const stepIndex = steps.value.findIndex(step => step.id === options.id);
  
  if (stepIndex === -1) {
    // Step doesn't exist yet, register it
    // This prevents registration during component setup before the Wizard has processed slots
    if (instance && instance.isMounted) {
      console.log(`[useWizardStep] Registering new step: ${options.id}`);
      const registeredId = registerStep({
        id: options.id,
        title: stepTitle.value,
        optional: options.optional || false,
        data: stepsData.value[options.id],
        isValid: false, // Initialize as invalid until explicitly validated
        errors: []
      });
      console.log(`[useWizardStep] Registered step: ${registeredId}`);
    } else {
      console.log(`[useWizardStep] Deferring step registration for: ${options.id}`);
      // We'll let the Wizard component handle the registration
    }
  } else {
    // Update existing step
    steps.value[stepIndex].title = stepTitle.value || steps.value[stepIndex].title;
  }

  // Make sure the title is accessible to the parent component
  if (instance) {
    // Set the title as a property on the instance
    if (!instance.exposed) {
      instance.exposed = {};
    }
    
    // Explicitly expose the stepTitle to the parent component as a computed property
    (instance.exposed as any).stepTitle = stepTitle;
    
    // Also set the title on the component type for direct access
    if (instance.type && typeof instance.type === 'object') {
      (instance.type as any).stepTitle = stepTitle;
    }
  }

  // Watch for title changes and update the step title in the wizard context
  watch(stepTitle, (newTitle) => {
    const stepIndex = steps.value.findIndex(step => step.id === options.id);
    if (stepIndex !== -1) {
      steps.value[stepIndex].title = newTitle;
      console.log(`[useWizardStep] Updated title for step ${options.id} to: ${newTitle}`);
    }
  });

  /**
   * Computed property that returns the index of this step in the wizard
   * This is useful for determining the step's position in the wizard
   */
  const stepIndexComputed = computed(() => {
    return steps.value.findIndex(step => step.id === stepId.value);
  });

  /**
   * Computed property that determines if this step is currently active
   * This can be used to conditionally render step content or apply styling
   */
  const isActive = computed(() => {
    return stepIndexComputed.value === currentStepIndex.value;
  });

  const stepData = ref({});

  /**
   * Get the current data for this step
   * This method retrieves the step's data from the wizard context
   * 
   * @returns {Record<string, any>} The current step data
   */
  const getStepData = (): Record<string, any> => {
    return stepsData.value[stepId.value] || {};
  };

  /**
   * Update step data
   * This method is used to update the step data in the wizard context
   * @param data Step data to update
   */
  const updateData = (data: Record<string, any>) => {
    console.log(`[useWizardStep] Updating data for step ${options.id}:`, data);
    
    // Update step data in the wizard context
    updateStepData(options.id, data);
    
    // Also update the step data in the local state
    stepData.value = { ...stepData.value, ...data };
    
    // Log the updated data to help with debugging
    console.log(`[useWizardStep] Updated data for step ${options.id}:`, stepData.value);
    console.log(`[useWizardStep] All steps data:`, stepsData.value);
  };

  /**
   * Update the validation state for this step
   * This method updates the step's validation state in the wizard context
   * 
   * @param {boolean} isValid - Whether the step is valid
   * @param {string[]} [errors=[]] - Validation error messages
   */
  const updateStepValidation = (isValid: boolean, errors: string[] = []) => {
    // Update the validation state in the wizard context
    contextUpdateStepValidation(stepId.value, isValid, errors);
    
    // Log validation state for debugging
    console.log(`[useWizardStep] Updated validation for step ${options.id}:`, { isValid, errors });
    
    // Find the step in the steps array and update its isValid property directly
    const stepIndex = steps.value.findIndex(step => step.id === stepId.value);
    if (stepIndex !== -1) {
      // Update the step's isValid and errors properties
      steps.value[stepIndex].isValid = isValid;
      steps.value[stepIndex].errors = errors;
      
      // Log the updated step for debugging
      console.log(`[useWizardStep] Step ${options.id} updated:`, steps.value[stepIndex]);
    }
  };

  /**
   * Initialize step data when the component is mounted
   * This sets the initial data for the step if provided
   */
  onMounted(() => {
    // Initialize step data if provided
    if (options.initialData) {
      updateData(options.initialData);
    }
  });

  return {
    stepId,
    stepTitle,
    isActive,
    updateData,
    updateStepValidation,
    getStepData
  };
}
