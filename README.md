# BucketLocale

BucketLocale is a powerful tool designed for the **generation**, **classification**, and **localization** of keyword buckets at scale, leveraging the power of **Gemini** and **Google Ads**.

**Access the tool here:** [https://bucketlocale-ai.web.app/](https://bucketlocale-ai.web.app/)

## Features

BucketLocale offers three main capabilities to streamline your keyword strategy:

### 1. Generate
Generate high-quality keyword ideas based on your product and vertical.
-   **Input**: Company name, vertical, description, seed keywords, and landing pages.
-   **AI-Powered**: Uses **Gemini** to generate relevant seed keywords and the **Google Ads API** to expand them into a comprehensive list with metrics (search volume, competition, bids).
-   **Output**: A list of keyword ideas with detailed metrics, downloadable as CSV.

### 2. Classify
Organize your keywords into meaningful categories at scale.
-   **Batch Processing**: Upload a CSV of keywords and define custom classification categories (e.g., "Intent", "Product Feature").
-   **AI Classification**: Uses **Gemini** to classify thousands of keywords into your defined categories simultaneously.
-   **Smart Suggestions**: Can automatically generate classification suggestions based on a sample of your keywords.

### 3. Localize
Adapt your keywords for different markets and languages.
-   **Multi-Region**: Select multiple target countries and languages.
-   **Contextual Translation**: Uses **Gemini** to localize keywords while preserving their original intent and marketing nuance.

## Prerequisites

To use BucketLocale, you need to set up a Google Cloud Platform (GCP) project and configure the necessary credentials.

### 1. GCP Project Setup
-   Create a **Google Cloud Platform (GCP)** project.
-   **Enable Billing** for the project.

### 2. Enable Required APIs
Enable the following APIs in your GCP project:
-   **Vertex AI API**: For generation and classification.
-   **Google Ads API**: For keyword metrics and forecasting.
-   **Google Sheets API**: For exporting results.
-   **Secret Manager API**: For securely storing API keys and credentials.

### 3. OAuth Client ID
-   Create an **OAuth 2.0 Client ID** of type **Web application**.
-   Set it to **Internal** .
-   **Authorized JavaScript origins**: `window.location.origin` (e.g., `https://bucketlocale-ai.web.app`).
-   **Authorized redirect URIs**: `window.location.origin`.
-   **Important**: You will need to enter this **Client ID** on the Sign In page of the application.

### 4. Gemini API Key
-   Obtain a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   This key is required for the generation features.

### 5. Google Ads Configuration
To use the **Generate** feature, you need:
-   **Google Ads MCC ID** (Manager Account ID).
-   **Google Ads Developer Token**.
-   These can be entered in the application settings.

## Getting Started

1.  **Access the Tool**: Go to [https://bucketlocale-ai.web.app/](https://bucketlocale-ai.web.app/).
2.  **Sign In**: Enter your **OAuth Client ID** and sign in with your Google account.
3.  **Configure Settings**:
    -   Click the settings icon <i class="material-icons">settings</i>.
    -   Enter your **Gemini API Key**.
    -   (Optional) Enter your **Google Ads MCC ID** and **Developer Token**.
4.  **Start Working**: Use the navigation tabs to Generate, Classify, or Localize your keywords.
