# One-Time Setup for Netlify Deployment

To enable the "Deploy to Netlify" feature, you only need to do this one simple setup task once.

This process is completely secure. Your secret token will be stored safely in your Netlify account settings and will not be visible in the code.

## Steps:

1.  **Get your Netlify Personal Access Token:**
    *   Log in to your Netlify account.
    *   Go to **User settings > Applications**.
    *   Under **Personal access tokens**, click **"New access token"**.
    *   Give it a description (like "StormAI Deployment") and click **"Generate token"**.
    *   **Important:** Copy the token immediately. You will not be able to see it again.

2.  **Add the Token to your StormAI Site on Netlify:**
    *   Go to your StormAI project's dashboard on Netlify.
    *   Navigate to **Site configuration > Build & deploy > Environment**.
    *   Click **"Edit variables"**.
    *   Add a new variable:
        *   **Key:** `NETLIFY_AUTH_TOKEN`
        *   **Value:** Paste the token you copied in Step 1.
    *   Click **"Save"**.

That's it! The backend is now fully configured. The "Deploy to Netlify" button in your application will now work seamlessly.
