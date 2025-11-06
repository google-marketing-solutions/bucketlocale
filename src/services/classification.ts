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

import classificationPrompt from '../prompts/keyword_classification.txt?raw';
import classGenerationPrompt from '../prompts/class_generation.txt?raw';
import { geminiApiService, type Batch, type BatchRequest, type JsonSchema, } from './gemini';

/**
 * Represents a classification rule, including its name and description.
 */
export interface Classification {
  name: string;
  description: string;
}

/**
 * Represents a Category rule, including its name and Classification.
 */
export interface Category {
  name: string;
  classifications: Classification[];
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
 * Builds the classification prompt for a given chunk of keywords and classifications.
 * @param prompt the prompt template.
 * @param replacements the values to integrate into the prompt template.
 * @return A formatted prompt string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(prompt: string, replacements: any): string {
  for (const key in replacements) {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      const regex = new RegExp(`{${key}}`, 'g');
      prompt = prompt.replace(regex, JSON.stringify(replacements[key]));
    }
  }
  return prompt;
}

/**
 * Generates the inline requests for the batch Gemini API call.
 * @param keywords The full list of keywords to classify.
 * @param classifications The list of classification rules.
 * @param responseSchema The JSON schema for the expected response.
 * @return An array of request objects for the batch API.
 */
function generateInlineRequests(
  keywords: string[],
  classifications: Category[],
  responseSchema: JsonSchema
): BatchRequest[] {
  const requests: BatchRequest[] = [];
  const keywordChunks = chunkArray(keywords, 200);

  keywordChunks.forEach((chunk, index) => {
    const prompt = buildPrompt(classificationPrompt, { chunk_list: chunk, classification_rules: classifications });
    const request: BatchRequest = {
      request: {
        contents: [{ parts: [{ text: prompt }] }],
        generation_config: {
          response_mime_type: 'application/json',
          response_schema: responseSchema,
        },
      },
      metadata: {
        key: `classification_${index}`,
      },
    };
    requests.push(request);
  });

  return requests;
}

/**
 * Creates the response schema for the classification task.
 * @return A JSON schema object.
 */
function createResponseSchema(categories: Category[]): JsonSchema {
  const categoriesProperties = categories.reduce((acc, { name, classifications }) => {

    const enums = classifications.map(
      (classification) => classification.name
    );
    acc[name] = { type: 'STRING', enum: enums };
    return acc;
  }, {} as Record<string, { type: 'STRING'; enum: string[] }>); // Updated type for clarity

  const requiredProperties = ['Keyword', ...categories.map(({ name }) => name)];

  return {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        Keyword: { type: 'STRING' },
        ...categoriesProperties,
      },
      required: requiredProperties,
    },
  };
}

/**
 * Starts a batch classification job using the Gemini API.
 * @param keywords A list of keywords to be classified.
 * @param classifications A list of classification rules.
 * @return A promise that resolves with the batch generation response.
 */
export async function startBatchClassification(
  keywords: string[],
  classifications: Category[]
): Promise<Batch> {
  if (!classifications.length) {
    throw new Error('No classifications provided.');
  }


  const responseSchema = createResponseSchema(classifications);
  const requests = generateInlineRequests(keywords, classifications, responseSchema);

  const numberOfKeywords = keywords.length;
  const jobName = `classify_${numberOfKeywords}kw`;
  return await geminiApiService.batchGenerateContent(requests, jobName);
}

/**
 * Generates classification suggestions based on a list of keywords.
 * @param keywords A list of keywords to generate suggestions from.
 * @return A promise that resolves with an array of suggested classifications.
 */
export async function generateClassificationSuggestions(
  keywords: string[]
): Promise<Classification[]> {
  const shuffled = [...keywords].sort(() => 0.5 - Math.random());
  const selectedKeywords = shuffled.slice(0, 100);

  const prompt = buildPrompt(classGenerationPrompt, { keyword_list: selectedKeywords.join(', ') });

  const responseSchema: JsonSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        description: { type: 'STRING' },
      },
      required: ['name', 'description'],
    },
  };

  const result = await geminiApiService.generateContent(
    prompt,
    responseSchema
  );
  return result as Classification[];
}
