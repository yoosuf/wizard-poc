<template>
  <div 
    class="wizard-content"
    role="tabpanel"
    :id="`panel-${stepId}`"
    :aria-labelledby="`tab-${stepId}`"
  >
    <div class="wizard-content__container">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  stepId: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.wizard-content {
  flex-grow: 1;
  min-height: 300px;
  padding: 1.5rem;
  border: 1px solid var(--wizard-border-color, #e5e7eb);
  border-radius: 0.5rem;
  background-color: #ffffff;
  width: 100%;
}

.wizard-content__container {
  height: 100%;
  width: 100%;
}
</style>
