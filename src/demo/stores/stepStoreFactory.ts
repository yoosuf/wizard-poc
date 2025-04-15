/**
 * @file stepStoreFactory.ts
 * @description Factory for creating step-specific Pinia stores
 * This factory creates stores for individual wizard steps with consistent patterns
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useWizardStore } from './wizardStore';

/**
 * Step store options interface
 */
export interface StepStoreOptions<T> {
  id: string;
  title: string;
  optional?: boolean;
  initialData?: T;
  validate?: (data: T) => Promise<boolean> | boolean; // Optional custom validation method
}

/**
 * Creates a Pinia store for a specific wizard step
 * 
 * @param options Configuration options for the step store
 * @returns A Pinia store with step-specific state and methods
 */
export function createStepStore<T extends Record<string, any>>(options: StepStoreOptions<T>) {
  return defineStore(`step-${options.id}`, () => {
    // Get the main wizard store
    const wizardStore = useWizardStore();
    
    // Local state
    const data = ref<T>(options.initialData || {} as T);
    const isValid = ref(false);
    const errors = ref<string[]>([]);
    const validationTriggered = ref(false);
    
    
    // Register this step with the wizard store
    const stepId = options.id;
    wizardStore.registerStep({
      id: stepId,
      title: options.title,
      optional: options.optional || false,
      data: options.initialData || {},
      isValid: false,
      errors: []
    });
    
    // Computed properties
    const isActive = computed(() => {
      const stepIndex = wizardStore.getStepIndexById(stepId);
      return stepIndex === wizardStore.currentStepIndex;
    });
    
    const isComplete = computed(() => {
      return isValid.value;
    });
    
    // Methods
    function setData(newData: Partial<T>) {
      data.value = { ...data.value, ...newData } as T;
      
      // Update data in the wizard store
      wizardStore.updateStepData(stepId, data.value);
    }
    
    /**
     * Set the validation state for this step
     * This is called by the step component after it performs validation
     */
    function setValidationState(valid: boolean, validationErrors: string[] = []) {
      isValid.value = valid;
      errors.value = validationErrors;
      
      // Update validation in wizard store
      wizardStore.updateStepValidation(stepId, valid, validationErrors);
      
      return valid;
    }
    
    /**
     * Validate the step
     * This is a simplified method that just returns the current validation state
     * The actual validation is performed by the step component
     */
    async function validate(): Promise<boolean> {
      // If a custom validation method is provided, use it first
      if (options.validate) {
        const customValidationResult = await options.validate(data.value);
        if (customValidationResult !== true) {
          setValidationState(false, typeof customValidationResult === 'string' ? [customValidationResult] : []);
          return false;
        }
      }

      // If no validation is specified, return true (assuming valid)
      setValidationState(true);
      return true;
    }
    
    function reset() {
      // Reset to initial data
      data.value = options.initialData ? { ...options.initialData } : {} as T;
      isValid.value = false;
      errors.value = [];
      validationTriggered.value = false;
      
      // Update wizard store
      wizardStore.updateStepData(stepId, data.value);
      wizardStore.updateStepValidation(stepId, false, []);
    }
    
    function loadPrePopulatedData(prePopulatedData: Partial<T>) {
      data.value = { ...data.value, ...prePopulatedData } as T;
      wizardStore.updateStepData(stepId, data.value);
    }
    
    function showValidationErrors() {
      validationTriggered.value = true;
    }
    
    // Watch for changes in data and update the wizard store
    watch(data, (newData) => {
      wizardStore.updateStepData(stepId, newData);
    }, { deep: true });
    
    return {
      // State
      data,
      isValid,
      errors,
      validationTriggered,
      
      // Computed properties
      isActive,
      isComplete,
      
      // Methods
      setData,
      validate,
      setValidationState,
      reset,
      loadPrePopulatedData,
      showValidationErrors
    };
  });
}
