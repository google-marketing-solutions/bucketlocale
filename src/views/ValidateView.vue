<template>
  <div class="localize-view">
    <h1 class="view-title">Validate Localization Results</h1>
    <p class="view-subtitle">Upload a localization job results CSV file to get started.</p>

    <div v-if="tableData.length" class="summary-card">
      <h2>Summary</h2>
      <p><strong>Total Keywords:</strong> {{ keywordCount }}</p>
      <p><strong>Localized Countries:</strong> {{ localizedCountries.join(', ') }}</p>
    </div>

    <div v-if="!jobStarted">
      <div class="card" v-if="!tableData.length">
        <div class="upload-section">
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
      </div>

      <div v-if="!isValidCsv" class="error-message">
        <p>
          Invalid CSV format. Please ensure the file contains an "Original_Term" column and at least
          one "Localized_Term_{country}" column.
        </p>
      </div>

      <div v-if="tableData.length" class="table-container">
        <table class="metrics-table">
          <thead>
            <tr>
              <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in tableData" :key="index">
              <td v-for="header in tableHeaders" :key="header">{{ row[header] }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tableData.length" class="validation-options">
        <div class="radio-group">
          <label>
            <input type="radio" v-model="validationType" value="partial" />
            Partial Validation
          </label>
          <label>
            <input type="radio" v-model="validationType" value="full" />
            Full Validation
          </label>
        </div>

        <div v-if="validationType === 'partial'" class="slider-container">
          <label for="validation-percentage"
            >Validation Percentage: {{ validationPercentage }}%</label
          >
          <input
            type="range"
            id="validation-percentage"
            min="1"
            max="100"
            v-model="validationPercentage"
          />
        </div>

        <button @click="runValidation" class="run-validation-btn" :disabled="isLoading">
          {{ isLoading ? 'Starting Validation...' : 'Run Validation' }}
        </button>
      </div>
    </div>
    <div v-if="jobStarted" class="success-section">
      <h2 class="success-title">Validation Job Started!</h2>
      <p class="success-message">
        A new batch job has been created for {{ keywordCount }} keywords and
        {{ localizedCountries.length }} countries.
      </p>
      <p class="success-message">
        To view the job progress, go to the <router-link to="/jobs">Jobs</router-link> tab.
      </p>
      <button @click="startNewValidation" class="validate-btn">Start New Validation</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Papa from 'papaparse';
import { startBatchValidation, type KeywordPair } from '../services/validation';
import { useJobsStore } from '../stores/jobs';

interface TableRow {
  [key: string]: string;
}

const jobsStore = useJobsStore();
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref<string>('');
const tableData = ref<TableRow[]>([]);
const tableHeaders = ref<string[]>([]);
const validationType = ref<string>('partial');
const validationPercentage = ref<number>(10);
const isLoading = ref(false);
const jobStarted = ref(false);

const triggerFileUpload = (): void => {
  fileInput.value?.click();
};

const keywordCount = computed(() => tableData.value.length);

const localizedCountries = computed(() => {
  return tableHeaders.value
    .filter((header) => header.startsWith('Localized_Term_'))
    .map((header) => header.replace('Localized_Term_', ''));
});

const isValidCsv = computed(() => {
  if (tableHeaders.value.length === 0) return true; // No data yet

  const hasOriginalTerm = tableHeaders.value.includes('Original_Term');
  const hasLocalizedTerm = tableHeaders.value.some((h) => h.startsWith('Localized_Term_'));

  return hasOriginalTerm && hasLocalizedTerm;
});

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.type !== 'text/csv') {
    alert('Please upload a valid CSV file.');
    return;
  }

  fileName.value = file.name;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      tableHeaders.value = results.meta.fields || [];
      tableData.value = results.data as TableRow[];
    },
  });
};

const runValidation = async () => {
  isLoading.value = true;
  try {
    let dataToValidate = tableData.value;

    if (validationType.value === 'partial') {
      const sampleSize = Math.ceil(dataToValidate.length * (validationPercentage.value / 100));
      dataToValidate = dataToValidate.slice(0, sampleSize);
    }

    const validationData: Record<string, KeywordPair[]> = {};
    const localizedColumns = tableHeaders.value.filter((h) => h.startsWith('Localized_Term_'));

    localizedColumns.forEach((column) => {
      validationData[column] = dataToValidate.map((row) => ({
        Original_Term: row['Original_Term'],
        [column]: row[column],
      }));
    });

    await startBatchValidation(validationData);
    jobsStore.fetchJobs();
    jobStarted.value = true;
  } catch (error) {
    console.error('Failed to start validation job:', error);
    alert(`Error: ${(error as Error).message}`);
  } finally {
    isLoading.value = false;
  }
};

const startNewValidation = (): void => {
  tableData.value = [];
  tableHeaders.value = [];
  fileName.value = '';
  jobStarted.value = false;
};
</script>

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

.summary-card {
  background-color: var(--surface-color);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.summary-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.summary-card p {
  font-size: 1.1rem;
  color: var(--text-color-muted);
  margin-bottom: 0.5rem;
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

.upload-btn {
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
  background: transparent;
  border: 1px solid var(--primary-color);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.file-name {
  margin-top: 1rem;
  color: var(--text-color-muted);
}

.error-message {
  background-color: #ffdddd;
  color: #d8000c;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

.table-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
}

.metrics-table th,
.metrics-table td {
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  text-align: left;
}

.metrics-table th {
  background-color: var(--surface-color);
  font-weight: 600;
}

.validation-options {
  margin-top: 2rem;
  padding: 2rem;
  background-color: var(--surface-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.radio-group {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
}

.slider-container {
  margin-bottom: 1.5rem;
}

.slider-container label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.slider-container input[type='range'] {
  width: 100%;
}

.run-validation-btn {
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
  display: block;
  width: 100%;
}

.run-validation-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
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

.validate-btn {
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
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}
</style>