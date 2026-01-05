
// services/netlify.ts
import { createPreviewHtml } from '../utils/html';

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

// Step 1: Create a site
export const createNetlifySite = async (accessToken: string, siteName: string) => {
    const response = await fetch(`${NETLIFY_API_BASE}/sites`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: siteName }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create Netlify site: ${errorData.message}`);
    }
    return response.json();
};

// Step 2: Deploy the site content (using the HTML directly)
export const deployToNetlify = async (htmlContent: string, accessToken: string, siteName: string, siteId: string) => {
    const fileName = 'index.html';

    // Netlify's API requires the file content to be hashed
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlContent);
    const digest = await crypto.subtle.digest('SHA-1', data);
    const sha1 = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 1. Tell Netlify about the file and its hash
    const deployResponse = await fetch(`${NETLIFY_API_BASE}/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            files: {
                [fileName]: sha1,
            },
        }),
    });
    if (!deployResponse.ok) {
        const errorData = await deployResponse.json();
        throw new Error(`Failed to start deploy: ${errorData.message}`);
    }
    const deployData = await deployResponse.json();
    const deployId = deployData.id;

    // 2. Upload the actual file content
    const uploadResponse = await fetch(`${NETLIFY_API_BASE}/deploys/${deployId}/files/${fileName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/html',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: htmlContent,
    });

    if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${errorData}`);
    }

    // The deploy is automatically published, no need for a third "publish" step for simple sites.
    return deployData; // Contains info like the permalink
};
