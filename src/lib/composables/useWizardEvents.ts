/**
 * @file useWizardEvents.ts
 * @description Provides event handling for wizard components
 * This module enables event-based communication between wizard components
 * and external consumers.
 */

import { ref } from 'vue';
import type { StepChangeEvent } from '../types/wizard';
import { useWizardState } from './useWizardState';

/**
 * Interface for validation error event
 */
interface ValidationErrorEvent {
  stepId: string;
  errors: string[];
}

/**
 * Create and manage wizard events
 * 
 * This composable provides event handling for wizard components, allowing them
 * to emit and listen for events. It also provides a way to integrate with the
 * wizard state to automatically emit events when state changes.
 * 
 * @returns {Object} Event handling methods
 */
export function useWizardEvents() {
  // Event listeners
  const listeners = ref<Record<string, Function[]>>({});
  
  /**
   * Add an event listener
   * 
   * @param {string} event - The event to listen for
   * @param {Function} callback - The callback to execute when the event is emitted
   */
  const on = (event: string, callback: Function) => {
    if (!listeners.value[event]) {
      listeners.value[event] = [];
    }
    listeners.value[event].push(callback);
  };
  
  /**
   * Remove an event listener
   * 
   * @param {string} event - The event to remove the listener from
   * @param {Function} callback - The callback to remove
   */
  const off = (event: string, callback: Function) => {
    if (!listeners.value[event]) return;
    listeners.value[event] = listeners.value[event].filter(cb => cb !== callback);
  };
  
  /**
   * Emit an event
   * 
   * @param {string} event - The event to emit
   * @param {any} payload - The payload to send with the event
   */
  const emit = (event: string, payload?: any) => {
    if (!listeners.value[event]) return;
    listeners.value[event].forEach(callback => callback(payload));
  };
  
  /**
   * Setup event handlers for wizard state changes
   * 
   * This function connects wizard state actions to the event system,
   * automatically emitting events when state changes occur.
   * 
   * @returns {Object} Event handling methods
   */
  const setupEventHandlers = () => {
    const wizardState = useWizardState();
    
    // Track the previous step index for step change events
    let previousStepIndex = wizardState.currentStepIndex.value;
    
    // Watch for step changes
    const originalGoToStep = wizardState.goToStep;
    const wrappedGoToStep = (index: number) => {
      const result = originalGoToStep(index);
      
      if (result) {
        const fromIndex = previousStepIndex;
        const toIndex = index;
        previousStepIndex = index;
        
        // Get step IDs
        const fromStepId = wizardState.steps.value[fromIndex]?.id || '';
        const toStepId = wizardState.steps.value[toIndex]?.id || '';
        
        // Emit step change event
        emit('step-change', {
          fromStep: fromIndex,
          toStep: toIndex,
          fromStepId,
          toStepId
        } as StepChangeEvent);
      }
      
      return result;
    };
    
    // Override goToStep with event-emitting version
    wizardState.goToStep = wrappedGoToStep;
    
    // Wrap goToNextStep
    const originalGoToNextStep = wizardState.goToNextStep;
    wizardState.goToNextStep = () => {
      const result = originalGoToNextStep();
      if (result) {
        // Event is already emitted by goToStep
      }
      return result;
    };
    
    // Wrap goToPrevStep
    const originalGoToPrevStep = wizardState.goToPrevStep;
    wizardState.goToPrevStep = () => {
      const result = originalGoToPrevStep();
      if (result) {
        // Event is already emitted by goToStep
      }
      return result;
    };
    
    // Wrap validateStep
    const originalValidateStep = wizardState.validateStep;
    wizardState.validateStep = async (stepId: string, lazyValidation: boolean = false) => {
      const result = await originalValidateStep(stepId, lazyValidation);
      
      // If validation failed, emit validation error event
      if (!result) {
        const errors = wizardState.getStepValidation(stepId);
        emit('validation-error', {
          stepId,
          errors
        } as ValidationErrorEvent);
      }
      
      return result;
    };
    
    // Return event methods
    return {
      on,
      off,
      emit
    };
  };
  
  /**
   * Register step events
   * 
   * Emits a 'step-register' event when a step is registered.
   * 
   * @param {string} stepId - The ID of the step
   * @param {string} title - The title of the step
   * @param {number} index - The index of the step
   */
  const registerStepEvents = (stepId: string, title: string, index: number) => {
    emit('step-register', { stepId, title, index });
  };
  
  /**
   * Unregister steps
   * 
   * Emits a 'step-unregister' event when a step is unregistered.
   * 
   * @param {string} stepId - The ID of the step to unregister
   */
  const unregisterStepEvents = (stepId: string) => {
    emit('step-unregister', { stepId });
  };
  
  return {
    on,
    off,
    emit,
    setupEventHandlers,
    registerStepEvents,
    unregisterStepEvents
  };
}
