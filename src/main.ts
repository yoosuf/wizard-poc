import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configure } from 'vee-validate'
import WizardExample from './demo/WizardExample.vue'
import WizardPlugin from './lib'

// Configure Vee-Validate
configure({
  validateOnInput: true, // Validate each time the input changes
  validateOnChange: true, // Validate each time the input changes
  validateOnBlur: true, // Validate when the input loses focus
  validateOnModelUpdate: true // Validate when v-model is updated
})

// Create app
const app = createApp(WizardExample)

// Use plugins
app.use(createPinia())
app.use(WizardPlugin)

// Mount app
app.mount('#app')