/**
 * Interface for the form used to generate keywords.
 * It defines the structure of the data collected from the user
 * to generate relevant keywords based on company and vertical information,
 * seed keywords, and other parameters.
 */
export interface KeywordGenerationForm {
  companyName: string;
  verticalName: string;
  companyDescription: string;
  verticalDescription: string;
  seedKeywordsStr: string;
  productLandingPage: string;
  competitionLandingPagesStr: string;
  userIntents: string[];
  negativeKeywordsStr: string;
  language: string;
  geoTargetConstants: string[];
}
