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

import { getLocaleByCountry } from '../stores/locales';
import validationPrompt from '../prompts/validation.txt?raw';
import { geminiApiService } from './gemini';
import type { Batch, BatchRequest, JsonSchema } from './gemini';


/**
 * Represents a locale for localization, including language and country codes.
 */
interface Locale {
  value: string;
  label: string;
  language: string;
  country: string;
}

interface KeywordPair {
  Original_Term: string;
  [key: string]: string | number; // For dynamic localized term, rank, and justification
  Localization_Rank?: number;
  Justification?: string;
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
 * Builds the validation prompt for a given chunk of keywords and a locale.
 * @param chunk A chunk of keyword pairs to be validated.
 * @param locale The target locale.
 * @return A formatted prompt string.
 */
function buildPrompt(chunk: KeywordPair[], locale: Locale): string {
  let prompt = validationPrompt;
  const replacements = {
    language: locale.language,
    country: locale.country,
    term_list: JSON.stringify(chunk),
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{${key}}`, 'g');
    prompt = prompt.replace(regex, value);
  }
  return prompt;
}

/**
 * Creates the response schema for a given country.
 * @param columnName The column name for the localized term field.
 * @return A JSON schema object.
 */
function createResponseSchema(columnName: string): JsonSchema {
  const termSchema = {
    type: 'OBJECT',
    properties: {
      Original_Term: { type: 'STRING' },
      [columnName]: { type: 'STRING' },
      Localization_Rank: { type: 'NUMBER' },
      Justification: { type: 'STRING' },
    },
    required: ['Original_Term', columnName],
  };

  return {
    type: 'ARRAY',
    items: termSchema,
  };
}

/**
 * Generates the inline requests for the batch Gemini API call.
 * @param validationData The data to be validated.
 * @return An array of request objects for the batch API.
 */
function generateInlineRequests(validationData: Record<string, KeywordPair[]>): BatchRequest[] {
  const requests: BatchRequest[] = [];

  for (const [columnName, keywordPairs] of Object.entries(validationData)) {
    const country = columnName.split('_').pop();
    if (!country) continue;

    const locale = getLocaleByCountry(country);
    if (!locale) continue;

    const chunks = chunkArray(keywordPairs, 200);

    chunks.forEach((chunk, index) => {
      const prompt = buildPrompt(chunk, locale);
      const responseSchema = createResponseSchema(columnName);
      const request = {
        request: {
          contents: [{ parts: [{ text: prompt }] }],
          generation_config: {
            response_mime_type: 'application/json',
            response_schema: responseSchema,
          },
        },
        metadata: {
          key: `${country}_${index}`,
        },
      };
      requests.push(request);
    });
  }

  return requests;
}

/**
 * Starts a batch validation job using the Gemini API.
 * @param validationData A dictionary where keys are country-specific column names
 *                       and values are arrays of keyword pairs.
 * @return A promise that resolves with the batch generation response.
 */
export async function startBatchValidation(validationData: Record<string, KeywordPair[]>): Promise<Batch> {
  const requests = generateInlineRequests(validationData);
  if (!requests.length) {
    throw new Error('No valid data provided for validation.');
  }

  const countries = Object.keys(validationData)
    .map((col) => col.split('_').pop())
    .join('-');
  const numberOfKeywords = validationData[Object.keys(validationData)[0]].length;
  const jobName = `validate_${numberOfKeywords}kw_${countries}`;

  return await geminiApiService.batchGenerateContent(requests, jobName);
}
