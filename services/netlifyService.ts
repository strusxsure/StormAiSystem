import JSZip from 'jszip';

export interface NetlifyDeploymentResult {
  siteId: string;
  deploymentUrl: string;
}

export interface NetlifyFile {
  file: string;
  data: string;
}

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

const createZipFile = async (htmlCode: string): Promise<Blob> => {
  const zip = new JSZip();
  zip.file('index.html', htmlCode);
  return await zip.generateAsync({ type: 'blob' });
};

const arrayBufferToObj = (buffer: ArrayBuffer) => {
    const uint8Array = new Uint8Array(buffer);
    const obj = {
        type: 'Buffer',
        data: Array.from(uint8Array)
    };
    return obj;
};


export const deployToNetlify = async (
  htmlCode: string,
  accessToken: string,
  projectName: string,
  existingSiteId?: string | null
): Promise<NetlifyDeploymentResult> => {
  const zipFile = await createZipFile(htmlCode);
  const zipFileBuffer = await zipFile.arrayBuffer();

  // Reference your Supabase Function URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/netlify-deploy`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      projectName,
      existingSiteId,
      zipFileBuffer: arrayBufferToObj(zipFileBuffer),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage = `Failed to deploy: ${response.statusText}`;
    if (errorData.errors?.subdomain?.[0]?.includes('must be unique')) {
      errorMessage = 'This project name is already taken. Please choose a different one.';
    } else if (errorData.message) {
      errorMessage = `Deployment failed: ${errorData.message}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result;
};
