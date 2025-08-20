# 🚀 Deploy Tennis Tournament App to Vercel

## ✅ **Updated Configuration**

The `vercel.json` has been fixed to work properly with Expo projects. The framework detection issue has been resolved.

## 📋 **Step-by-Step Deployment Guide**

### **Step 1: Connect to Vercel**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/login** with your GitHub account
3. **Click "New Project"**

### **Step 2: Import Your Repository**

1. **Find your repository**: `tennis-tournament-app`
2. **Click "Import"**
3. **Configure the project**:
   - **Project Name**: `tennis-tournament-app` (or your preferred name)
   - **Framework Preset**: Leave as **"Other"** (Vercel will auto-detect)
   - **Root Directory**: Leave as `/` (root)
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `web-build`

### **Step 3: Configure Environment Variables**

**IMPORTANT**: Add these environment variables in Vercel:

1. **Go to Project Settings** → **Environment Variables**
2. **Add the following variables**:

```
EXPO_PUBLIC_SUPABASE_URL=https://apttvxzslzlgxmdvtuhe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Replace `your_anon_key_here`** with your actual Supabase anon key from your `.env` file.

### **Step 4: Deploy**

1. **Click "Deploy"**
2. **Wait for the build to complete** (usually 2-3 minutes)
3. **Your app will be live** at `https://your-project-name.vercel.app`

## 🔧 **Troubleshooting**

### **If you get framework detection errors:**

1. **Make sure you're using the latest code** from GitHub
2. **The `vercel.json` has been updated** to fix this issue
3. **Try deploying again** - it should work now

### **If build fails:**

1. **Check the build logs** in Vercel dashboard
2. **Ensure environment variables are set correctly**
3. **Verify your Supabase URL and key are correct**

### **If the app doesn't load:**

1. **Check the browser console** for errors
2. **Verify Supabase connection** in the Network tab
3. **Ensure all environment variables are set**

## 🎯 **After Deployment**

### **Test Your Web App**

Once deployed, test these features:

- ✅ **Sign in** with master user: `taimoorzulfiqar97@gmail.com` / `TechPM@321`
- ✅ **Create tournaments**
- ✅ **View leaderboards**
- ✅ **Test responsive design** on mobile browsers
- ✅ **Create new users** (admin functionality)

### **Share Your App**

Your tennis club members can now access the app via:

- 🌐 **Web browsers**: Desktop, tablet, mobile
- 📱 **Mobile apps**: iOS and Android (when built)
- 🔗 **Direct link**: Share the Vercel URL

## 🔄 **Future Updates**

To update your deployed app:

1. **Make changes locally**
2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. **Vercel will automatically redeploy** (if connected to GitHub)

## 📞 **Support**

If you encounter any issues:

1. **Check the Vercel build logs**
2. **Verify your environment variables**
3. **Ensure your Supabase database is running**
4. **Test locally first** with `npm run web`

---

**Your Tennis Tournament App is now ready for production! 🎾✨**
