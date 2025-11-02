<template>
  <div class="classify-view">
    <h1 class="view-title">Classify Keywords</h1>

    <div class="card">
      <p class="view-subtitle">
        Define your classifications below, then upload a CSV with keywords to be
        classified.
      </p>

      <div
        class="upload-area"
        :class="{ 'drag-over': isDragging }"
        @click="openFileDialog"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".csv"
          style="display: none"
        />
        <div v-if="!uploadedFile" class="upload-placeholder">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="upload-icon"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>
            Drag & drop your CSV file here, or
            <span>click to browse</span>.
          </p>
        </div>
        <div v-else class="file-info">
          <p>File: {{ uploadedFile.name }}</p>
          <button @click.stop="clearFile" class="clear-btn">Clear</button>
        </div>
      </div>
      <button
        type="button"
        @click="generateClasses"
        class="submit-btn"
        :disabled="!uploadedFile || isGeneratingClasses"
      >
        {{ isGeneratingClasses ? 'Generating...' : 'Generate Classes' }}
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
              Remove
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
            :disabled="!uploadedFile"
          >
            Start Classification
          </button>
        </div>
      </form>
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

const parseCSV = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Assuming single column CSV with keywords
      const keywords = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);
      resolve(keywords);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};

const classificationGroups = ref<ClassificationGroup[]>([
  { name: '', classifications: [{ name: '', description: '' }] },
]);
const uploadedFile = ref<File | null>(null);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const isGeneratingClasses = ref(false);

const generateClasses = async (): Promise<void> => {
  if (!uploadedFile.value) {
    alert('Please upload a CSV file first.');
    return;
  }

  isGeneratingClasses.value = true;
  try {
    const keywords = await parseCSV(uploadedFile.value);
    if (!keywords.length) {
      alert('No keywords found in the CSV file.');
      return;
    }

    const suggestions = await generateClassificationSuggestions(keywords);
    if (suggestions && suggestions.length > 0) {
      // Place suggestions in the first group
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

const openFileDialog = (): void => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadedFile.value = target.files[0];
  }
};

const handleDragOver = (): void => {
  isDragging.value = true;
};

const handleDragLeave = (): void => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent): void => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    if (event.dataTransfer.files[0].type === 'text/csv') {
      uploadedFile.value = event.dataTransfer.files[0];
    } else {
      alert('Please upload a valid CSV file.');
    }
  }
};

const clearFile = (): void => {
  uploadedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
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
  if (!uploadedFile.value) {
    alert('Please upload a CSV file with keywords.');
    return;
  }

  try {
    const keywords = await parseCSV(uploadedFile.value);
    if (!keywords.length) {
      alert('No keywords found in the CSV file.');
      return;
    }

    const allClassifications = classificationGroups.value

    console.log('Starting classification for:', keywords);
    console.log('Using classifications:', allClassifications);

    const result = await startBatchClassification(keywords, allClassifications);
    console.log('Batch classification job started:', result);
    alert(
      'Batch classification job started successfully! Check the console for details.'
    );
  } catch (error) {
    console.error('Error starting batch classification:', error);
    if (error instanceof Error) {
      alert(`An error occurred: ${error.message}`);
    } else {
      alert('An unknown error occurred.');
    }
  }
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

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
  margin-bottom: 2rem;
}

.upload-area:hover,
.upload-area.drag-over {
  background-color: rgba(var(--primary-color-rgb), 0.05);
  border-color: var(--primary-color);
}

.upload-icon {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.upload-placeholder p {
  margin: 0;
  color: var(--text-color-muted);
}

.upload-placeholder span {
  color: var(--primary-color);
  font-weight: 600;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
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

.remove-btn,
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
