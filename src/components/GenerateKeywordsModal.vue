<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">Generate Keywords</h2>
      <form @submit.prevent="generateKeywords">
        <div class="form-row">
          <div class="form-group">
            <label for="companyName">Company/Product Name</label>
            <input type="text" id="companyName" v-model="form.companyName" />
          </div>
          <div class="form-group">
            <label for="verticalName">Vertical Name</label>
            <input type="text" id="verticalName" v-model="form.verticalName" />
          </div>
        </div>
        <div class="form-group">
          <label for="companyDescription">Company/Product Description</label>
          <textarea id="companyDescription" v-model="form.companyDescription"></textarea>
        </div>
        <div class="form-group">
          <label for="verticalDescription">Vertical Description</label>
          <textarea id="verticalDescription" v-model="form.verticalDescription"></textarea>
        </div>
        <div class="form-group">
          <label for="seedKeywords">Seed Keywords (comma-separated)</label>
          <input type="text" id="seedKeywords" v-model="form.seedKeywordsStr" />
        </div>
        <div class="form-group">
          <label for="productLandingPage">Product Landing Page URL</label>
          <input type="url" id="productLandingPage" v-model="form.productLandingPage" />
        </div>
        <div class="form-group">
          <label for="competitionLandingPages">Competition Landing Pages (one URL per line)</label>
          <textarea
            id="competitionLandingPages"
            v-model="form.competitionLandingPagesStr"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="userIntents">Target User Intents</label>
          <VueMultiselect
            v-model="form.userIntents"
            :options="[
              'Informational',
              'Navigational',
              'Commercial Investigation',
              'Transactional',
            ]"
            :multiple="true"
            :close-on-select="false"
            placeholder="Select user intents"
          />
        </div>
        <div class="form-group">
          <label for="numKeywords">Number of Keywords to Generate</label>
          <input
            type="number"
            id="numKeywords"
            v-model.number="form.numKeywords"
            min="50"
            max="1000"
            step="50"
          />
        </div>
        <div class="form-group">
          <label for="negativeKeywords">Negative Keywords (comma-separated)</label>
          <textarea id="negativeKeywords" v-model="form.negativeKeywordsStr"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Generating...' : 'Generate' }}
          </button>
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VueMultiselect from 'vue-multiselect';
import { geminiApiService } from '../services/gemini';
import { useKeywordGenerationStore } from '../stores/keywordGeneration';
import type { KeywordGenerationForm } from '../types/forms';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'generate', results: string[]): void;
}>();

const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

const store = useKeywordGenerationStore();
const form = store.form;

const generateKeywords = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;
  try {
    const results = await geminiApiService.generateKeywords(form);
    emit('generate', results);
    store.resetForm();
    emit('close');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error.value = errorMessage;
    // Optionally, display the error to the user in the modal
    alert(`Error: ${errorMessage}`);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
/* ... (styles similar to SettingsModal) ... */
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
  max-width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
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
.form-group textarea {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--font-family);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #ff4d4d;
  margin-top: 1rem;
  text-align: right;
}
</style>
