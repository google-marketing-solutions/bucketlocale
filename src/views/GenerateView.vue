<template>
  <div class="generate-view">
    <h1 class="view-title">Generate Keywords</h1>
    <p class="view-subtitle">Fill out the form below to generate a list of keywords.</p>
    <div class="card">
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Generating keywords...</p>
      </div>
      <form v-if="!hasGeneratedKeywords" @submit.prevent="generateKeywords">
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
        <div class="form-row">
          <div class="form-group">
            <label for="language">Language</label>
            <VueMultiselect
              v-model="form.language"
              :options="Object.keys(GOOGLE_ADS_LANGUAGE_MAP)"
              :multiple="false"
              :close-on-select="true"
              placeholder="Select language"
              :custom-label="(option: string) => GOOGLE_ADS_LANGUAGE_MAP[option]"
            />
          </div>
          <div class="form-group">
            <label for="geoTargetConstants">Geo Targets</label>
            <VueMultiselect
              v-model="form.geoTargetConstants"
              :options="Object.keys(GOOGLE_ADS_GEO_TARGET_MAP)"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select geo targets"
              :custom-label="(option: string) => GOOGLE_ADS_GEO_TARGET_MAP[option]"
            />
          </div>
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
          <label for="negativeKeywords">Negative Keywords (comma-separated)</label>
          <textarea id="negativeKeywords" v-model="form.negativeKeywordsStr"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Generating...' : 'Generate Keywords' }}
          </button>
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <div v-if="hasGeneratedKeywords" class="results-section">
        <h2 class="results-title">Generated Keywords ({{ generatedKeywords.length }})</h2>
        <div class="table-container">
          <table class="keywords-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Avg. Monthly Searches</th>
                <th>Competition</th>
                <th>Low Top of Page Bid</th>
                <th>High Top of Page Bid</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(idea, index) in generatedKeywords" :key="index">
                <td>{{ idea.text }}</td>
                <td>{{ idea.keywordIdeaMetrics.avgMonthlySearches }}</td>
                <td>{{ idea.keywordIdeaMetrics.competition }}</td>
                <td>{{ idea.keywordIdeaMetrics.lowTopOfPageBidMicros }}</td>
                <td>{{ idea.keywordIdeaMetrics.highTopOfPageBidMicros }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="actions-group">
          <button @click="downloadKeywords" class="download-keywords-btn">
            <i class="material-icons">download</i>
            <span>Download</span>
          </button>
          <button @click="clearResults" class="btn-secondary">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VueMultiselect from 'vue-multiselect';
import { storeToRefs } from 'pinia';
import { geminiApiService } from '../services/gemini';
import { GoogleAdsService } from '../services/googleAds';
import { useKeywordGenerationStore } from '../stores/keywordGeneration';
import type { KeywordIdea } from '../services/googleAds';

import {
  GOOGLE_ADS_LANGUAGE_MAP,
  GOOGLE_ADS_GEO_TARGET_MAP,
} from '../services/googleAdsConstants';

const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

const store = useKeywordGenerationStore();
const { form, generatedKeywords, hasGeneratedKeywords } = storeToRefs(store);
const { setGeneratedKeywords, clearKeywords, resetForm } = store;

const generateKeywords = async (): Promise<void> => {
  isLoading.value = true;
  error.value = null;
  try {
    const seedKeywords = await geminiApiService.generateSeedKeywords(store.form);
    const googleAdsService = new GoogleAdsService();
    const keywordIdeas = await googleAdsService.generateKeywordIdeas(
      seedKeywords,
      store.form.productLandingPage,
      store.form.language,
      store.form.geoTargetConstants,
    );
    setGeneratedKeywords(keywordIdeas);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error.value = errorMessage;
    alert(`Error: ${errorMessage}`);
  } finally {
    isLoading.value = false;
  }
};

const downloadKeywords = (): void => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Keyword,Avg. Monthly Searches,Competition,Low Top of Page Bid,High Top of Page Bid\n';
  generatedKeywords.value.forEach((idea: KeywordIdea) => {
    const row = [
      `"${idea.text}"`,
      idea.keywordIdeaMetrics.avgMonthlySearches,
      idea.keywordIdeaMetrics.competition,
      idea.keywordIdeaMetrics.lowTopOfPageBidMicros,
      idea.keywordIdeaMetrics.highTopOfPageBidMicros,
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'generated_keywords.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const clearResults = (): void => {
  clearKeywords();
  resetForm();
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
.generate-view {
  animation: fadeIn 0.5s ease-in-out;
}

.view-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.view-subtitle {
  font-size: 1.1rem;
  color: var(--text-color-muted);
  margin-bottom: 2rem;
}

.card {
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
  position: relative;
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

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: transparent;
  color: var(--text-color-muted);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: var(--color-background-soft);
}

.error-message {
  color: #ff4d4d;
  margin-top: 1rem;
  text-align: right;
}

.table-container {
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.keywords-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.keywords-table th,
.keywords-table td {
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  text-align: left;
}

.keywords-table th {
  background-color: var(--surface-color);
  font-weight: 600;
}

.actions-group {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.download-keywords-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: transparent;
  color: var(--text-color-muted);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-keywords-btn .material-icons {
  font-size: 20px;
}

.download-keywords-btn:hover {
  background-color: var(--surface-color);
  color: var(--text-color);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--surface-color-rgb), 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 12px;
}

.loading-overlay p {
  font-weight: 500;
  color: var(--text-color);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: var(--primary-color);
  animation: spin 1s ease infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
