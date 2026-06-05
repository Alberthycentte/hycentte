# HyCentte — AI Gig Intelligence

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Edit `.env.local` with your values:
   ```
   GEMINI_API_KEY=your_google_gemini_key
   JWT_SECRET=any_long_random_string
   OWNER_EMAIL=your@email.com
   OWNER_PASSWORD=yourpassword
   ```

3. Run:
   ```bash
   npm run dev
   ```

---

## Deploying to Vercel

> ⚠️ `.env.local` is in `.gitignore` and will NOT be pushed to GitHub.
> You must add your environment variables directly in Vercel.

### Step-by-step:

1. Push your code to GitHub (`.env.local` is excluded automatically)

2. Go to [vercel.com](https://vercel.com) → Import your GitHub repo

3. Before clicking **Deploy**, click **"Environment Variables"** and add these 4 variables:

   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | Your Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
   | `JWT_SECRET` | Any long random string (e.g. `hycentte-xyz-abc-123-secret`) |
   | `OWNER_EMAIL` | The email you want to log in with |
   | `OWNER_PASSWORD` | The password you want to log in with |

4. Click **Deploy**

### If you already deployed and need to add/change env vars:
- Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
- Add/edit the variables there
- Go to **Deployments** → click the 3 dots on latest → **Redeploy**

---

## Getting a Gemini API Key (free)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy it and paste into Vercel env vars as `GEMINI_API_KEY`

The free tier gives you **1,500 requests/day** on Gemini 1.5 Flash — more than enough.
