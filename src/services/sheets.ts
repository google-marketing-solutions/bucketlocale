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

interface CreateSpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: Array<{
    properties: {
      sheetId: number;
      // Add other properties if needed
    };
  }>;
  // Add other properties if needed
}

interface SheetCell {
  userEnteredValue: {
    stringValue: string;
  };
}

interface SheetRow {
  values: SheetCell[];
}

/**
 * Service to interact with the Google Sheets API.
 */
class GoogleSheetsService {
  private readonly BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  /**
   * Creates a new Google Sheet and populates it with CSV data.
   * @param title The title of the new spreadsheet.
   * @param csvContent The CSV data as a string.
   * @param accessToken The OAuth2 access token.
   * @return The URL of the newly created spreadsheet.
   */
  async createSheet(title: string, csvContent: string, accessToken: string): Promise<string> {
    if (!csvContent) {
      throw new Error('CSV content is empty.');
    }

    const spreadsheet = await this.createEmptySheet(title, csvContent, accessToken);
    const spreadsheetId = spreadsheet.spreadsheetId;
    const sheetId = spreadsheet.sheets[0].properties.sheetId;

    await this.uploadCsvData(spreadsheetId, sheetId, csvContent, accessToken);

    return spreadsheet.spreadsheetUrl;
  }

  /**
   * Creates an empty spreadsheet with appropriate dimensions.
   */
  private async createEmptySheet(
    title: string,
    csvContent: string,
    accessToken: string,
  ): Promise<CreateSpreadsheetResponse> {
    const { rowCount, columnCount } = this.getCsvDimensions(csvContent);

    const createResponse = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            properties: {
              gridProperties: {
                rowCount: rowCount + 1, // Buffer
                columnCount: columnCount + 1, // Buffer
              },
            },
          },
        ],
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Error creating spreadsheet:', errorData);
      throw new Error(`Failed to create spreadsheet: ${errorData.error.message}`);
    }

    return createResponse.json();
  }

  /**
   * Uploads CSV data to a specific sheet.
   */
  private async uploadCsvData(
    spreadsheetId: string,
    sheetId: number,
    csvContent: string,
    accessToken: string,
  ): Promise<void> {
    const rows = this.parseCsvToRows(csvContent);

    const batchUpdateResponse = await fetch(`${this.BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        requests: [
          {
            updateCells: {
              rows,
              start: { sheetId, rowIndex: 0, columnIndex: 0 },
              fields: 'userEnteredValue',
            },
          },
        ],
      }),
    });

    if (!batchUpdateResponse.ok) {
      const errorData = await batchUpdateResponse.json();
      console.error('Error updating spreadsheet:', errorData);
      throw new Error(`Failed to upload data to spreadsheet: ${errorData.error.message}`);
    }
  }

  /**
   * Calculates the number of rows and maximum columns from CSV content.
   */
  private getCsvDimensions(csvContent: string): { rowCount: number; columnCount: number } {
    const csvRowsArray = csvContent.split('\n');
    const rowCount = csvRowsArray.length;
    const columnCount = csvRowsArray.reduce((max, row) => {
      const cols = (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).length;
      return cols > max ? cols : max;
    }, 0);
    return { rowCount, columnCount };
  }

  /**
   * Parses a CSV string into the format required by the Sheets API.
   */
  private parseCsvToRows(csvContent: string): SheetRow[] {
    return csvContent.split('\n').map((row) => {
      const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
      const cells = row.match(regex) || [];

      return {
        values: cells.map((cell) => {
          let value = cell.trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          value = value.replace(/""/g, '"');
          return {
            userEnteredValue: { stringValue: value },
          };
        }),
      };
    });
  }

  /**
   * Returns the required headers for API requests.
   */
  private getHeaders(accessToken: string): HeadersInit {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Singleton instance of the GoogleSheetsService.
 */
export const googleSheetsService = new GoogleSheetsService();
