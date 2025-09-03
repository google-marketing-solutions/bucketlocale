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

import Cookies from 'js-cookie';
import type { Router } from 'vue-router';
import { setUserProfile, type UserProfile } from '../stores/user';

// Assuming the Google Identity Services library is loaded, which defines this global.
interface GoogleAccountsOAuth2 {
  initTokenClient: (config: TokenClientConfig) => TokenClient;
  revoke: (token: string, done: () => void) => void;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (tokenResponse: GoogleTokenResponse) => void;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare const google: {
  accounts: {
    oauth2: GoogleAccountsOAuth2;
  };
};

// Define a more specific type for the token response
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  // Add other properties if needed, e.g., scope, token_type
}

async function fetchUserProfile(accessToken: string): Promise<void> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch user info: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const profile = await response.json();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setUserProfile(profile); // Update the reactive store
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Re-throw to allow UI to handle the error, e.g., show a notification
    throw error;
  }
}

let tokenClient: TokenClient | null = null;
let resolveTokenPromise: ((token: string | null) => void) | null = null;
let rejectTokenPromise: ((error: Error) => void) | null = null;

/**
 * Initializes the Google Token Client.
 * This function sets up the Google Identity Services client with the necessary
 * configuration, including the client ID, scopes, and a callback function
 * to handle the token response. It also handles cases where the client ID is
 * not configured or the Google Identity Services library is not loaded.
 * @param router The Vue router instance to navigate on successful sign-in.
 * @param clientId The Google Cloud client ID.
 */
export function initGoogleTokenClient(router: Router, clientId: string): void {
  if (!clientId) {
    console.error('Google Client ID not configured.');
    return;
  }
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    console.error('Google Identity Services library not loaded or initialized.');
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope:
      'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/adwords',
    callback: (tokenResponse: GoogleTokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        const expiresInSeconds = tokenResponse.expires_in;
        const expires = new Date(new Date().getTime() + expiresInSeconds * 1000);
        Cookies.set('google_token', tokenResponse.access_token, { expires });
        Cookies.set('google_token_expires_at', expires.getTime().toString(), { expires });
        if (resolveTokenPromise) {
          resolveTokenPromise(tokenResponse.access_token);
          resolveTokenPromise = null;
          rejectTokenPromise = null;
        } else {
          fetchUserProfile(tokenResponse.access_token)
            .then(() => {
              router.push({ name: 'localize' });
            })
            .catch((error) => {
              console.error('Failed to process sign-in:', error);
            });
        }
      } else {
        console.error('Authentication failed: No access token received in response.');
        if (rejectTokenPromise) {
          rejectTokenPromise(new Error('Authentication failed'));
          resolveTokenPromise = null;
          rejectTokenPromise = null;
        }
      }
    },
  });
}

/**
 * Requests a Google access token.
 * This function initiates the Google OAuth 2.0 flow to obtain an access token.
 * It should be called when a user action triggers the sign-in process.
 * It will fail if the token client has not been initialized.
 */
export function requestGoogleToken(): void {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    console.error('Token client not initialized. Cannot request access token.');
  }
}

/**
 * Gets the current authentication token.
 * It first checks for a valid, non-expired token in the browser cookies.
 * If a valid token is not found, it attempts to silently refresh the token
 * using the initialized Google Token Client.
 * @return A promise that resolves with the access token or null if unavailable.
 */
export function getAuthToken(): Promise<string | null> {
  const token = Cookies.get('google_token');
  const expiresAt = Cookies.get('google_token_expires_at');

  if (token && expiresAt) {
    const buffer = 5 * 60 * 1000; // 5-minute buffer
    if (new Date().getTime() < Number(expiresAt) - buffer) {
      return Promise.resolve(token);
    }
  }

  return new Promise((resolve, reject) => {
    resolveTokenPromise = resolve;
    rejectTokenPromise = reject;
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'none' });
    } else {
      console.error('Token client not initialized.');
      reject('Token client not initialized.');
    }
  });
}

/**
 * Signs the user out.
 * This function revokes the Google OAuth token, clears all authentication-related
 * data from cookies and local storage, resets the user profile in the store,
 * and redirects the user to the sign-in page.
 * @param router The Vue router instance to navigate on sign-out.
 */
export function signOut(router: Router): void {
  const token = Cookies.get('google_token');
  if (token && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    google.accounts.oauth2.revoke(token, () => {
      console.log('Google token revoked');
    });
  }

  Cookies.remove('google_token');
  Cookies.remove('google_token_expires_at');
  localStorage.removeItem('user_profile');
  setUserProfile({} as UserProfile); // Clear the user profile from the store

  router.push({ name: 'signin' });
}
