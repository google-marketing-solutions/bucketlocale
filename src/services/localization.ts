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

import localizationPrompt from '../prompts/keyword_localization.txt?raw';
import type { Batch, BatchRequest, JsonSchema } from './gemini';
import { geminiApiService } from './gemini';

/**
 * Represents a locale for localization, including language and country codes.
 */
interface Locale {
  value: string;
  label: string;
  language: string;
  country: string;
}

/**
 * Splits an array into smaller chunks of a specified size.
 * @param arr The array to chunk.
 * @param size The size of each chunk.
 * @return An array of arrays, where each inner array is a chunk.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunkedArr: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunkedArr.push(arr.slice(i, i + size));
  }
  return chunkedArr;
}

/**
 * Builds the localization prompt for a given chunk of keywords and a locale.
 * @param chunk A chunk of keywords to be localized.
 * @param locale The target locale.
 * @return A formatted prompt string.
 */
function buildPrompt(chunk: string[], locale: { language: string; country: string }): string {
  let prompt = localizationPrompt;
  const replacements = {
    language: locale.language,
    country: locale.country,
    chunk_list: JSON.stringify(chunk),
  };

  for (const key in replacements) {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      const regex = new RegExp(`{${key}}`, 'g');
      prompt = prompt.replace(regex, replacements[key]);
    }
  }
  return prompt;
}

/**
 * Generates the inline requests for the batch Gemini API call.
 * @param keywords The full list of keywords to localize.
 * @param locales The list of target locales.
 * @param responseSchema The JSON schema for the expected response.
 * @return An array of request objects for the batch API.
 */
function generateInlineRequests(keywords: string[], locales: Locale[], responseSchema: JsonSchema): BatchRequest[] {
  const requests: BatchRequest[] = [];
  const keywordChunks = chunkArray(keywords, 200);

  locales.forEach((locale) => {
    keywordChunks.forEach((chunk, index) => {
      const prompt = buildPrompt(chunk, { language: locale.language, country: locale.country });
      const request = {
        request: {
          contents: [{ parts: [{ text: prompt }] }],
          generation_config: {
            response_mime_type: 'application/json',
            response_schema: responseSchema,
          },
        },
        metadata: {
          key: `${locale.language}_${locale.country}_${index}`,
        },
      };
      requests.push(request);
    });
  });

  return requests;
}

/**
 * Creates the response schema for a given country.
 * @param country The country code for the localized term field.
 * @return A JSON schema object.
 */
function createResponseSchema(country: string): JsonSchema {
  return {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        Original_Term: { type: 'STRING' },
        [`Localized_Term_${country}`]: { type: 'STRING' },
      },
      required: ['Original_Term', `Localized_Term_${country}`],
    },
  };
}

/**
 * Starts a batch localization job using the Gemini API.
 * @param keywords A list of keywords to be localized.
 * @param locales A list of locales to translate to.
 * @return A promise that resolves with the batch generation response.
 */
export async function startBatchLocalization(keywords: string[], locales: Locale[]): Promise<Batch> {
  if (!locales.length) {
    throw new Error('No locales provided for localization.');
  }
  // The schema is dependent on the country, so we assume all locales have the same country for a single batch,
  // or we handle multiple schemas if needed. For simplicity, using the first locale's country.
  const responseSchema = createResponseSchema(locales[0].country);
  const requests = generateInlineRequests(keywords, locales, responseSchema);

  const numberOfKeywords = keywords.length;
  const countries = locales.map((l) => l.country).join('-');
  const jobName = `localize_${numberOfKeywords}kw_${countries}`;

  return await geminiApiService.batchGenerateContent(requests, jobName);
}
