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

import { reactive } from 'vue';

const CONFIG_STORAGE_KEY = 'bucketlocale_config';

/**
 * Interface defining the structure of the application's configuration.
 * This includes API keys and identifiers needed to interact with various
 * services like Gemini and Google Ads. The configuration is loaded from
 * and saved to local storage.
 */
export interface Config {
  model: string;
  geminiApiKey: string;
  googleClientId: string;
  googleAdsDeveloperToken: string;
  googleAdsMccId: string;
}

// Default configuration
const defaultConfig: Config = {
  model: 'gemini-1.5-flash',
  geminiApiKey: '',
  googleClientId: '',
  googleAdsDeveloperToken: '',
  googleAdsMccId: '',
};

/**
 * A reactive store for managing the application's configuration.
 * This object holds settings such as API keys, model selection, and Google Ads
 * identifiers, making them globally accessible and reactive throughout the application.
 * The configuration can be loaded from and saved to local storage.
 */
export const config: Config = reactive({ ...defaultConfig });

/**
 * Loads the configuration from localStorage.
 * If no config is found, it initializes with default values.
 */
export function loadConfig(): void {
  const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (storedConfig) {
    Object.assign(config, JSON.parse(storedConfig));
  } else {
    // Initialize with defaults if nothing is stored
    Object.assign(config, defaultConfig);
  }
}

/**
 * Saves the current configuration to localStorage.
 * @param {object} newConfig - The new configuration object to save.
 */
export function saveConfig(newConfig: Partial<Config>): void {
  Object.assign(config, newConfig);
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
