/**
 * Interface for the form used to generate keywords.
 * It defines the structure of the data collected from the user
 * to generate relevant keywords based on company and vertical information,
 * seed keywords, and other parameters.
 */
export interface KeywordGenerationForm {
  companyName: string;
  verticalName: string;
  seedKeywordsStr: string;
  productLandingPage: string;
  userIntents: string[];
  numKeywords: number;
  companyDescription: string;
  verticalDescription: string;
  competitionLandingPagesStr: string;
  negativeKeywordsStr: string;
}
