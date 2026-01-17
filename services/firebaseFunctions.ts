
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseClient'; // Ensure you have access to the initialized Firebase app

const functions = getFunctions(app);

/**
 * Calls the 'deployToNetlify' Firebase Cloud Function.
 * @param htmlContent The HTML content of the website to deploy.
 * @param siteId The existing Netlify site ID, if available.
 * @returns An object containing the new site's ID and live URL.
 */
export const deployToNetlify = async (htmlContent: string, siteId?: string | null): Promise<{ url: string, siteId: string }> => {
  const deployFunction = httpsCallable(functions, 'deployToNetlify');

  try {
    const result = await deployFunction({ htmlContent, siteId });
    const data = result.data as { url: string, siteId: string };
    if (!data.url || !data.siteId) {
        throw new Error("The cloud function did not return a valid URL and site ID.");
    }
    return data;
  } catch (error) {
    console.error("Firebase function call failed:", error);
    throw new Error('Deployment failed. Please check the backend logs for more details.');
  }
};
