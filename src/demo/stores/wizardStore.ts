/**
 * @file wizardStore.ts
 * @description Unified Pinia store for wizard state management
 * This store centralizes all wizard functionality including step management,
 * navigation, validation, and data handling.
 */

import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import type { WizardStep, StepRef } from '../../lib/types/wizard';

/**
 * Unified wizard store that combines the functionality of:
 * - Step store registry
 * - Navigation
 * - Validation
 * - Data management
 * - Event handling
 */
export const useWizardStore = defineStore('wizard', () => {
  // Core state
  const steps = ref<WizardStep[]>([]);
  const currentStepIndex = ref(0);
  const stepsData = reactive<Record<string, Record<string, any>>>({});
  const stepsValidation = reactive<Record<string, { isValid: boolean; errors: string[] }>>({});
  const stepComponents = reactive<Record<string, { validationSchema?: any; validate?: () => Promise<boolean> }>>({});
  const currentStepRef = ref<StepRef | null>(null);

  // Computed properties
  const currentStep = computed(() => steps.value[currentStepIndex.value]);
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
      return Array.from(stepsValidation[currentStepId].errors || []);
    }
    return [];
  });

  // Step Registration
  function registerStep(step: WizardStep): string {
    // Check if step with the same ID already exists
    const existingStepIndex = steps.value.findIndex(s => s.id === step.id);
    if (existingStepIndex === -1) {
      // Only add the step if it doesn't already exist
      console.log(`[WizardStore] Registering new step: ${step.id}`);
      
      // Initialize with isValid property
      const newStep = {
        ...step,
        isValid: step.isValid !== undefined ? step.isValid : false,
        errors: step.errors ? Array.from(step.errors) : []  
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
      console.log(`[WizardStore] Step already exists: ${step.id}, updating properties`);
      const existingStep = steps.value[existingStepIndex];
      
      // Update title if provided
      if (step.title && step.title !== existingStep.title) {
        steps.value[existingStepIndex].title = step.title;
      }
      
      // Update optional flag if provided
      if (step.optional !== undefined && step.optional !== existingStep.optional) {
        steps.value[existingStepIndex].optional = step.optional;
      }
      
      // Update component if provided
      if (step.component && step.component !== existingStep.component) {
        steps.value[existingStepIndex].component = step.component;
      }
      
      // Update props if provided
      if (step.props && step.props !== existingStep.props) {
        steps.value[existingStepIndex].props = step.props;
      }
      
      // Update validation state if provided
      if (step.isValid !== undefined && step.isValid !== existingStep.isValid) {
        steps.value[existingStepIndex].isValid = step.isValid;
        if (!stepsValidation[step.id]) {
          stepsValidation[step.id] = { 
            isValid: step.isValid, 
            errors: step.errors ? Array.from(step.errors) : []  
          };
        } else {
          stepsValidation[step.id].isValid = step.isValid;
        }
      }
      
      // Update errors if provided
      if (step.errors && step.errors !== existingStep.errors) {
        steps.value[existingStepIndex].errors = Array.from(step.errors);  
        if (!stepsValidation[step.id]) {
          stepsValidation[step.id] = { 
            isValid: step.isValid !== undefined ? step.isValid : false, 
            errors: Array.from(step.errors)  
          };
        } else {
          stepsValidation[step.id].errors = Array.from(step.errors);  
        }
      }
    }
    
    // Initialize step data if not already present
    if (!stepsData[step.id]) {
      stepsData[step.id] = step.data || {};
    }
    
    return step.id;
  }

  // Update step title
  function updateStepTitle(stepId: string, title: string): void {
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex !== -1) {
      steps.value[stepIndex].title = title;
    }
  }

  // Update step validation
  function updateStepValidation(stepId: string, isValid: boolean, errors: string[] = []): void {
    stepsValidation[stepId] = { isValid, errors: Array.from(errors) };  
    
    // Also update the step object
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex !== -1) {
      steps.value[stepIndex].isValid = isValid;
      steps.value[stepIndex].errors = Array.from(errors);  
    }
  }

  // Update step data
  function updateStepData(stepId: string, data: Record<string, any>): void {
    stepsData[stepId] = { ...stepsData[stepId], ...data };
    
    // Mark the step as interacted with
    stepsData[stepId]._interacted = true;
  }

  // Update step component
  function updateStepComponent(stepId: string, component: { validationSchema?: any; validate?: () => Promise<boolean> }): void {
    stepComponents[stepId] = component;
  }

  // Validate step
  async function validateStep(stepId: string, lazyValidation: boolean = false): Promise<boolean> {
    const stepIndex = getStepIndexById(stepId);
    if (stepIndex === -1) {
      console.error(`[WizardStore] Step not found: ${stepId}`);
      return false;
    }
    
    const step = steps.value[stepIndex];
    const stepData = stepsData[stepId] || {};
    
    // Check if the step has a validation function
    if (stepComponents[stepId]?.validate) {
      try {
        // Call the validate function
        const isValid = await stepComponents[stepId].validate!();
        
        // If valid, update validation state
        if (isValid) {
          updateStepValidation(stepId, true, []);
        }
        
        return isValid;
      } catch (err: any) {
        // Handle validation error
        const errors = [err.message || 'Validation failed'];
        updateStepValidation(stepId, false, errors);
        return false;
      }
    } else if (stepComponents[stepId]?.validationSchema) {
      // Use validation schema
      const schema = stepComponents[stepId].validationSchema;
      
      try {
        // Validate data against schema
        await schema.validate(stepData, { abortEarly: false });
        
        // If valid, update validation state
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
          stepsValidation[stepId] = { isValid: true, errors: Array.from(errors) };  
          // Also update the step object
          step.isValid = true;
          step.errors = Array.from(errors);  
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

  // Navigation methods
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

  // Reset wizard state
  function reset(): void {
    currentStepIndex.value = 0;
    Object.keys(stepsData).forEach(key => {
      delete stepsData[key];
    });
    Object.keys(stepsValidation).forEach(key => {
      delete stepsValidation[key];
    });
  }

  // Data methods
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
      return Array.from(stepsValidation[stepId].errors || []);
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
    // State
    steps,
    currentStepIndex,
    currentStepRef,
    stepsData,
    stepsValidation,
    stepComponents,
    
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
});
