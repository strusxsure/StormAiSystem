
export interface VercelDeployment {
  url: string;
  // Add other relevant fields from the Vercel API response if needed
}

// A simplified representation of the file structure Vercel expects.
export interface VercelFile {
  file: string; // File path (e.g., 'index.html')
  data: string; // File content
}

const VERCEL_API_URL = 'https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1';

/**
 * Deploys the given HTML code to Vercel.
 *
 * @param htmlCode The raw HTML string to deploy.
 * @param apiToken The user's Vercel API token.
 * @param projectName A name for the Vercel project.
 * @returns A promise that resolves with the deployment object, including the live URL.
 */
export const deployToVercel = async (
  htmlCode: string,
  apiToken: string,
  projectName: string = 'stormai-generated-site'
): Promise<VercelDeployment> => {

  // 1. Prepare the file structure for the Vercel API.
  const files: VercelFile[] = [
    {
      file: 'index.html',
      data: htmlCode,
    },
    {
      file: 'package.json',
      data: JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
      }),
    },
  ];

  // 2. Construct the request payload.
  const payload = {
    name: projectName,
    files: files,
    // We are deploying a static site, so no build configuration is needed.
    // Vercel will automatically detect and serve the index.html.
  };

  // 3. Make the API request to Vercel.
  const response = await fetch(VERCEL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  // 4. Handle the response.
  if (!response.ok) {
    // Vercel provides helpful error messages.
    const errorMessage = result.error?.message || 'Failed to deploy to Vercel.';
    throw new Error(errorMessage);
  }

  // The URL will have a "-xxxx.vercel.app" format.
  return {
    url: `https://${result.url}`,
  };
};
