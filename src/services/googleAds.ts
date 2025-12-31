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

import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../stores/config';
import { getAuthToken } from './auth';
import { secretManagerService } from './secretManager';

const API_VERSION = 'v21';

/**
 * Represents the historical metrics for a keyword.
 */
export interface KeywordMetrics {
  keyword: string;
  avg_monthly_searches: string;
  competition: string;
  competition_index: string;
  low_top_of_page_bid: string;
  high_top_of_page_bid: string;
}

/**
 * Represents a keyword idea from the Google Ads API.
 */
export interface KeywordIdea {
  text: string;
  keywordIdeaMetrics: {
    avgMonthlySearches: string;
    competition: string;
    competitionIndex: string;
    lowTopOfPageBidMicros: string;
    highTopOfPageBidMicros: string;
  };
}

interface GoogleAdsApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

interface KeywordHistoricalMetricsResult {
  text: string;
  keywordMetrics?: {
    avgMonthlySearches?: string;
    competition?: string;
    competitionIndex?: string;
    lowTopOfPageBidMicros?: string;
    highTopOfPageBidMicros?: string;
  };
}

/**
 * Service class for interacting with the Google Ads API.
 */
export class GoogleAdsService {
  private readonly apiVersion: string;
  private readonly apiEndpoint: string;

  constructor() {
    this.apiVersion = API_VERSION;
    this.apiEndpoint = `https://googleads.googleapis.com/${this.apiVersion}`;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('User is not authenticated.');
    }

    let developerToken = config.googleAdsDeveloperToken;
    if (config.useSecretManager) {
      if (!config.googleClientId) {
        throw new Error('Google Client ID is missing. Cannot derive Project Number for Secret Manager.');
      }
      const projectNumber = config.googleClientId.split('-')[0];
      if (!projectNumber) {
        throw new Error('Invalid Google Client ID format. Cannot derive Project Number.');
      }
      const resourceId = `projects/${projectNumber}/secrets/google_ads_developer_token/versions/latest`;
      developerToken = await secretManagerService.getSecret(resourceId);
    }
    const mccId = (config.googleAdsMccId || '').replace(/-/g, '');

    if (!developerToken || !mccId) {
      throw new Error('Google Ads Developer Token and MCC ID must be configured in settings.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'developer-token': developerToken,
      'login-customer-id': mccId,
    };
  }

  /**
   * Fetches historical metrics for a list of keywords.
   * @param keywords An array of keywords to fetch metrics for.
   * @return A promise that resolves to an array of KeywordMetrics.
   */
  async getKeywordsHistoricalMetrics(keywords: string[]): Promise<KeywordMetrics[]> {
    const customerId = (config.googleAdsMccId || '').replace(/-/g, '');
    if (!customerId) {
      throw new Error('Google Ads MCC ID must be configured in settings.');
    }
    const url = `${this.apiEndpoint}/customers/${customerId}:generateKeywordHistoricalMetrics`;
    const headers = await this.getHeaders();

    const payload = {
      keywords,
      keywordPlanNetwork: 'GOOGLE_SEARCH',
    };

    const axiosOptions: AxiosRequestConfig = { headers };

    try {
      const response: AxiosResponse = await axios.post(url, payload, axiosOptions);

      return response.data.results.map((result: KeywordHistoricalMetricsResult) => {
        const metrics = result.keywordMetrics;
        return {
          keyword: result.text,
          avg_monthly_searches: metrics?.avgMonthlySearches || '0',
          competition: metrics?.competition || 'UNKNOWN',
          competition_index: metrics?.competitionIndex || '0',
          low_top_of_page_bid: metrics?.lowTopOfPageBidMicros || '0',
          high_top_of_page_bid: metrics?.highTopOfPageBidMicros || '0',
        };
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as GoogleAdsApiError;
        if (errorData?.error) {
          throw new Error(
            `Google Ads API error: ${errorData.error.message} (Status: ${errorData.error.status})`,
          );
        }
      }
      throw new Error('An unknown error occurred while fetching keyword metrics.');
    }
  }

  async generateKeywordIdeas(
    seedKeywords: string[],
    pageUrl?: string,
    language?: string,
    geoTargetConstants?: string[],
  ): Promise<KeywordIdea[]> {
    const customerId = (config.googleAdsMccId || '').replace(/-/g, '');
    if (!customerId) {
      throw new Error('Google Ads MCC ID must be configured in settings.');
    }
    const url = `${this.apiEndpoint}/customers/${customerId}:generateKeywordIdeas`;
    const headers = await this.getHeaders();

    const seed = pageUrl
      ? { keywordAndUrlSeed: { url: pageUrl, keywords: seedKeywords } }
      : { keywordSeed: { keywords: seedKeywords } };

    const payload = {
      language: language || 'languageConstants/1000', // English
      geoTargetConstants: geoTargetConstants || ['geoTargetConstants/2840'], // United States
      includeAdultKeywords: false,
      keywordPlanNetwork: 'GOOGLE_SEARCH',
      ...seed,
    };

    const axiosOptions: AxiosRequestConfig = { headers };

    try {
      const response: AxiosResponse = await axios.post(url, payload, axiosOptions);
      return response.data.results.filter((idea: KeywordIdea) => idea.keywordIdeaMetrics);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as GoogleAdsApiError;
        if (errorData?.error) {
          throw new Error(
            `Google Ads API error: ${errorData.error.message} (Status: ${errorData.error.status})`,
          );
        }
      }
      throw new Error('An unknown error occurred while generating keyword ideas.');
    }
  }
}

/**
 * Singleton instance of the GoogleAdsService.
 * Use this instance to interact with the Google Ads API throughout the application.
 */
export const googleAdsService = new GoogleAdsService();
