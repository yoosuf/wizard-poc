/**
 * @file useWizardContext.ts
 * @description Provides context for wizard components
 * This module enables child components to access the wizard state and methods
 * through Vue's provide/inject pattern.
 */

import { inject, provide, type Ref, type InjectionKey, computed } from 'vue';
import type { StepRef, WizardStep } from '../types/wizard';
import { useWizardState } from './useWizardState';

/**
 * Symbol key for wizard context injection
 */
export const WizardContextKey = Symbol('WizardContext') as InjectionKey<WizardContext>;

/**
 * Interface for wizard context
 * 
 * @property {Ref<any[]>} steps - Reference to the array of step configurations
 * @property {Ref<number>} currentStepIndex - Reference to the current step index
 * @property {Ref<StepRef | null>} currentStepRef - Reference to the current step component instance
 * @property {Ref<Record<string, Record<string, any>>>} stepsData - Reference to the data collected from all steps
 * @property {Ref<Record<string, string[]>>} validationErrors - Reference to validation errors by step ID
 * @property {Ref<string[]>} currentValidationErrors - Reference to validation errors for the current step
 * @property {(index: number) => Promise<boolean>} goToStep - Navigate to a specific step by index
 * @property {() => Promise<boolean>} goToNextStep - Navigate to the next step
 * @property {() => Promise<boolean>} goToPrevStep - Navigate to the previous step
 * @property {() => Record<string, any>} getFlattenedData - Get flattened data from all steps
 * @property {(stepId: string, data: Record<string, any>) => void} updateStepData - Update data for a specific step
 * @property {(stepId: string, isValid: boolean, errors: string[]) => void} updateStepValidation - Update validation state for a specific step
 * @property {(stepId: string, lazyValidation?: boolean) => Promise<boolean>} validateStep - Validate a specific step
 */
export interface WizardContext {
  steps: Ref<any[]>;
  currentStepIndex: Ref<number>;
  currentStepRef: Ref<StepRef | null>;
  stepsData: Ref<Record<string, Record<string, any>>>;
  validationErrors: Ref<Record<string, string[]>>;
  currentValidationErrors: Ref<string[]>;
  goToStep: (index: number) => Promise<boolean>;
  goToNextStep: () => Promise<boolean>;
  goToPrevStep: () => Promise<boolean>;
  getFlattenedData: () => Record<string, any>;
  updateStepData: (stepId: string, data: Record<string, any>) => void;
  updateStepValidation: (stepId: string, isValid: boolean, errors?: string[]) => void;
  validateStep: (stepId: string, lazyValidation?: boolean) => Promise<boolean>;
  getStepIndexById: (stepId: string) => number;
  registerStep: (step: WizardStep) => string;
  updateStepTitle: (stepId: string, title: string) => void;
}

/**
 * Use wizard context from parent component
 * 
 * This function retrieves the wizard context from a parent component
 * through Vue's provide/inject pattern.
 * 
 * @example
 * ```ts
 * // In a child component
 * import { useWizardContext } from './useWizardContext';
 * 
 * const { currentStepIndex, goToNextStep } = useWizardContext();
 * ```
 * 
 * @returns {WizardContext} The wizard context
 * @throws {Error} If no wizard context is provided
 */
export function useWizardContext(): WizardContext {
  const context = inject(WizardContextKey);
  if (!context) {
    throw new Error('useWizardContext must be used within a Wizard component');
  }
  return context;
}

/**
 * Creates a wizard context from the provided options
 * 
 * This function creates a context object that can be provided to child components
 * through Vue's provide/inject pattern. It includes methods for navigation, data
 * management, and validation.
 * 
 * @example
 * ```ts
 * // In the wizard component
 * import { createWizardContext } from './useWizardContext';
 * import { provide } from 'vue';
 * 
 * const steps = ref([...]);
 * const currentStepIndex = ref(0);
 * const currentStepRef = ref(null);
 * 
 * const context = createWizardContext({
 *   steps,
 *   currentStepIndex,
 *   currentStepRef
 * });
 * 
 * // Provide the context to child components
 * provide(WizardContextKey, context);
 * ```
 * 
 * @param {Object} options - Configuration options for the wizard context
 * @param {Ref<any[]>} options.steps - Reference to the array of step configurations
 * @param {Ref<number>} options.currentStepIndex - Reference to the current step index
 * @param {Ref<StepRef | null>} options.currentStepRef - Reference to the current step component instance
 * @returns {WizardContext} The created wizard context
 */
export function createWizardContext({
  steps,
  currentStepIndex,
  currentStepRef
}: {
  steps: Ref<any[]>;
  currentStepIndex: Ref<number>;
  currentStepRef: Ref<StepRef | null>;
}): WizardContext {
  // Use the wizard state composable for state management
  const wizardState = useWizardState();
  
  // Create computed refs for reactive data
  const stepsData = computed(() => {
    const result: Record<string, Record<string, any>> = {};
    steps.value.forEach(step => {
      result[step.id] = wizardState.getStepData(step.id);
    });
    return result;
  });
  
  const validationErrors = computed(() => {
    const result: Record<string, string[]> = {};
    steps.value.forEach(step => {
      result[step.id] = wizardState.getStepValidation(step.id);
    });
    return result;
  });
  
  const currentValidationErrors = computed(() => {
    if (steps.value[currentStepIndex.value]) {
      const stepId = steps.value[currentStepIndex.value].id;
      return wizardState.getStepValidation(stepId);
    }
    return [];
  });
  
  // Create a context object that maps the wizardState to the expected WizardContext interface
  const context: WizardContext = {
    steps,
    currentStepIndex,
    currentStepRef,
    stepsData,
    validationErrors,
    currentValidationErrors,
    
    // Navigation methods
    goToStep: async (index: number): Promise<boolean> => {
      return wizardState.goToStep(index);
    },
    
    goToNextStep: async (): Promise<boolean> => {
      return wizardState.goToNextStep();
    },
    
    goToPrevStep: async (): Promise<boolean> => {
      return wizardState.goToPrevStep();
    },
    
    // Data methods
    getFlattenedData: (): Record<string, any> => {
      // Create a flattened object with all step data
      const result: Record<string, any> = {};
      
      // Add data from each step
      Object.entries(stepsData.value).forEach(([stepId, stepData]) => {
        result[stepId] = stepData;
      });
      
      return result;
    },
    
    updateStepData: (stepId: string, data: Record<string, any>): void => {
      wizardState.updateStepData(stepId, data);
    },
    
    // Validation methods
    updateStepValidation: (stepId: string, isValid: boolean, errors: string[] = []): void => {
      wizardState.updateStepValidation(stepId, isValid, errors);
    },
    
    validateStep: async (stepId: string, lazyValidation: boolean = false): Promise<boolean> => {
      return wizardState.validateStep(stepId, lazyValidation);
    },
    
    // Step management methods
    getStepIndexById: (stepId: string): number => {
      return wizardState.getStepIndexById(stepId);
    },
    
    registerStep: (step: WizardStep): string => {
      console.log('[useWizardContext] Registering step:', step);
      
      // Check if step already exists
      const existingIndex = steps.value.findIndex(s => s.id === step.id);
      
      if (existingIndex === -1) {
        // Add new step
        steps.value.push({
          id: step.id,
          title: step.title || '',
          optional: step.optional || false,
          component: step.component,
          props: step.props
        });
        console.log(`[useWizardContext] Added new step: ${step.id} with title: ${step.title}`);
      } else {
        // Update existing step
        const existingStep = steps.value[existingIndex];
        steps.value[existingIndex] = {
          ...existingStep,
          // Prioritize the new title if provided
          title: step.title || existingStep.title,
          optional: step.optional !== undefined ? step.optional : existingStep.optional,
          component: step.component || existingStep.component,
          props: step.props || existingStep.props
        };
        console.log(`[useWizardContext] Updated existing step: ${step.id} with title: ${step.title || existingStep.title}`);
      }
      
      // Ensure step data exists
      if (!stepsData.value[step.id]) {
        stepsData.value[step.id] = step.data || {};
      }
      
      return step.id;
    },
    
    updateStepTitle: (stepId: string, title: string): void => {
      wizardState.updateStepTitle(stepId, title);
    }
  };
  
  // Provide the context to child components
  provide(WizardContextKey, context);
  
  return context;
}
