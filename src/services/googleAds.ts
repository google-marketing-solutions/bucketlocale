import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../stores/config';
import { getAuthToken } from './auth';

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
  private readonly developerToken: string;
  private readonly mccId: string;
  private readonly apiVersion: string;
  private readonly apiEndpoint: string;

  constructor() {
    this.developerToken = config.googleAdsDeveloperToken;
    // Sanitize MCC ID by removing dashes
    this.mccId = (config.googleAdsMccId || '').replace(/-/g, '');
    this.apiVersion = API_VERSION;
    this.apiEndpoint = `https://googleads.googleapis.com/${this.apiVersion}`;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('User is not authenticated.');
    }

    if (!this.developerToken || !this.mccId) {
      throw new Error('Google Ads Developer Token and MCC ID must be configured in settings.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'developer-token': this.developerToken,
      'login-customer-id': this.mccId,
    };
  }

  /**
   * Fetches historical metrics for a list of keywords.
   * @param keywords An array of keywords to fetch metrics for.
   * @return A promise that resolves to an array of KeywordMetrics.
   */
  async getKeywordsHistoricalMetrics(
    keywords: string[],
  ): Promise<KeywordMetrics[]> {
    const url = `${this.apiEndpoint}/customers/${this.mccId}:generateKeywordHistoricalMetrics`;
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
}
