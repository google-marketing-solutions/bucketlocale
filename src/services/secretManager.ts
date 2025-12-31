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

import { getAuthToken } from './auth';

interface SecretVersionAccessResponse {
  name: string;
  payload: {
    data: string;
  };
}

/**
 * Service for interacting with Google Cloud Secret Manager.
 * Allows accessing secrets stored in GCP.
 */
class SecretManagerService {
  private cache: Map<string, string> = new Map();

  /**
   * Fetches the secret payload from Secret Manager.
   * Caches successful responses in memory for the session.
   * @param resourceId The full resource name of the secret version (e.g., "projects/my-project/secrets/my-secret/versions/1" or "latest").
   * @return The decoded secret string.
   */
  async getSecret(resourceId: string): Promise<string> {
    if (!resourceId) {
      throw new Error('Secret Resource ID is required.');
    }

    if (this.cache.has(resourceId)) {
      return this.cache.get(resourceId)!;
    }

    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('User is not authenticated. Cannot access Secret Manager.');
    }

    const url = `https://secretmanager.googleapis.com/v1/${resourceId}:access`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch secret from ${resourceId}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = (await response.json()) as SecretVersionAccessResponse;

      if (!data.payload?.data) {
        throw new Error(`Secret payload is empty for ${resourceId}`);
      }

      // Secret data is base64 encoded
      const secret = atob(data.payload.data);
      this.cache.set(resourceId, secret);
      return secret;
    } catch (error) {
      console.error('Secret Manager Error:', error);
      throw error;
    }
  }

  /**
   * Clears the in-memory cache of secrets.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const secretManagerService = new SecretManagerService();
