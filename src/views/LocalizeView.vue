<template>
  <div class="localize-view">
    <h1 class="view-title">Localize Your Keywords</h1>
    <p class="view-subtitle">Upload a CSV file or generate keywords to get started.</p>

    <div class="card">
      <div v-if="!keywords.length" class="upload-section">
        <div class="button-group">
          <button @click="triggerFileUpload" class="upload-btn">Upload CSV</button>
        </div>
        <input
          type="file"
          id="csv-upload"
          @change="handleFileUpload"
          accept=".csv"
          ref="fileInput"
          hidden
        />
        <p v-if="fileName" class="file-name">Selected file: {{ fileName }}</p>
      </div>

      <div v-if="keywords.length && !jobStarted" class="results-section">
        <h2 class="results-title">Uploaded Keywords ({{ keywordCount }})</h2>
        <div v-if="forecastData" class="table-container">
          <table class="metrics-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Avg. Monthly Searches</th>
                <th>Competition</th>
                <th>Competition Index</th>
                <th>Low Top of Page Bid</th>
                <th>High Top of Page Bid</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in forecastData" :key="index">
                <td>{{ item.keyword }}</td>
                <td>{{ item.avg_monthly_searches }}</td>
                <td>{{ item.competition }}</td>
                <td>{{ item.competition_index }}</td>
                <td>{{ formatBid(item.low_top_of_page_bid) }}</td>
                <td>{{ formatBid(item.high_top_of_page_bid) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul v-else class="keyword-list">
          <li v-for="(keyword, index) in keywords" :key="index" class="keyword-item">
            {{ keyword }}
          </li>
        </ul>

        <div class="actions-group">
          <div class="tooltip-container">
            <button
              @click="getMetricsForecast"
              class="get-metrics-btn"
              :disabled="isForecastDisabled || !!forecastData"
            >
              Get Historical Metrics
            </button>
            <span v-if="isForecastDisabled" class="tooltip-text">{{ forecastDisabledReason }}</span>
          </div>
          <div v-if="isForecasting" class="loading-status">
            <div class="spinner"></div>
            <span>Getting historical metrics...</span>
          </div>

          <button @click="downloadKeywords" class="download-keywords-btn">
            <i class="material-icons">download</i>
            <span>Download</span>
          </button>
        </div>

        <div class="localization-actions">
          <VueMultiselect
            v-model="selectedLocales"
            :options="localeOptions"
            :multiple="true"
            :close-on-select="false"
            placeholder="Select locales"
            label="label"
            track-by="value"
          />
          <button @click="localizeKeywords" class="localize-btn" :disabled="isUploading">
            {{ isUploading ? 'Uploading...' : 'Localize' }}
          </button>
        </div>
        <p v-if="uploadError" class="error-message">{{ uploadError }}</p>
      </div>

      <div v-if="jobStarted" class="success-section">
        <h2 class="success-title">Localization Job Started!</h2>
        <p class="success-message">
          A new batch job has been created for {{ keywordCount }} keywords and
          {{ selectedLocales.length }} countries.
        </p>
        <p class="success-message">
          To view the job progress, go to the <router-link to="/jobs">Jobs</router-link> tab.
        </p>
        <button @click="startNewLocalization" class="generate-btn">Start New Localization</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import VueMultiselect from 'vue-multiselect';
import { useLocales } from '../stores/locales';
import { startBatchLocalization } from '../services/localization';
import { getMetricForecast } from '../services/forecast';
import type { KeywordMetrics } from '../services/googleAds';
import type { Locale } from '../stores/locales';
import { config } from '../stores/config';

const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref<string>('');
const keywords = ref<string[]>([]);
const keywordCount = ref<number>(0);
const selectedLocales = ref<Locale[]>([]);
const isUploading = ref<boolean>(false);
const uploadError = ref<string | null>(null);
const jobStarted = ref<boolean>(false);
const forecastData = ref<KeywordMetrics[] | null>(null);
const isForecasting = ref<boolean>(false);

const { locales: localeOptions } = useLocales();

const isForecastDisabled = computed(() => {
  return !config.googleAdsMccId || !config.googleAdsDeveloperToken;
});

const forecastDisabledReason = 'MCC ID and Google Ads Developer Token must be set in settings.';

const triggerFileUpload = (): void => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.type !== 'text/csv') {
    alert('Please upload a valid CSV file.');
    return;
  }

  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text
      .split(/\r\n|\n/)
      .filter((line) => line.trim() !== '')
      .map((line) => line.split(',')[0].trim());
    keywords.value = lines.slice(1);
    keywordCount.value = lines.length - 1;
  };
  reader.readAsText(file);
};

const localizeKeywords = async (): Promise<void> => {
  if (!selectedLocales.value.length) {
    alert('Please select at least one locale.');
    return;
  }
  isUploading.value = true;
  uploadError.value = null;
  try {
    await startBatchLocalization(keywords.value, selectedLocales.value);
    jobStarted.value = true;
  } catch (err: unknown) {
    uploadError.value = (err as Error).message;
    alert(`Error: ${(err as Error).message}`);
  } finally {
    isUploading.value = false;
  }
};

const startNewLocalization = (): void => {
  keywords.value = [];
  keywordCount.value = 0;
  selectedLocales.value = [];
  fileName.value = '';
  jobStarted.value = false;
};

const downloadKeywords = (): void => {
  let csvContent = 'data:text/csv;charset=utf-8,';

  if (forecastData.value) {
    const headers = [
      'Keyword',
      'Avg. Monthly Searches',
      'Competition',
      'Competition Index',
      'Low Top of Page Bid',
      'High Top of Page Bid',
    ];
    csvContent += headers.join(',') + '\n';

    forecastData.value.forEach((item: KeywordMetrics) => {
      const row = [
        item.keyword,
        item.avg_monthly_searches,
        item.competition,
        item.competition_index,
        formatBid(item.low_top_of_page_bid),
        formatBid(item.high_top_of_page_bid),
      ];
      csvContent += row.join(',') + '\n';
    });
  } else {
    csvContent += keywords.value.join('\n');
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'keywords.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getMetricsForecast = async (): Promise<void> => {
  isForecasting.value = true;
  try {
    forecastData.value = await getMetricForecast(keywords.value);
  } catch (err: unknown) {
    alert(`Error: ${(err as Error).message}`);
  } finally {
    isForecasting.value = false;
  }
};

const formatBid = (bid: string): string => {
  if (!bid || bid === '0') {
    return 'N/A';
  }
  return (parseInt(bid) / 1000000).toFixed(2);
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style scoped>
.localize-view {
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
}

.upload-section {
  text-align: center;
  padding: 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.upload-btn, .generate-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.upload-btn {
  background: transparent;
  border: 1px solid var(--primary-color);
}

.generate-btn {
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}

.upload-btn:hover, .generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.file-name {
  margin-top: 1rem;
  color: var(--text-color-muted);
}

.results-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.keyword-list {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.actions-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.get-metrics-btn {
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  background: transparent;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.get-metrics-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.get-metrics-btn:disabled {
  cursor: not-allowed;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-text {
  visibility: hidden;
  width: 200px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -100px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.keyword-item {
  padding: 0.8rem 1rem;
  background-color: var(--background-color);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.keyword-item:last-child {
  margin-bottom: 0;
}

.localization-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.localize-btn {
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

.localize-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.localize-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-section {
  text-align: center;
  padding: 2rem;
}

.success-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.success-message {
  font-size: 1.1rem;
  color: var(--text-color-muted);
  margin-bottom: 2rem;
}

.loading-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-muted);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.forecast-results-section {
  margin-top: 2rem;
}

.forecast-metrics {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-weight: 600;
  color: var(--text-color-muted);
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
}

.metrics-table th, .metrics-table td {
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  text-align: left;
}

.metrics-table th {
  background-color: var(--surface-color);
  font-weight: 600;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
</style>
