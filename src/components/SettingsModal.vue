<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">Settings</h2>
      <form @submit.prevent="saveSettings">
        <div class="form-group">
          <label for="model">Model</label>
          <input type="text" id="model" v-model="localConfig.model" />
        </div>
        <div class="form-group">
          <label for="geminiApiKey">Gemini API Key</label>
          <input type="password" id="geminiApiKey" v-model="localConfig.geminiApiKey" />
        </div>
        <div class="form-group">
          <label for="googleAdsDeveloperToken">Google Ads Developer Token (Optional)</label>
          <input
            type="password"
            id="googleAdsDeveloperToken"
            v-model="localConfig.googleAdsDeveloperToken"
          />
        </div>
        <div class="form-group">
          <label for="googleAdsMccId">Google Ads MCC ID (Optional)</label>
          <input type="text" id="googleAdsMccId" v-model="localConfig.googleAdsMccId" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { config, saveConfig } from '../stores/config';
import type { Config } from '../stores/config';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const localConfig = ref<Partial<Config>>({ ...config });

const saveSettings = (): void => {
  saveConfig(localConfig.value);
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin-top: 0;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color-muted);
}

.form-group input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--font-family);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-color);
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color-muted);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  color: var(--text-color);
}
</style>
