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

import { ref } from 'vue';

/**
 * Interface for representing a user's profile information.
 * This is used to store and display the logged-in user's picture, name, and email.
 */
export interface UserProfile {
  picture: string;
  name: string;
  email: string;
}

/**
 * A simple reactive store for user profile data.
 * This ref holds the current user's profile information, including their
 * picture, name, and email, making it globally accessible and reactive
 * throughout the application.
 */
export const userProfile = ref<UserProfile>({
  picture: '',
  name: '',
  email: '',
});

/**
 * Updates the reactive userProfile object with new data.
 * @param {object} profile - The user profile object from Google.
 */
export function setUserProfile(profile: Partial<UserProfile>): void {
  if (profile) {
    userProfile.value.picture = profile.picture || '';
    userProfile.value.name = profile.name || '';
    userProfile.value.email = profile.email || '';
  }
}

/**
 * Initializes the user profile from localStorage on app startup.
 */
export function initializeUserProfile(): void {
  const storedProfile = localStorage.getItem('user_profile');
  if (storedProfile) {
    setUserProfile(JSON.parse(storedProfile));
  }
}
