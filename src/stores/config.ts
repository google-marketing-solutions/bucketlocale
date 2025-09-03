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
  model: 'gemini-2.5-flash',
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
