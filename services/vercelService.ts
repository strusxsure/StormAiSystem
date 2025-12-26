
export interface VercelDeploymentResult {
  projectId: string;
  deploymentUrl: string;
}

// A simplified representation of the file structure Vercel expects.
export interface VercelFile {
  file: string; // File path (e.g., 'index.html')
  data: string; // File content
}

const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Deploys code to Vercel. If it's the first deployment for a project,
 * it creates a new Vercel Project. On subsequent deployments, it pushes
 * a new deployment to the existing project.
 *
 * @param htmlCode The raw HTML string to deploy.
 * @param apiToken The user's Vercel API token.
 * @param projectName A name for the Vercel project.
 * @param existingProjectId The ID of an existing Vercel project, if available.
 * @returns A promise that resolves with the project ID and the live deployment URL.
 */
export const deployToVercel = async (
  htmlCode: string,
  apiToken: string,
  projectName: string,
  existingProjectId?: string | null
): Promise<VercelDeploymentResult> => {

  let projectId = existingProjectId;

  // 1. If no project ID exists, create a new Vercel Project first.
  if (!projectId) {
    const projectResponse = await fetch(`${VERCEL_API_BASE}/v10/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        name: projectName,
        framework: null, // Important for static sites
      }),
    });

    const projectResult = await projectResponse.json();
    if (!projectResponse.ok) {
      throw new Error(projectResult.error?.message || 'Failed to create Vercel project.');
    }
    projectId = projectResult.id;
  }

  // 2. Now, create a new deployment for the project (either new or existing).
  const files: VercelFile[] = [
    { file: 'index.html', data: htmlCode },
  ];

  const deploymentPayload = {
    name: projectName, // The project name
    files: files,
    public: true, // Make the deployment public by default
    projectSettings: {
      framework: null,
    },
    target: 'production' // Deploy to production
  };

  const deploymentResponse = await fetch(`${VERCEL_API_BASE}/v13/deployments?skipAutoDetectionConfirmation=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(deploymentPayload),
  });

  const deploymentResult = await deploymentResponse.json();

  if (!deploymentResponse.ok) {
    throw new Error(deploymentResult.error?.message || 'Failed to create Vercel deployment.');
  }

  return {
    projectId: projectId!,
    deploymentUrl: `https://${deploymentResult.url}`,
  };
};
