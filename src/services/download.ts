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

interface BatchJobResponse {
  response?: {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text: string;
        }>;
      };
    }>;
  };
  metadata?: {
    key?: string;
  };
}

interface MergedItem {
  Original_Term: string;
  [key: string]: string | number | undefined; // For dynamic keys like Localized_Term_XX, Localization_Rank_XX, Justification_XX
}

/**
 * Merges the results of a batch job into a single CSV string.
 * @param responses The array of responses from the batch job.
 * @param isValidationJob A boolean to indicate if the job is a validation job.
 * @param isClassificationJob A boolean to indicate if the job is a classification job.
 * @return A CSV formatted string.
 */
export function mergeBatchJobResults(
  responses: BatchJobResponse[],
  isValidationJob: boolean,
  isClassificationJob = false
): string {
  if (isClassificationJob) {
    const classificationResults: Array<{ [key: string]: string }> = [];
    const headers = new Set<string>();
    headers.add('Keyword');

    responses.forEach((r) => {
      if (r.response?.candidates?.[0]?.content?.parts?.[0]) {
        try {
          const text = r.response.candidates[0].content.parts[0].text;
          const cleanedText = text.replace(/^```json\s*|```\s*$/g, '');
          const data = JSON.parse(cleanedText);
          if (data && Array.isArray(data)) {
            data.forEach((item) => {
              Object.keys(item).forEach((key) => headers.add(key));
              classificationResults.push(item);
            });
          }
        } catch (e) {
          const key = r.metadata?.key || 'unknown key';
          console.error(`Error parsing JSON for key ${key}:`, e);
          console.error('Problematic text:', r.response.candidates[0].content.parts[0].text);
        }
      }
    });

    const sortedHeaders = Array.from(headers).sort((a, b) => {
      if (a === 'Keyword') return -1;
      if (b === 'Keyword') return 1;
      return a.localeCompare(b);
    });

    const csvRows = [sortedHeaders.join(',')];
    classificationResults.forEach((row) => {
      const csvRow = sortedHeaders
        .map((header) => {
          const value = row[header];
          const finalValue = value === undefined || value === null ? '' : value;
          const escapedValue = String(finalValue).replace(/"/g, '""');
          return `"${escapedValue}"`;
        })
        .join(',');
      csvRows.push(csvRow);
    });
    return csvRows.join('\n');
  } else {
    const merged: { [key: string]: { [key: string]: string | number | undefined } } = {};
    const countries = new Set<string>();

    responses.forEach((r) => {
      if (r.response?.candidates?.[0]?.content?.parts?.[0]) {
        try {
          const text = r.response.candidates[0].content.parts[0].text;
          // The text can be a JSON string with ```json ... ``` markdown, so we need to strip it.
          const cleanedText = text.replace(/^```json\s*|```\s*$/g, '');
          const data = JSON.parse(cleanedText);

          if (!data || !Array.isArray(data)) return;

          const key = r.metadata?.key;
          if (!key) return;
          const keyParts = key.split('_');
          const countryFromMeta = isValidationJob ? keyParts[0] : keyParts[1];

          data.forEach((item: MergedItem) => {
            const originalTerm = item.Original_Term;
            if (!originalTerm) return;

            if (!merged[originalTerm]) {
              merged[originalTerm] = { Original_Term: originalTerm };
            }

            const itemLocalizedKey = Object.keys(item).find((k) => k.startsWith('Localized_Term_'));

            if (itemLocalizedKey) {
              const countryFromKey = isValidationJob
                ? itemLocalizedKey.replace('Localized_Term_', '')
                : countryFromMeta;
              countries.add(countryFromKey);

              const localizedTermKey = `Localized_Term_${countryFromKey}`;
              merged[originalTerm][localizedTermKey] = item[itemLocalizedKey];

              if (isValidationJob) {
                const rankKey = `Localization_Rank_${countryFromKey}`;
                const justificationKey = `Justification_${countryFromKey}`;
                merged[originalTerm][rankKey] = item.Localization_Rank;
                merged[originalTerm][justificationKey] = item.Justification;
              }
            }
          });
        } catch (e) {
          const key = r.metadata?.key || 'unknown key';
          console.error(`Error parsing JSON for key ${key}:`, e);
          console.error('Problematic text:', r.response.candidates[0].content.parts[0].text);
        }
      }
    });

    const sortedCountries = Array.from(countries).sort((a, b) => a.localeCompare(b));
    const sortedHeaders = ['Original_Term'];
    sortedCountries.forEach((country) => {
      sortedHeaders.push(`Localized_Term_${country}`);
      if (isValidationJob) {
        sortedHeaders.push(`Localization_Rank_${country}`);
        sortedHeaders.push(`Justification_${country}`);
      }
    });

    const csvRows = [sortedHeaders.join(',')];

    Object.values(merged).forEach((row) => {
      const csvRow = sortedHeaders
        .map((header) => {
          const value = row[header] === undefined || row[header] === null ? '' : row[header];
          // Escape double quotes and wrap in double quotes
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        })
        .join(',');
      csvRows.push(csvRow);
    });

    return csvRows.join('\n');
  }
}
