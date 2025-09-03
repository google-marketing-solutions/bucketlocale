<template>
  <div class="jobs-view">
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    <h1 class="view-title">Jobs</h1>
    <p class="view-subtitle">Browse and manage your ongoing and completed jobs.</p>

    <div class="tabs">
      <button @click="activeTab = 'localization'" :class="{ active: activeTab === 'localization' }">
        Localization Jobs
      </button>
      <button @click="activeTab = 'validation'" :class="{ active: activeTab === 'validation' }">
        Validation Jobs
      </button>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="filter">
          <label for="time-filter">Show jobs from:</label>
          <div class="select-wrapper">
            <select id="time-filter" v-model="jobsStore.filter">
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="Infinity">All time</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="isLoading" class="loading-state">
        <p>Loading jobs...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <p>Error loading jobs: {{ error }}</p>
      </div>
      <div v-else class="job-list">
        <div class="job-item" v-for="job in filteredJobs" :key="job.name">
          <div class="job-details">
            <h3 class="job-keyword">{{ job.metadata?.displayName || job.name }}</h3>
            <p class="job-meta">Created: {{ formatDateTime(job.metadata?.createTime) }}</p>
          </div>
          <div class="job-actions">
            <button
              v-if="job.metadata?.state === 'BATCH_STATE_SUCCEEDED'"
              @click="downloadResults(job)"
              class="download-btn"
            >
              Download
            </button>
            <div v-if="sheetsLoading[job.name]" class="loader"></div>
            <button
              v-else-if="job.metadata?.state === 'BATCH_STATE_SUCCEEDED'"
              @click="openInSheets(job)"
              class="sheets-btn"
            >
              Open in Sheets
            </button>
            <button
              v-if="job.metadata?.state === 'BATCH_STATE_SUCCEEDED'"
              @click="confirmDelete(job.name)"
              class="delete-btn"
            >
              Delete
            </button>
            <button v-else @click="confirmCancel(job.name)" class="cancel-btn">Cancel</button>
            <div class="job-status" :class="getStatus(job).toLowerCase().replace(' ', '-')">
              {{ getStatus(job) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { useJobsStore, type Job } from '../stores/jobs';
import { storeToRefs } from 'pinia';
import { geminiApiService } from '../services/gemini';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { googleSheetsService } from '../services/sheets';
import { mergeBatchJobResults } from '../services/download';
import Cookies from 'js-cookie';

const jobsStore = useJobsStore();
const { jobs, isLoading, error } = storeToRefs(jobsStore);
const sheetsLoading = reactive<{ [key: string]: boolean }>({});
const activeTab = ref('localization');
const showConfirmDialog = ref(false);
const jobToAction = ref<string | null>(null);
const confirmAction = ref<'delete' | 'cancel' | null>(null);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');

const filteredJobs = computed(() => {
  if (activeTab.value === 'localization') {
    return jobs.value.filter((job) =>
      job.metadata?.displayName?.toLowerCase().includes('localize'),
    );
  } else {
    return jobs.value.filter((job) =>
      job.metadata?.displayName?.toLowerCase().includes('validate'),
    );
  }
});

function getAccessToken(): string | undefined {
  return Cookies.get('google_token');
}

function confirmDelete(jobName: string) {
  jobToAction.value = jobName;
  confirmAction.value = 'delete';
  confirmDialogTitle.value = 'Delete Job';
  confirmDialogMessage.value =
    'Are you sure you want to delete this job? This action is irreversible.';
  showConfirmDialog.value = true;
}

function confirmCancel(jobName: string) {
  jobToAction.value = jobName;
  confirmAction.value = 'cancel';
  confirmDialogTitle.value = 'Cancel Job';
  confirmDialogMessage.value = 'Are you sure you want to cancel this job?';
  showConfirmDialog.value = true;
}

function handleConfirm() {
  if (jobToAction.value) {
    if (confirmAction.value === 'delete') {
      jobsStore.deleteJob(jobToAction.value);
    } else if (confirmAction.value === 'cancel') {
      jobsStore.cancelJob(jobToAction.value);
    }
  }
  showConfirmDialog.value = false;
  jobToAction.value = null;
  confirmAction.value = null;
}

function handleCancel() {
  showConfirmDialog.value = false;
  jobToAction.value = null;
  confirmAction.value = null;
}

onMounted(() => {
  jobsStore.fetchJobs();
});

const jobStatusMap: { [key: string]: string } = {
  BATCH_STATE_PENDING: 'Pending',
  BATCH_STATE_RUNNING: 'In Progress',
  BATCH_STATE_SUCCEEDED: 'Completed',
  BATCH_STATE_FAILED: 'Failed',
  BATCH_STATE_CANCELLED: 'Cancelled',
  BATCH_STATE_EXPIRED: 'Expired',
};

function getStatus(job: Job) {
  return jobStatusMap[job.metadata?.state] || 'Unknown';
}

function formatDateTime(dateTimeString: string | undefined): string {
  if (!dateTimeString) {
    return 'Date not available';
  }
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getJobCsvContent(job: Job): Promise<string> {
  if (job.metadata?.state !== 'BATCH_STATE_SUCCEEDED') {
    throw new Error('Job has not succeeded.');
  }

  const detailedJob = await geminiApiService.getBatch(job.name);
  let csvContent = '';

  if (detailedJob.response?.inlinedResponses) {
    const responses = detailedJob.response.inlinedResponses.inlinedResponses;
    const isValidationJob = job.metadata?.displayName?.toLowerCase().includes('validate');
    csvContent = mergeBatchJobResults(responses, isValidationJob);
  } else if (detailedJob.response?.responsesFile) {
    csvContent = await geminiApiService.downloadBatchResults(detailedJob.response.responsesFile);
  } else {
    console.error('No results found for this job. Full response:', detailedJob);
    throw new Error('No results found for this job.');
  }
  return csvContent;
}

async function downloadResults(job: Job) {
  try {
    const csvContent = await getJobCsvContent(job);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = job.metadata?.displayName
      ? `${job.metadata.displayName}.csv`
      : `${job.name.replace('/', '_')}.csv`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download results:', error);
    alert(
      `Failed to download results: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
    );
  }
}

async function openInSheets(job: Job) {
  sheetsLoading[job.name] = true;
  try {
    const csvContent = await getJobCsvContent(job);
    const title = job.metadata?.displayName || `Localization Job ${job.name.split('/').pop()}`;
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert('You must be signed in to create a Google Sheet.');
      return;
    }
    const sheetUrl = await googleSheetsService.createSheet(title, csvContent, accessToken);
    window.open(sheetUrl, '_blank');
  } catch (error) {
    console.error('Failed to open in Sheets:', error);
    alert(
      `Failed to open in Sheets: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
    );
  } finally {
    sheetsLoading[job.name] = false;
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.tabs button {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-bottom 0.2s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tabs button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter label {
  font-weight: 600;
}

.filter .select-wrapper {
  position: relative;
  display: inline-block;
}

.filter select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem 2rem 0.5rem 1rem;
  font-size: 1rem;
  color: var(--text-color);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.filter select:hover {
  border-color: var(--primary-color);
}

.filter select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.filter .select-wrapper::after {
  content: '▼';
  font-size: 0.8rem;
  color: var(--text-color-muted);
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.jobs-view {
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

.job-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.job-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.job-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.job-keyword {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
}

.job-meta {
  margin: 0;
  color: var(--text-color-muted);
}

.job-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.job-status.completed {
  background-color: rgba(45, 211, 111, 0.1);
  color: #2dd36f;
}

.job-status.in-progress {
  background-color: rgba(255, 196, 9, 0.1);
  color: #ffc409;
}

.job-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.download-btn {
  background-color: var(--primary-color);
  color: var(--primary-color-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.download-btn:hover {
  background-color: var(--primary-color-dark);
}

.sheets-btn {
  background-color: #0f9d58; /* Google Sheets Green */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sheets-btn:hover {
  background-color: #0d854a;
}

.delete-btn {
  background-color: #eb445a; /* Red */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.delete-btn:hover {
  background-color: #d03b4f;
}

.cancel-btn {
  background-color: #ffc409; /* Amber */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn:hover {
  background-color: #e0a800;
}

.loader {
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #0f9d58; /* Google Sheets Green */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.job-status.pending {
  background-color: rgba(235, 68, 90, 0.1);
  color: #eb445a;
}

.job-status.failed,
.job-status.cancelled,
.job-status.expired {
  background-color: rgba(235, 68, 90, 0.1);
  color: #eb445a;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>