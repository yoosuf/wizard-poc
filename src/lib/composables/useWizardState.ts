/**
 * @file useWizardState.ts
 * @description Core composable for wizard state management
 * This replaces the store-based approach with a more performant and reusable
 * composable-based solution.
 */

import { ref, computed, reactive, readonly } from 'vue';
import type { WizardStep } from '../types/wizard';

/**
 * Interface for wizard state
 */
export interface WizardState {
  steps: WizardStep[];
  currentStepIndex: number;
  stepsData: Record<string, Record<string, any>>;
  stepsValidation: Record<string, { isValid: boolean; errors: string[] }>;
  stepComponents: Record<string, { 
    validationSchema?: any; 
    validate?: () => Promise<boolean> 
  }>;
}

/**
 * Creates and manages wizard state
 * 
 * This composable centralizes all wizard state management and provides
 * a reactive API for components to interact with the wizard state.
 * 
 * @returns Wizard state and methods
 */
export function useWizardState() {
  // Core state
  const steps = ref<WizardStep[]>([]);
  const currentStepIndex = ref(0);
  const stepsData = reactive<Record<string, Record<string, any>>>({});
  const stepsValidation = reactive<Record<string, { isValid: boolean; errors: string[] }>>({});
  const stepComponents = reactive<Record<string, { validationSchema?: any; validate?: () => Promise<boolean> }>>({});

  // Computed properties
  const currentStep = computed(() => currentStepIndex.value);
  const totalSteps = computed(() => steps.value.length);
  const isFirstStep = computed(() => currentStepIndex.value === 0);
  const isLastStep = computed(() => currentStepIndex.value === steps.value.length - 1);
  
  const currentStepIsValid = computed(() => {
    const currentStepId = steps.value[currentStepIndex.value]?.id;
    return !stepsValidation[currentStepId] || stepsValidation[currentStepId]?.isValid;
  });
  
  const allStepsValid = computed(() => {
    if (steps.value.length === 0) return false;
    
    for (const step of steps.value) {
      const validation = stepsValidation[step.id];
      if (!validation || !validation.isValid) {
        return false;
      }
    }
    
    return true;
  });
  
  const progress = computed(() => {
    if (steps.value.length === 0) return 0;
    return ((currentStepIndex.value + 1) / steps.value.length) * 100;
  });
  
  const canGoNext = computed(() => {
    const currentStep = steps.value[currentStepIndex.value];
    return currentStepIndex.value < steps.value.length - 1 && 
           (currentStep?.optional || currentStepIsValid.value);
  });
  
  const canGoPrevious = computed(() => currentStepIndex.value > 0);
  
  const canComplete = computed(() => {
    return isLastStep.value && currentStepIsValid.value;
  });
  
  const currentValidationErrors = computed(() => {
    const currentStepId = steps.value[currentStepIndex.value]?.id;
    if (currentStepId && stepsValidation[currentStepId]) {
      return stepsValidation[currentStepId].errors || [];
    }
    return [];
  });
  
  // Methods
  function registerStep(step: WizardStep): string {
    // Check if step with the same ID already exists
    const existingStepIndex = steps.value.findIndex(s => s.id === step.id);
    if (existingStepIndex === -1) {
      // Only add the step if it doesn't already exist
      console.log(`[WizardState] Registering new step: ${step.id}`);
      
      // Initialize with isValid property
      const newStep = {
        ...step,
        isValid: step.isValid !== undefined ? step.isValid : false,
        errors: step.errors || []
      };
      
      steps.value.push(newStep);
      
      // Initialize validation state
      if (!stepsValidation[step.id]) {
        stepsValidation[step.id] = { 
          isValid: newStep.isValid, 
          errors: newStep.errors 
        };
      }
    } else {
      // Update existing step properties
      console.log(`[WizardState] Step already exists: ${step.id}, updating properties`);
      const existingStep = steps.value[existingStepIndex];
      // Update title if provided
      if (step.title && step.title !== existingStep.title) {
        existingStep.title = step.title;
      }
      // Update optional flag if provided
      if (typeof step.optional === 'boolean') {
        existingStep.optional = step.optional;
      }
      // Update isValid if provided
      if (typeof step.isValid === 'boolean') {
        existingStep.isValid = step.isValid;
        // Also update in the validation state
        if (stepsValidation[step.id]) {
          stepsValidation[step.id].isValid = step.isValid;
        }
      }
      // Update errors if provided
      if (step.errors) {
        existingStep.errors = step.errors;
        // Also update in the validation state
        if (stepsValidation[step.id]) {
          stepsValidation[step.id].errors = step.errors;
        }
      }
    }
    return step.id;
  }
  
  function updateStepTitle(stepId: string, title: string): void {
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex !== -1) {
      steps.value[stepIndex].title = title;
    }
  }
  
  function updateStepValidation(stepId: string, isValid: boolean, errors: string[] = []): void {
    stepsValidation[stepId] = { isValid, errors };
    
    // Update the isValid property on the step object itself
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex !== -1) {
      steps.value[stepIndex].isValid = isValid;
      steps.value[stepIndex].errors = errors;
    }
  }
  
  function updateStepData(stepId: string, data: Record<string, any>): void {
    stepsData[stepId] = {
      ...stepsData[stepId],
      ...data
    };
  }
  
  function updateStepComponent(stepId: string, component: { validationSchema?: any; validate?: () => Promise<boolean> }): void {
    stepComponents[stepId] = component;
  }
  
  /**
   * Validate a step
   * 
   * @param {string} stepId - The ID of the step to validate
   * @param {boolean} [lazyValidation=false] - If true, only show validation errors if the step has been interacted with
   * @returns {Promise<boolean>} Whether the step is valid
   */
  async function validateStep(stepId: string, lazyValidation: boolean = false): Promise<boolean> {
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex === -1) return false;
    
    const step = steps.value[stepIndex];
    if (!step) return false;

    // Get step data
    const stepData = stepsData[stepId] || {};
    
    // If using lazy validation and the step hasn't been interacted with,
    // consider it valid and don't show errors
    if (lazyValidation && !stepData._interacted) {
      updateStepValidation(stepId, true, []);
      return true;
    }

    // Check if we have a custom validation function
    const stepComponent = stepComponents[stepId];
    if (stepComponent?.validate) {
      const isValid = await stepComponent.validate();
      // The updateStepValidation function will update the step's isValid property
      return isValid;
    }

    // Fallback to schema validation
    if (stepComponent?.validationSchema) {
      try {
        // Validate the data
        stepComponent.validationSchema.validateSync(stepData, { abortEarly: false });
        
        // If validation passes, update validation state with no errors
        updateStepValidation(stepId, true, []);
        return true;
      } catch (err: any) {
        // Extract validation errors
        const errors = err.inner ? 
          err.inner.map((validationError: { message: string }) => validationError.message) : 
          [err.message || 'Validation failed'];
        
        // If using lazy validation and the step hasn't been interacted with,
        // mark as valid for navigation purposes but still track the errors
        if (lazyValidation && !stepData._interacted) {
          // Store the validation state with errors but mark as valid
          // This way errors are tracked but not shown to the user
          stepsValidation[stepId] = { isValid: true, errors };
          // Also update the step object
          step.isValid = true;
          step.errors = errors;
          return true;
        } else {
          // Normal validation - mark as invalid and show errors
          updateStepValidation(stepId, false, errors);
          return false;
        }
      }
    }
    
    // If no validation schema, consider it valid
    updateStepValidation(stepId, true, []);
    return true;
  }
  
  function goToStep(index: number): boolean {
    if (index >= 0 && index < steps.value.length) {
      currentStepIndex.value = index;
      return true;
    }
    return false;
  }
  
  function goToStepById(stepId: string): boolean {
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex !== -1) {
      return goToStep(stepIndex);
    }
    return false;
  }
  
  function goToNextStep(): boolean {
    if (canGoNext.value) {
      currentStepIndex.value++;
      return true;
    }
    return false;
  }
  
  function goToPrevStep(): boolean {
    if (canGoPrevious.value) {
      currentStepIndex.value--;
      return true;
    }
    return false;
  }
  
  function reset(): void {
    currentStepIndex.value = 0;
    Object.keys(stepsData).forEach(key => {
      delete stepsData[key];
    });
    Object.keys(stepsValidation).forEach(key => {
      delete stepsValidation[key];
    });
  }
  
  function getFlattenedData(): Record<string, any> {
    const result: Record<string, any> = {};
    
    Object.entries(stepsData).forEach(([_, stepData]) => {
      Object.entries(stepData).forEach(([key, value]) => {
        // Skip internal properties (those starting with _)
        if (!key.startsWith('_')) {
          result[key] = value;
        }
      });
    });
    
    return result;
  }
  
  function getStepData(stepId: string): Record<string, any> {
    return stepsData[stepId] || {};
  }
  
  function getStepValidation(stepId: string): string[] {
    if (stepsValidation[stepId]) {
      return stepsValidation[stepId].errors || [];
    }
    return [];
  }
  
  function getStepIndexById(stepId: string): number {
    return steps.value.findIndex((step: WizardStep) => step.id === stepId);
  }
  
  function getStepById(stepId: string): WizardStep | undefined {
    return steps.value.find((step: WizardStep) => step.id === stepId);
  }

  // Return state and methods
  return {
    // State (readonly to prevent direct mutation)
    steps: readonly(steps),
    currentStepIndex: readonly(currentStepIndex),
    
    // Computed properties
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    currentStepIsValid,
    allStepsValid,
    progress,
    canGoNext,
    canGoPrevious,
    canComplete,
    currentValidationErrors,
    
    // Methods for data access
    getStepData,
    getStepValidation,
    getStepById,
    getStepIndexById,
    getFlattenedData,
    
    // Methods for state mutation
    registerStep,
    updateStepTitle,
    updateStepValidation,
    updateStepData,
    updateStepComponent,
    validateStep,
    goToStep,
    goToStepById,
    goToNextStep,
    goToPrevStep,
    reset
  };
}

// Create a singleton instance for global state
const wizardState = useWizardState();

/**
 * Get the global wizard state instance
 * This provides a way to access the same wizard state across components
 * 
 * @returns The global wizard state instance
 */
export function useGlobalWizardState() {
  return wizardState;
}
