# Vue Wizard Component

A highly customizable and reusable wizard/stepper component for Vue 3 applications.

## Features

- 🎨 Fully customizable UI through slots and CSS variables
- 🔄 Built-in state management with Pinia
- ✅ Form validation support with vee-validate and yup
- 📱 Responsive design
- 🎯 TypeScript support
- 🔌 Plugin system for easy integration

## Installation

```bash
npm install @codeium/vue-wizard
```

## Basic Usage

```vue
<template>
  <Wizard 
    title="Registration"
    subtitle="Complete the following steps to create your account"
  >
    <WizardStep title="Personal Info">
      <!-- Your step content here -->
    </WizardStep>
    <WizardStep title="Account Details">
      <!-- Your step content here -->
    </WizardStep>
    <WizardStep title="Preferences" :optional="true">
      <!-- Your step content here -->
    </WizardStep>
  </Wizard>
</template>

<script setup lang="ts">
import { Wizard, WizardStep } from '@codeium/vue-wizard';
</script>
```

## Props

### Wizard Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | '' | The title of the wizard |
| subtitle | string | '' | The subtitle of the wizard |
| showProgress | boolean | true | Whether to show the progress bar |
| showStepsList | boolean | true | Whether to show the steps list |
| showPrevButton | boolean | true | Whether to show the previous button |
| showSkipButton | boolean | true | Whether to show the skip button for optional steps |
| primaryColor | string | '#42b883' | Primary color for the theme |
| contentMinHeight | string | '300px' | Minimum height of the content area |
| contentBackground | string | '#f9f9f9' | Background color of the content area |
| prevButtonText | string | 'Previous' | Text for the previous button |
| nextButtonText | string | 'Next' | Text for the next button |
| skipButtonText | string | 'Skip' | Text for the skip button |
| completeButtonText | string | 'Complete' | Text for the complete button |
| optionalText | string | 'Optional' | Text for the optional step badge |
| wrapperClass | string/array/object | - | Additional classes for the wrapper |

### WizardStep Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | The title of the step |
| optional | boolean | false | Whether the step is optional |
| validationSchema | object | - | Yup validation schema for the step |

## Events

### Wizard Events

| Event | Payload | Description |
|-------|---------|-------------|
| step-change | { currentStep, totalSteps, stepData, stepId } | Emitted when the current step changes |
| complete | { currentStep, totalSteps, stepData, stepId, data } | Emitted when the wizard is completed |

## Slots

### Wizard Slots

| Name | Props | Description |
|------|-------|-------------|
| header | { title, subtitle } | Custom header content |
| progress | { progress } | Custom progress bar |
| steps-list | { steps, currentStepIndex } | Custom steps list |
| step-number | { step, index, isActive } | Custom step number |
| step-title | { step, index, isActive } | Custom step title |
| step-badge | { step, index, isActive } | Custom step badge |
| navigation | navigationProps | Custom navigation buttons |

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| --wizard-primary-color | #42b883 | Primary color for active states |
| --wizard-primary-hover-color | #3aa876 | Hover color for buttons |
| --wizard-content-min-height | 300px | Minimum height of content area |
| --wizard-content-bg | #f9f9f9 | Background color of content area |

## Advanced Usage

### With Validation

```vue
<template>
  <Wizard @complete="onComplete">
    <WizardStep 
      title="Personal Info"
      :validation-schema="personalInfoSchema"
    >
      <form @submit.prevent>
        <input v-model="form.name" placeholder="Name" />
        <input v-model="form.email" type="email" placeholder="Email" />
      </form>
    </WizardStep>
  </Wizard>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Wizard, WizardStep } from '@codeium/vue-wizard';
import * as yup from 'yup';

const personalInfoSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required')
});

const form = ref({
  name: '',
  email: ''
});

const onComplete = (data) => {
  console.log('Wizard completed with data:', data);
};
</script>
```

### Custom Styling

```vue
<template>
  <Wizard
    primary-color="#ff5722"
    content-background="#f5f5f5"
    :wrapper-class="['custom-wizard', { 'dark-theme': isDark }]"
  >
    <!-- Steps -->
  </Wizard>
</template>

<style>
.custom-wizard {
  /* Your custom styles */
}

.dark-theme {
  --wizard-content-bg: #2c3e50;
  color: white;
}
</style>
```

### Custom Navigation

```vue
<template>
  <Wizard>
    <template #navigation="{ isFirstStep, isLastStep, handlePrevStep, handleNextStep }">
      <div class="custom-navigation">
        <button 
          v-if="!isFirstStep" 
          @click="handlePrevStep"
          class="custom-btn"
        >
          Back
        </button>
        <button 
          v-if="!isLastStep" 
          @click="handleNextStep"
          class="custom-btn primary"
        >
          Continue
        </button>
      </div>
    </template>
  </Wizard>
</template>
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

MIT
