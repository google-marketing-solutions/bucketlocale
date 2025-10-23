import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { KeywordGenerationForm } from '../types/forms';

const DEFAULT_FORM_STATE: KeywordGenerationForm = {
  companyName: '',
  verticalName: '',
  seedKeywordsStr: '',
  productLandingPage: '',
  userIntents: [],
  numKeywords: 100,
  companyDescription: '',
  verticalDescription: '',
  competitionLandingPagesStr: '',
  negativeKeywordsStr: '',
};


/**
 * Manages the state of the keyword generation form.
 */
export const useKeywordGenerationStore = defineStore('keywordGeneration', () => {
  const form = ref<KeywordGenerationForm>({...DEFAULT_FORM_STATE});

  function resetForm() {
    form.value = {...DEFAULT_FORM_STATE};
  }

  return { form, resetForm };
});
