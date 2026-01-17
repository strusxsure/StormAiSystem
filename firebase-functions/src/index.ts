import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import JSZip from "jszip";
import fetch from "node-fetch";

admin.initializeApp();

export const deployToNetlify = functions.https.onCall(async (data, context) => {
  // 0. Check authentication.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // 1. Get the website content and optional siteId from the request.
  const { htmlContent, siteId: existingSiteId } = data;
  if (!htmlContent) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'htmlContent'."
    );
  }

  // 2. Zip the content.
  const zip = new JSZip();
  zip.file("index.html", htmlContent);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const netlifyToken = functions.config().netlify.token;
  if (!netlifyToken) {
    throw new functions.https.HttpsError(
      "internal",
      "Netlify token is not configured."
    );
  }

  let siteId = existingSiteId;
  let siteData;

  // 3. Create a new site on Netlify if no siteId is provided.
  if (!siteId) {
    const siteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      throw new functions.https.HttpsError(
        "internal",
        `Failed to create Netlify site: ${errorText}`
      );
    }
    siteData = await siteResponse.json();
    siteId = siteData.site_id;
  }

  // 4. Deploy the zipped content to the site.
  const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${netlifyToken}`,
      "Content-Type": "application/zip",
    },
    body: zipBuffer,
  });

  if (!deployResponse.ok) {
    const errorText = await deployResponse.text();
    throw new functions.https.HttpsError(
      "internal",
      `Failed to deploy to Netlify: ${errorText}`
    );
  }

  const deployData = await deployResponse.json();

  // 5. Return the live URL and the siteId.
  return {
    url: deployData.ssl_url,
    siteId: siteId,
  };
});
