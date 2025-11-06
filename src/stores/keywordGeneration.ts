/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

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
  geoTargetConstants: [],
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
