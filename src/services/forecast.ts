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

import { GoogleAdsService, type KeywordMetrics } from './googleAds';

const CHUNK_SIZE = 1000;

/**
 * Chunks an array into smaller arrays of a specified size.
 * @param arr - The array to chunk.
 * @param size - The size of each chunk.
 * @return An array of chunks.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

/**
 * Get metric forecast for a list of keywords.
 * @param keywords - The list of keywords to get the forecast for.
 * @return The metric forecast data.
 */
export async function getMetricForecast(keywords: string[]): Promise<KeywordMetrics[]> {
  const googleAdsService = new GoogleAdsService();
  const keywordChunks = chunkArray(keywords, CHUNK_SIZE);
  let allMetrics: KeywordMetrics[] = [];

  for (const chunk of keywordChunks) {
    try {
      const metrics = await googleAdsService.getKeywordsHistoricalMetrics(chunk);
      allMetrics = allMetrics.concat(metrics);
      // Add a small delay between requests to avoid rate limiting issues
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error fetching metrics for chunk:', chunk, error);
      // For chunks that fail, we'll add default metrics for each keyword in the chunk
      const defaultMetrics: KeywordMetrics[] = chunk.map((keyword) => ({
        keyword,
        avg_monthly_searches: '0',
        competition: 'UNKNOWN',
        competition_index: '0',
        low_top_of_page_bid: '0',
        high_top_of_page_bid: '0',
      }));
      allMetrics = allMetrics.concat(defaultMetrics);
    }
  }

  // Ensure all original keywords are present in the final list
  const returnedKeywords = new Set(allMetrics.map((m) => m.keyword));
  for (const keyword of keywords) {
    if (!returnedKeywords.has(keyword)) {
      allMetrics.push({
        keyword,
        avg_monthly_searches: '0',
        competition: 'UNKNOWN',
        competition_index: '0',
        low_top_of_page_bid: '0',
        high_top_of_page_bid: '0',
      });
    }
  }

  return allMetrics;
}
