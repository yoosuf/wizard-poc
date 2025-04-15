/**
 * @file useWizard.ts
 * @description Main composable for creating and managing wizard functionality.
 * This module provides the core wizard functionality, including step management,
 * navigation, validation, and data handling.
 */

import { computed, ref, type Ref } from 'vue';
import type { WizardOptions, WizardStep, StepRef } from '../types/wizard';
import { v4 as uuidv4 } from 'uuid';
import { createWizardContext } from './useWizardContext';
import { useWizardState } from './useWizardState';

/**
 * Main composable for creating and managing a wizard
 * 
 * This composable provides the core wizard functionality, including step management,
 * navigation, validation, and data handling.
 * 
 * @example
 * ```ts
 * // In the wizard component
 * import { useWizard } from '../composables/useWizard';
 * 
 * const { 
 *   steps, 
 *   currentStepIndex, 
 *   goToNextStep, 
 *   goToPrevStep 
 * } = useWizard({
 *   steps: [
 *     { id: 'step-1', title: 'Step 1' },
 *     { id: 'step-2', title: 'Step 2' }
 *   ]
 * });
 * ```
 * 
 * @param {Partial<WizardOptions>} options - Configuration options for the wizard
 * @returns {Object} Wizard methods and state
 */
export function useWizard(options: Partial<WizardOptions> = {}) {
  // Get the wizard state
  const wizardState = useWizardState();
  
  // Initialize steps from options
  if (options.steps && Array.isArray(options.steps)) {
    options.steps.forEach((step: WizardStep) => {
      // Generate a unique ID if not provided
      const stepId = step.id || `step-${uuidv4()}`;
      
      // Register the step with the wizard state
      wizardState.registerStep({
        id: stepId,
        title: step.title || `Step ${wizardState.totalSteps.value + 1}`,
        component: step.component,
        optional: step.optional || false
      });
    });
  }
  
  // Set initial step if provided
  if (options.initialStep !== undefined) {
    const stepIndex = typeof options.initialStep === 'number' 
      ? options.initialStep 
      : wizardState.getStepIndexById(options.initialStep);
    
    if (stepIndex !== -1) {
      wizardState.goToStep(stepIndex);
    }
  }
  
  // Reference to the current step component
  const currentStepRef = ref<StepRef | null>(null);
  
  // Create a computed property that returns the current step
  const currentStepComputed = computed<WizardStep | undefined>(() => {
    return wizardState.steps.value[wizardState.currentStepIndex.value];
  });
  
  // Create wizard context for child components
  const wizardContext = createWizardContext({
    steps: wizardState.steps as Ref<any[]>,
    currentStepIndex: wizardState.currentStepIndex as Ref<number>,
    currentStepRef
  });
  
  // Return the wizard API
  return {
    // State
    steps: wizardState.steps,
    currentStepIndex: wizardState.currentStepIndex,
    currentStepRef,
    currentStep: currentStepComputed,
    
    // Navigation
    goToStep: wizardState.goToStep,
    goToNextStep: wizardState.goToNextStep,
    goToPrevStep: wizardState.goToPrevStep,
    goToStepById: wizardState.goToStepById,
    
    // Data management
    updateStepData: wizardState.updateStepData,
    getFlattenedData: wizardState.getFlattenedData,
    
    // Validation
    validateStep: wizardState.validateStep,
    updateStepValidation: wizardState.updateStepValidation,
    
    // Step management
    registerStep: wizardState.registerStep,
    updateStepTitle: wizardState.updateStepTitle,
    
    // Context
    wizardContext
  };
}
