
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

// --- INITIALIZATION ---

admin.initializeApp();
const db = admin.firestore();

// IMPORTANT: These credentials must be configured in your Firebase project's environment variables.
// I will provide instructions on how to do this in the next step.
const CLIENT_ID = functions.config().oauth.client_id;
const CLIENT_SECRET = functions.config().oauth.client_secret;
// This is the URL of our callback function. It must be added to the Authorized Redirect URIs
// in your Google Cloud OAuth 2.0 Client ID settings.
const REDIRECT_URI = `https://us-central1-${process.env.GCP_PROJECT}.cloudfunctions.net/oauthcallback`;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform.read-only', // To list Firebase projects
    'https://www.googleapis.com/auth/firebase.deployment'      // To deploy to Firebase Hosting
];

// --- 1. AUTHENTICATION FUNCTIONS ---

/**
 * Initiates the OAuth 2.0 flow.
 * Redirects the user to Google's consent screen.
 * The 'state' parameter is used to pass the Stormai user's ID through the flow.
 */
exports.auth = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).send('Missing userId query parameter.');
        }

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Required to get a refresh token
            scope: SCOPES,
            prompt: 'consent', // Ensures the user is always prompted, which is good for getting a refresh token
            state: userId,   // Pass the original user's ID
        });
        return res.redirect(authUrl);
    });
});

/**
 * Handles the callback from Google's consent screen.
 * Exchanges the authorization code for an access token and a refresh token.
 * Securely saves the refresh token to the user's profile in Firestore.
 */
exports.oauthcallback = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        const { code, state } = req.query;
        const userId = state; // The userId we passed in the 'auth' function

        if (!code || !userId) {
            return res.status(400).send('Missing code or state in callback.');
        }

        try {
            const { tokens } = await oauth2Client.getToken(code);
            const refreshToken = tokens.refresh_token;

            if (!refreshToken) {
                // This can happen if the user has already granted consent and is not re-prompted.
                return res.status(400).send('Refresh token not received. Please try connecting again and ensure you grant all permissions.');
            }

            // Save the refresh token securely in the user's profile
            const userProfileRef = db.collection('profiles').doc(userId);
            await userProfileRef.update({
                firebase_refresh_token: refreshToken,
            });

            // Redirect the user back to the app with a success message
            // You will need to handle this redirect on your frontend.
            return res.redirect('https://stormiiai.netlify.app/#/deploy-success');

        } catch (error) {
            console.error('Error getting token:', error.message);
            return res.status(500).send('Authentication failed.');
        }
    });
});


// --- 2. PROJECT LISTING FUNCTION ---

/**
 * Fetches the Firebase projects for a given user.
 * Uses the stored refresh token to authenticate with the Google API.
 */
exports.getFirebaseProjects = functions.https.onCall(async (data, context) => {
    const userId = context.auth.uid;
    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    try {
        const userProfile = await db.collection('profiles').doc(userId).get();
        const refreshToken = userProfile.data().firebase_refresh_token;

        if (!refreshToken) {
            throw new functions.https.HttpsError('failed-precondition', 'Firebase account not connected.');
        }

        const tempClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
        tempClient.setCredentials({ refresh_token: refreshToken });

        const resourceManager = google.cloudresourcemanager('v1');
        const response = await resourceManager.projects.list({
            auth: tempClient,
            filter: 'lifecycleState=ACTIVE',
        });

        // Filter projects that are Firebase projects
        const firebaseProjects = [];
        for (const project of response.data.projects) {
             const firebaseUrl = `https://firebase.googleapis.com/v1beta1/projects/${project.projectId}`;
             const firebaseRes = await fetch(firebaseUrl, {
                headers: { 'Authorization': `Bearer ${await tempClient.getAccessToken()}` }
             });
             if (firebaseRes.ok) {
                firebaseProjects.push({
                    id: project.projectId,
                    name: project.name,
                });
             }
        }
        return firebaseProjects;

    } catch (error) {
        console.error('Error fetching projects:', error.message);
        throw new functions.https.HttpsError('internal', 'Could not fetch Firebase projects.');
    }
});


// --- 3. DEPLOYMENT FUNCTION ---

/**
 * Deploys the generated website to the user's selected Firebase project.
 */
exports.deployToFirebase = functions.https.onCall(async (data, context) => {
    const userId = context.auth.uid;
    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { projectId, htmlContent } = data;
    if (!projectId || !htmlContent) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing projectId or htmlContent.');
    }

    try {
        const userProfile = await db.collection('profiles').doc(userId).get();
        const refreshToken = userProfile.data().firebase_refresh_token;

        if (!refreshToken) {
            throw new functions.https.HttpsError('failed-precondition', 'Firebase account not connected.');
        }

        const tempClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
        tempClient.setCredentials({ refresh_token: refreshToken });
        const accessToken = await tempClient.getAccessToken();

        const siteId = projectId; // In Firebase, the default site ID is the same as the project ID.

        // 1. Create a new version for the site
        const versionUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`;
        const versionRes = await fetch(versionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ config: { rewrites: [{ glob: '**', function: 'app' }] } }), // Simple config
        });
        const versionData = await versionRes.json();
        if (!versionRes.ok) throw new Error(`Failed to create version: ${versionData.error.message}`);
        const versionName = versionData.name;

        // 2. Specify the files to upload (just index.html)
        const populateUrl = `${versionUrl}/${versionName.split('/').pop()}:populateFiles`;
        const populateRes = await fetch(populateUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: { '/index.html': Buffer.from(htmlContent).toString('base64') } }),
        });
        const populateData = await populateRes.json();
        if (!populateRes.ok) throw new Error(`Failed to specify files: ${populateData.error.message}`);

        // 3. Finalize the version
        const finalizeUrl = `${versionUrl}/${versionName.split('/').pop()}?update_mask=status`;
        await fetch(finalizeUrl, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'FINALIZED' }),
        });

        // 4. Release the version to the live channel
        const releaseUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=${versionName}`;
        await fetch(releaseUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken.token}` },
        });

        const deploymentUrl = `https://${siteId}.web.app`;
        return { deploymentUrl };

    } catch (error) {
        console.error('Deployment failed:', error.message);
        throw new functions.https.HttpsError('internal', 'Deployment failed.');
    }
});
