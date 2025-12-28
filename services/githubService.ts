
import { createPreviewHtml } from '../utils/html';

// Base64 encoding function for browser environment
const toBase64 = (str: string) => btoa(str);

/**
 * Deploys the generated website code to a specified GitHub repository.
 * @param code - The React component code for the website.
 * @param repoName - The full name of the repository (e.g., "username/repo-name").
 * @param token - The user's GitHub OAuth token.
 * @returns An object indicating success.
 */
export const deployToGithub = async (
  code: string,
  repoName: string,
  token: string
): Promise<{ success: boolean }> => {
  try {
    const finalHtml = createPreviewHtml(code);
    const content = toBase64(finalHtml);
    const path = 'index.html';
    const GITHUB_API_URL = `https://api.github.com/repos/${repoName}/contents/${path}`;

    // 1. Check if the file already exists to get its SHA
    let fileSha: string | undefined;
    try {
      const existingFileRes = await fetch(GITHUB_API_URL, {
        headers: {
          Authorization: `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (existingFileRes.ok) {
        const fileData = await existingFileRes.json();
        fileSha = fileData.sha;
      }
    } catch (e) {
      // If it's a 404, it means the file doesn't exist, which is fine.
      console.log("index.html doesn't exist yet. Creating a new one.");
    }

    // 2. Create or update the file
    const commitMessage = fileSha ? 'Update website from StormAi' : 'Initial website deployment from StormAi';

    const payload = {
      message: commitMessage,
      content: content,
      sha: fileSha, // Include SHA if updating an existing file
      branch: 'main', // Or whichever branch you want to target
    };

    const uploadRes = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      throw new Error(`GitHub API error: ${errorData.message}`);
    }

    return { success: true };

  } catch (err: any) {
    console.error('GitHub deployment service error:', err);
    throw err;
  }
};
