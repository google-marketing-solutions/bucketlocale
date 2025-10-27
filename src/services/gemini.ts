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

import keywordGenerationPrompt from '../prompts/keyword_generation.txt?raw';
import { config } from '../stores/config';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Interfaces for API clarity
interface ContentPart {
  text: string;
}

interface Content {
  role: 'user' | 'model';
  parts: ContentPart[];
}

interface JsonSchema {
  type: string;
  properties?: { [key: string]: JsonSchema };
  items?: JsonSchema;
  required?: string[];
  // Add other common JSON schema properties as needed
}

interface GenerationConfig {
  response_mime_type: 'application/json' | 'text/plain';
  response_schema?: JsonSchema;
}

interface BatchRequest {
  request: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    generation_config: {
      response_mime_type: 'application/json';
      response_schema: JsonSchema;
    };
  };
  metadata: {
    key: string;
  };
}

/**
 * Interface for the form used to generate keywords.
 * It defines the structure of the data collected from the user
 * to generate relevant keywords based on company and vertical information,
 * seed keywords, and other parameters.
 */
export interface KeywordGenerationFormData {
  userIntents: string[];
  companyName: string;
  verticalName: string;
  seedKeywordsStr: string;
  productLandingPage: string;
  companyDescription?: string;
  verticalDescription?: string;
  competitionLandingPagesStr?: string;
  negativeKeywordsStr?: string;
}

interface Batch {
  name: string;
  displayName: string;
  state: string; // e.g., 'COMPLETED', 'RUNNING'
  createTime: string;
  completionTime: string;
  inputConfig: {
    requests: {
      requests: BatchRequest[];
    };
  };
  outputConfig: {
    uri: string;
  };
  // Add other batch properties as needed
}

interface ContentPart {
  text: string;
}

interface Content {
  role: 'user' | 'model';
  parts: ContentPart[];
}

interface GenerateContentRequest {
  contents: Content[];
  generation_config: GenerationConfig;
}

interface Candidate {
  content: Content;
  finishReason: string;
  // Add other candidate properties if needed
}

interface GenerateContentResponse {
  candidates: Candidate[];
}

class GeminiApiService {
  private getApiKey(): string {
    const { geminiApiKey } = config;
    if (!geminiApiKey || !geminiApiKey.trim()) {
      throw new Error('Gemini API key is not configured in settings.');
    }
    return geminiApiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'POST' | 'GET' | 'DELETE',
    body?: unknown,
  ): Promise<T> {
    const apiKey = this.getApiKey();
    const url = `${GEMINI_API_BASE_URL}/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        let message = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorDetails = JSON.parse(responseText);
          message = errorDetails.error?.message || message;
        } catch (_e) {
          // Use responseText if it's not JSON
          message = responseText || message;
        }
        throw new Error(message);
      }

      return JSON.parse(responseText) as T;
    } catch (error) {
      console.error(`Gemini API request failed: ${error}`);
      throw error; // Re-throw after logging
    }
  }

  async generateContent(prompt: string, responseSchema?: JsonSchema): Promise<string | object> {
    const { model } = config;
    if (!model) throw new Error('Gemini model is not configured in settings.');

    const endpoint = `models/${model}:generateContent`;

    const requestBody: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generation_config: {
        response_mime_type: responseSchema ? 'application/json' : 'text/plain',
        ...(responseSchema && { response_schema: responseSchema }),
      },
    };

    const data = await this.makeRequest<GenerateContentResponse>(endpoint, 'POST', requestBody);
    const part = data.candidates?.[0]?.content?.parts?.[0];

    if (!part) {
      throw new Error('Invalid response structure from API.');
    }

    return responseSchema ? JSON.parse(part.text) : part.text;
  }

  async batchGenerateContent(requests: BatchRequest[], displayName: string): Promise<Batch> {
    const { model } = config;
    if (!model) throw new Error('Gemini model is not configured in settings.');

    const endpoint = `models/${model}:batchGenerateContent`;

    const requestBody = {
      batch: {
        display_name: displayName,
        input_config: {
          requests: {
            requests,
          },
        },
      },
    };

    return this.makeRequest(endpoint, 'POST', requestBody);
  }

  private buildKeywordGenerationPrompt(formData: KeywordGenerationFormData): string {
    let prompt = keywordGenerationPrompt;
    const intentsString = formData.userIntents.length
      ? formData.userIntents.join(', ')
      : 'all types';
    const replacements: { [key: string]: string } = {
      company_name: formData.companyName,
      vertical_name: formData.verticalName,
      seed_keywords_str: formData.seedKeywordsStr,
      product_landing_page: formData.productLandingPage,
      target_intents: intentsString,
      company_description_section: formData.companyDescription
        ? `- Company/Product Description: ${formData.companyDescription}`
        : '',
      vertical_description_section: formData.verticalDescription
        ? `- Vertical/Product Description: ${formData.verticalDescription}`
        : '',
      competition_section: formData.competitionLandingPagesStr
        ? `- Key Competitor Landing Pages (analyze for competitive keywords):\n  ${formData.competitionLandingPagesStr.replace(/\n/g, '\n  ')}`
        : '',
      negative_keywords_section: formData.negativeKeywordsStr
        ? `- Negative Keywords to Avoid: ${formData.negativeKeywordsStr}`
        : '',
    };
    for (const key in replacements) {
      if (Object.prototype.hasOwnProperty.call(replacements, key)) {
        prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), String(replacements[key]));
      }
    }
    return prompt.replace(/\n\s*\n/g, '\n\n').trim();
  }

  async generateSeedKeywords(formData: KeywordGenerationFormData): Promise<string[]> {
    const prompt = this.buildKeywordGenerationPrompt(formData);
    const responseSchema: JsonSchema = {
      type: 'ARRAY',
      items: { type: 'STRING' }
    };
    const result = (await this.generateContent(prompt, responseSchema)) as string[];
    return result || [];
  }

  async listBatches(): Promise<{ batches: Batch[] }> {
    return this.makeRequest('batches?pageSize=1000', 'GET');
  }

  async getBatch(name: string): Promise<Batch> {
    // Name includes 'batches/...' so we don't add it here.
    return this.makeRequest(name, 'GET');
  }

  async downloadBatchResults(fileName: string): Promise<string> {
    const apiKey = this.getApiKey();
    const url = `https://generativelanguage.googleapis.com/download/v1beta/${fileName}:download?alt=media`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Failed to download batch results: ${responseText}`);
    }
    return responseText;
  }

  async deleteBatch(name: string): Promise<object> {
    return this.makeRequest(`${name}`, 'DELETE');
  }

  async cancelBatch(name: string): Promise<object> {
    return this.makeRequest(`${name}:cancel`, 'POST');
  }
}

/**
 * Singleton instance of the GeminiApiService.
 * Use this instance to interact with the Gemini API throughout the application.
 */
export const geminiApiService = new GeminiApiService();
