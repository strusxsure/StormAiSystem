
import { supabase } from './supabaseClient';
import { createPreviewHtml } from '../utils/html';
import JSZip from 'jszip';

interface FirebaseDeploymentResponse {
  deploymentUrl: string;
}

/**
 * Deploys a website to Firebase Hosting.
 * @param code - The React component code for the website.
 * @param apiToken - The Firebase CI access token.
 * @param projectId - The Firebase project ID.
 * @param siteName - The name of the site (used for redeployments).
 * @returns An object containing the deployment URL.
 */
export const deployToFirebase = async (
  code: string,
  apiToken: string,
  projectId: string,
): Promise<FirebaseDeploymentResponse> => {
  try {
    // 1. Generate the full HTML for the website.
    const finalHtml = createPreviewHtml(code);

    // 2. Create the firebase.json configuration file in memory.
    const firebaseConfig = {
      hosting: {
        public: 'public',
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [
          {
            source: '**',
            destination: '/index.html',
          },
        ],
      },
    };

    // 3. Create a zip file containing the necessary deployment files.
    const zip = new JSZip();
    zip.file('public/index.html', finalHtml);
    zip.file('firebase.json', JSON.stringify(firebaseConfig, null, 2));

    // Generate the zip file as a Blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Convert Blob to an ArrayBuffer, then to a plain array of bytes to make it JSON serializable
    const arrayBuffer = await zipBlob.arrayBuffer();
    const byteArray = Array.from(new Uint8Array(arrayBuffer));

    // 4. Call the Supabase Edge Function to handle the deployment.
    // This function will be created in the next step.
    const { data, error } = await supabase.functions.invoke('firebase-deploy', {
      body: {
        projectId,
        apiToken,
        zip: byteArray, // Send the zip file as a byte array
      },
    });

    if (error) {
      // Try to parse the underlying error message if available
      const errorMessage = error.context?.msg ? JSON.parse(error.context.msg).error : error.message;
      throw new Error(`Deployment failed: ${errorMessage || 'An unknown error occurred.'}`);
    }

    // 5. Return the deployment URL from the function's response.
    return {
      deploymentUrl: data.deploymentUrl,
    };

  } catch (err: any) {
    console.error('Firebase deployment service error:', err);
    // Re-throw the error so it can be caught by the modal UI
    throw err;
  }
};
