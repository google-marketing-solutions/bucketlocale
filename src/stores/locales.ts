import { reactive, toRefs, readonly } from 'vue';
import localesData from '../locales.json';

/**
 * Represents a single locale with its value, display label, language, and country.
 * This interface is used to structure the locale data loaded from `locales.json`
 * and prepare it for use in UI components like multi-select dropdowns.
 */
export interface Locale {
  value: string;
  label: string;
  language: string;
  country: string;
}

interface LocalesState {
  locales: Locale[];
  isLoading: boolean;
  error: string | null;
}

// A simple reactive store for locales
const state: LocalesState = reactive({
  locales: [],
  isLoading: false,
  error: null,
});

/**
 * Loads the locales from the imported JSON data.
 * Formats them for the multi-select dropdown.
 */
export function useLocales() {
  if (state.locales.length === 0) {
    state.isLoading = true;
    try {
      // Format the data for the dropdown
      state.locales = localesData.map((item: { language: string; country: string }) => ({
        value: `${item.language}_${item.country}`,
        label: `${item.language} (${item.country})`,
        language: item.language,
        country: item.country,
      }));
    } catch (e) {
      state.error = 'Failed to load locales.';
      console.error(e);
    } finally {
      state.isLoading = false;
    }
  }

  return {
    ...toRefs(readonly(state)),
  };
}

/**
 * Finds a locale by its country code.
 * @param country The country code to search for.
 * @return The locale object or undefined if not found.
 */
export function getLocaleByCountry(country: string): Locale | undefined {
  const localeData = localesData.find(
    (locale: { language: string; country: string }) => locale.country === country,
  );

  if (localeData) {
    return {
      value: `${localeData.language}_${localeData.country}`,
      label: `${localeData.language} (${localeData.country})`,
      language: localeData.language,
      country: localeData.country,
    };
  }

  return undefined;
}
