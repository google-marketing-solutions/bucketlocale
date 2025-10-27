import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { KeywordGenerationForm } from '../types/forms';
import type { KeywordIdea } from '../services/googleAds';

const DEFAULT_FORM_STATE: KeywordGenerationForm = {
  companyName: '',
  verticalName: '',
  seedKeywordsStr: '',
  productLandingPage: '',
  userIntents: [],
  companyDescription: '',
  verticalDescription: '',
  competitionLandingPagesStr: '',
  negativeKeywordsStr: '',
  language: 'languageConstants/1000',
  geoTargetConstants: ['geoTargetConstants/2840'],
};


/**
 * Manages the state of the keyword generation form.
 */
export const useKeywordGenerationStore = defineStore('keywordGeneration', () => {
  const form = ref<KeywordGenerationForm>({ ...DEFAULT_FORM_STATE });
  const generatedKeywords = ref<KeywordIdea[]>([]);
  const hasGeneratedKeywords = computed(() => generatedKeywords.value.length > 0);

  function setGeneratedKeywords(keywords: KeywordIdea[]) {
    generatedKeywords.value = keywords;
  }

  function clearKeywords() {
    generatedKeywords.value = [];
  }

  function resetForm() {
    form.value = { ...DEFAULT_FORM_STATE };
  }

  return {
    form,
    generatedKeywords,
    hasGeneratedKeywords,
    setGeneratedKeywords,
    clearKeywords,
    resetForm,
  };
});
