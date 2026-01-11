# Deployment & Monetization Guide

## 1. Deploying to the Web
Your application is built with React + Vite, making it very easy to host for free on Vercel, Netlify, or GitHub Pages.

### Option A: Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and sign up/login.
3. Click "Add New" > "Project".
4. Select your GitHub repository.
5. Vercel will detect it's a Vite project. Click **Deploy**.
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
6. Your app will be live at `https://your-project.vercel.app`.

### Option B: Netlify
1. Go to [Netlify.com](https://netlify.com).
2. "Add new site" > "Import from Git".
3. Authorize GitHub and pick your repo.
4. Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy Site**.

## 2. Setting up Google AdSense
To monetize with ads, you need a domain name (e.g., `english-practice.com`) as AdSense rarely approves subdomains (like `.vercel.app`).

1. **Buy a Domain**: Purchase a custom domain from Namecheap, GoDaddy, or Vercel directly.
2. **Connect Domain**: connect it to your hosting provider (Vercel/Netlify settings).
3. **Sign up for AdSense**:
   - Go to [Google AdSense](https://adsense.google.com).
   - Click "Get Started" and enter your website URL.
   - You will get a **Publisher ID** (e.g., `pub-123456789`).

4. **Update Code**:
   - Open `index.html` in your project.
   - Uncomment the Google AdSense script section in the `<head>`.
   - Replace `YOUR_PUBLISHER_ID` with your actual ID.
   
5. **Update ads.txt**:
   - Open `public/ads.txt`.
   - Replace `pub-0000000000000000` with your actual Publisher ID.
   - This file allows Google to verify you own the site.

## 3. Google Gemini / Cloud API Key
**IMPORTANT**: Your current Google Cloud API key for standard TTS is visible in the frontend code (`App.jsx`).
- For a public web app, this is insecure. Anyone can steal your key and use your quota.
- **Solution**:
  1. Go to Google Cloud Console > APIs & Services > Credentials.
  2. Edit your API Key constraints ("Website restrictions").
  3. Add your production domain (e.g., `https://your-app.com`) to the allowlist.
  4. This prevents the key from being used elsewhere.
