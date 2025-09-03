import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { geminiApiService, type Batch } from '../services/gemini';

interface JobMetadata {
  createTime?: string;
  // Add other metadata properties if needed
}

interface Job {
  name: string;
  done: boolean;
  metadata?: JobMetadata;
  error?: unknown;
  response?: Batch;
}

/**
 * @description Store for managing jobs.
 */
export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<Job[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref('7');
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  const filteredJobs = computed(() => {
    const now = new Date();
    const filterDays = Number(filter.value);
    if (isNaN(filterDays)) {
      return jobs.value;
    }

    return jobs.value.filter((job) => {
      if (!job.metadata?.createTime) {
        return true;
      }
      const jobDate = new Date(job.metadata.createTime);
      const diffTime = Math.abs(now.getTime() - jobDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= filterDays;
    });
  });

  async function fetchJobs() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await geminiApiService.listBatches();
      jobs.value = response.operations || [];
      startPolling();
    } catch (e: unknown) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  function startPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    pollingInterval = setInterval(async () => {
      try {
        const response = await geminiApiService.listBatches();
        const updatedJobs = response.operations || [];

        // Update existing jobs without replacing the whole array to maintain stability
        updatedJobs.forEach((updatedJob: Job) => {
          const index = jobs.value.findIndex((j) => j.name === updatedJob.name);
          if (index !== -1) {
            // Preserve the detailed response if it was already fetched
            const existingResponse = jobs.value[index].response;
            jobs.value[index] = updatedJob;
            if (existingResponse) {
              jobs.value[index].response = existingResponse;
            }
          } else {
            jobs.value.push(updatedJob);
          }
        });

        // Stop polling if all jobs are done
        if (jobs.value.every((job) => job.done)) {
          stopPolling();
        }
      } catch (err: unknown) {
        console.error('Failed to poll for job updates:', err);
      }
    }, 10000); // Poll every 10 seconds
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  async function deleteJob(jobName: string) {
    try {
      await geminiApiService.deleteBatch(jobName);
      const index = jobs.value.findIndex((j) => j.name === jobName);
      if (index !== -1) {
        jobs.value.splice(index, 1);
      }
    } catch (e: unknown) {
      error.value = (e as Error).message;
    }
  }

  async function cancelJob(jobName: string) {
    try {
      await geminiApiService.cancelBatch(jobName);
      // Automatically delete the job after cancellation
      await geminiApiService.deleteBatch(jobName);
      const index = jobs.value.findIndex((j) => j.name === jobName);
      if (index !== -1) {
        jobs.value.splice(index, 1);
      }
    } catch (e: unknown) {
      error.value = (e as Error).message;
    }
  }

  return {
    jobs: filteredJobs,
    isLoading,
    error,
    fetchJobs,
    stopPolling,
    filter,
    deleteJob,
    cancelJob,
  };
});
