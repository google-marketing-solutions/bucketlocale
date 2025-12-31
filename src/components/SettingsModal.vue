<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">Settings</h2>
      <form @submit.prevent="saveSettings">
        <div class="form-group checkbox-group">
          <input type="checkbox" id="useSecretManager" v-model="localConfig.useSecretManager" />
          <label for="useSecretManager">Read keys from Secret Manager</label>
          <div class="tooltip-wrapper">
            <i class="material-icons info-icon">help_outline</i>
            <div class="tooltip-content">
              Check this box if you are reading secrets that are saved in GCP Secret Manager. The keys should be named 'gemini_api_key' and 'google_ads_developer_token', and saved in the same project as the one associated with the Google Client ID, where you need to be granted the role 'Secret Manager Secret Accessor' in the IAM.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="model">Model</label>
          <select id="model" v-model="localConfig.model">
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>
        <div class="form-group">
          <label for="googleAdsMccId">Google Ads MCC ID</label>
          <input type="text" id="googleAdsMccId" v-model="localConfig.googleAdsMccId" />
        </div>
        <template v-if="!localConfig.useSecretManager">
          <div class="form-group">
            <label for="geminiApiKey">Gemini API Key</label>
            <input type="password" id="geminiApiKey" v-model="localConfig.geminiApiKey" />
          </div>
          <div class="form-group">
            <label for="googleAdsDeveloperToken">Google Ads Developer Token</label>
            <input
              type="password"
              id="googleAdsDeveloperToken"
              v-model="localConfig.googleAdsDeveloperToken"
            />
          </div>
        </template>
        <template v-else>
          <div class="info-box">
            <i class="material-icons">info</i>
            <p>
              We will automatically look for secrets in the Google Cloud Project associated with your Client ID.
              <br /><br />
              Ensure the following secrets exist in Secret Manager:
              <br />
              - <strong>gemini_api_key</strong>
              <br />
              - <strong>google_ads_developer_token</strong>
            </p>
          </div>
        </template>
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
  if (localConfig.value.googleAdsMccId) {
    localConfig.value.googleAdsMccId = localConfig.value.googleAdsMccId.trim();
  }
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

.form-group input,
.form-group select {
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

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input {
  width: auto;
  margin: 0;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
}



.info-icon {
  font-size: 1.1rem;
  color: var(--text-color-muted);
  cursor: help;
  transition: color 0.2s ease;
}

.info-icon:hover {
  color: var(--primary-color);
}

.tooltip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip-content {
  visibility: hidden;
  background-color: var(--surface-color);
  color: var(--text-color);
  text-align: center;
  padding: 0.8rem;
  border-radius: 8px;
  position: absolute;
  z-index: 10;
  bottom: 135%;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  pointer-events: none;
  line-height: 1.4;
}

.tooltip-content::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--surface-color) transparent transparent transparent;
}

.tooltip-wrapper:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}

.info-box {
  background-color: rgba(0, 198, 255, 0.1);
  border: 1px solid rgba(0, 198, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  color: var(--text-color);
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-box i {
  color: var(--primary-color);
  font-size: 1.4rem;
  margin-top: 0.1rem;
}

.info-box strong {
  color: var(--primary-color);
  font-family: monospace;
}
</style>
