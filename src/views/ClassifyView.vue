<template>
  <div class="classify-view">
    <h1 class="view-title">Classify Keywords</h1>

    <div class="card">
      <p class="view-subtitle">
        Upload a keyword CSV, and then define one or more classification categories.
      </p>

      <div v-if="jobStarted" class="success-section">
        <h2 class="success-title">Classification Job Started!</h2>
        <p class="success-message">
          A new batch job has been created for {{ keywords.length }} keywords and
          {{ classificationGroups.length }} categories.
        </p>
        <p class="success-message">
          To view the job progress, go to the <router-link to="/jobs">Jobs</router-link> tab.
        </p>
        <button @click="startNewClassification" class="generate-btn">Start New Classification</button>
      </div>

      <div v-else>
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

      <div v-else class="results-section">
        <h2 class="results-title">Uploaded Keywords ({{ keywords.length }})</h2>
        <ul class="keyword-list">
          <li v-for="(keyword, index) in keywords" :key="index" class="keyword-item">
            {{ keyword }}
          </li>
        </ul>
      </div>
      <button
        type="button"
        @click="generateClasses"
        class="submit-btn"
        :disabled="!keywords.length || isGeneratingClasses"
        title="Generates the classifications for the first category based on randomly selected keywords from the uploaded list."
      >
        {{ isGeneratingClasses ? 'Generating...' : 'Generate First Category' }}
      </button>
      <div class="divider"></div>
      <form @submit.prevent="submitClassifications">
        <div
          v-for="(group, groupIndex) in classificationGroups"
          :key="groupIndex"
          class="classification-category"
        >
          <div class="category-header">
            <input
              type="text"
              v-model="group.name"
              placeholder="Category Name"
              class="category-input"
            />
            <button
              type="button"
              @click="removeCategory(groupIndex)"
              class="remove-category-btn"
            >
              Remove Category
            </button>
          </div>
          <div
            v-for="(classification, classIndex) in group.classifications"
            :key="classIndex"
            class="classification-group"
          >
            <input
              type="text"
              v-model="classification.name"
              placeholder="Classification Name"
              class="classification-input"
            />
            <textarea
              v-model="classification.description"
              placeholder="Description"
              class="classification-textarea"
            ></textarea>
            <button
              type="button"
              @click="removeClassification(groupIndex, classIndex)"
              class="remove-btn"
            >
              &#x2715;
            </button>
          </div>
          <button
            type="button"
            @click="addClassification(groupIndex)"
            class="add-btn"
          >
            Add Classification
          </button>
        </div>
        <div class="form-actions">
          <button type="button" @click="addCategory" class="add-btn">
            Add Category
          </button>
          <button
            type="submit"
            class="submit-btn"
            :disabled="!keywords.length"
          >
            Start Classification
          </button>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  startBatchClassification,
  generateClassificationSuggestions,
  type Classification,
  type Category
} from '../services/classification';

interface ClassificationGroup {
  name: string;
  classifications: Classification[];
}


const classificationGroups = ref<ClassificationGroup[]>([
  { name: '', classifications: [{ name: '', description: '' }] },
]);
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref<string>('');
const keywords = ref<string[]>([]);
const isGeneratingClasses = ref(false);
const jobStarted = ref<boolean>(false);

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
  };
  reader.readAsText(file);
};

const generateClasses = async (): Promise<void> => {
  if (!keywords.value.length) {
    alert('Please upload a CSV file with keywords.');
    return;
  }

  isGeneratingClasses.value = true;
  try {
    const suggestions = await generateClassificationSuggestions(keywords.value);
    if (suggestions && suggestions.length > 0) {
      classificationGroups.value[0].classifications = suggestions;
    } else {
      alert('Could not generate any classification suggestions.');
    }
  } catch (error) {
    console.error('Error generating classification suggestions:', error);
    if (error instanceof Error) {
      alert(`An error occurred while generating suggestions: ${error.message}`);
    } else {
      alert('An unknown error occurred while generating suggestions.');
    }
  } finally {
    isGeneratingClasses.value = false;
  }
};

const addCategory = (): void => {
  classificationGroups.value.push({
    name: '',
    classifications: [{ name: '', description: '' }],
  });
};

const removeCategory = (groupIndex: number): void => {
  classificationGroups.value.splice(groupIndex, 1);
};

const addClassification = (groupIndex: number): void => {
  classificationGroups.value[groupIndex].classifications.push({
    name: '',
    description: '',
  });
};

const removeClassification = (groupIndex: number, classIndex: number): void => {
  classificationGroups.value[groupIndex].classifications.splice(classIndex, 1);
};

const submitClassifications = async (): Promise<void> => {
  if (!keywords.value.length) {
    alert('Please upload a CSV file with keywords.');
    return;
  }

  for (const group of classificationGroups.value) {
    if (!group.name.trim()) {
      alert('Category name cannot be empty.');
      return;
    }
  }

  try {
    const allClassifications = classificationGroups.value

    console.log('Starting classification for:', keywords.value);
    console.log('Using classifications:', allClassifications);

    await startBatchClassification(keywords.value, allClassifications);
    jobStarted.value = true;
  } catch (error) {
    console.error('Error starting batch classification:', error);
    if (error instanceof Error) {
      alert(`An error occurred: ${error.message}`);
    } else {
      alert('An unknown error occurred.');
    }
  }
};

const startNewClassification = (): void => {
  keywords.value = [];
  fileName.value = '';
  classificationGroups.value = [{ name: '', classifications: [{ name: '', description: '' }] }];
  jobStarted.value = false;
};
</script>

<style scoped>
.classify-view {
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
  margin-left: auto;
  margin-right: auto;
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

.generate-btn {
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

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
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

.divider {
  text-align: center;
  margin: 2rem 0;
  font-weight: 600;
  color: var(--text-color-muted);
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 2rem);
  height: 1px;
  background-color: var(--border-color);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.card {
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.classification-category {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.category-input {
  width: 50%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.remove-category-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: #b71c1c;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.classification-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.classification-input,
.classification-textarea {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 1rem;
}

.classification-textarea {
  min-height: 80px;
  resize: vertical;
}

.add-btn,
.submit-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.remove-btn {
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 24px;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.remove-btn:hover {
  background-color: #c62828;
}

.add-btn {
  background: transparent;
  border: 1px solid var(--primary-color);
}

.submit-btn {
  background: linear-gradient(
    90deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
}

.remove-btn:hover,
.add-btn:hover,
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
