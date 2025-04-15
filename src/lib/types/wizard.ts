import { type Ref } from 'vue';

export interface ValidationSchema {
  validate: (data: any, options?: any) => Promise<boolean>;
}

/**
 * Wizard step interface
 */
export interface WizardStep {
  id: string;
  title?: string;
  optional?: boolean;
  isValid?: boolean;
  errors?: readonly string[];
  component?: any;
  props?: any;
  data?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface StepRef {
  validate: () => Promise<boolean>;
  getData: () => Record<string, any>;
  showValidationErrors?: () => void;
}

/**
 * Event emitted when the step changes
 */
export interface StepChangeEvent {
  fromStepIndex: number;
  toStepIndex: number;
  fromStepId: string;
  toStepId: string;
}

/**
 * Event emitted when a step is completed
 */
export interface StepCompleteEvent {
  stepId: string;
  stepIndex: number;
  data: Record<string, any>;
}

/**
 * Event emitted when the wizard is completed
 */
export interface CompleteEvent {
  data: Record<string, any>;
}

export interface StepOptions {
  id: string;
  title: string;
  optional?: boolean;
  data?: Record<string, any>;
  validationSchema?: ValidationSchema | any;
  initialData?: Record<string, any>;
}

export interface StepConfig {
  id: string;
  title: string;
  component: any;
  optional?: boolean;
}

export interface WizardOptions {
  initialStep?: number;
  steps: Ref<StepConfig[]>;
  currentStepIndex: Ref<number>;
  stepsRefs: Ref<StepRef[]>;
}

export interface WizardContext {
  // Required properties
  steps: Ref<StepConfig[]>;
  currentStepIndex: Ref<number>;
  stepsRefs: Ref<StepRef[]>;
  stepsData: Ref<Record<string, any>>;
  validationErrors: Ref<Record<string, string[]>>;
  currentValidationErrors: Ref<string[]>;

  // Required methods
  goToStep: (index: number) => Promise<boolean>;
  goToNextStep: () => Promise<boolean>;
  goToPrevStep: () => Promise<boolean>;
  getFlattenedData: () => Record<string, any>;
  getStepIndexById: (stepId: string) => number;
  registerStep: (step: WizardStep) => void;
  updateStepData: (stepId: string, data: Record<string, any>) => void;
  updateStepValidation: (stepId: string, isValid: boolean, errors: string[]) => void;
  updateStepTitle: (stepId: string, title: string) => void;
  validateStep: (stepId: string, lazyValidation?: boolean) => Promise<boolean>;
}
