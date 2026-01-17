// services/api.ts

/**
 * Calls the Netlify serverless function to deploy a website.
 * @param htmlContent The HTML content of the website to deploy.
 * @param siteId The existing Netlify site ID, if available.
 * @returns An object containing the new site's ID and live URL.
 */
export const deployToNetlify = async (htmlContent: string, siteId?: string | null): Promise<{ url: string, siteId: string }> => {
  try {
    const response = await fetch('/.netlify/functions/deployToNetlify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ htmlContent, siteId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Deployment failed');
    }

    const data = await response.json();
    if (!data.url || !data.siteId) {
        throw new Error("The Netlify function did not return a valid URL and site ID.");
    }
    return data;
  } catch (error) {
    console.error("Netlify function call failed:", error);
    throw new Error(error.message || 'Deployment failed. Please check the function logs for more details.');
  }
};
