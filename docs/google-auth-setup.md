# Google OAuth 2.0 Setup Guide

This guide provides step-by-step instructions for configuring Google Sign-In for the School Admission CRM.

---

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top of the page and select **New Project**.
3. Enter a Project Name (e.g., `School-Admission-CRM`) and click **Create**.
4. Select your newly created project.

---

## 2. Configure OAuth Consent Screen

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** as the User Type and click **Create**.
3. Fill in the required fields:
   - **App Name**: `School Admission CRM`
   - **User Support Email**: Select your email address.
   - **Developer Contact Information**: Enter your email address.
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**.
7. Under **Test Users**, add your email address for local testing, then click **Save and Continue**.

---

## 3. Create OAuth 2.0 Client ID

1. In the left navigation menu, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Set **Application Type** to **Web application**.
4. Set **Name** to `School Admission CRM Web Client`.

---

## 4. Set Authorized JavaScript Origins & Redirect URIs

Add your development and production domains to **Authorized JavaScript origins**:

- `http://localhost:5173` (Vite Default Frontend Port)
- `http://localhost:3000`
- `http://localhost:5001`
- `https://your-production-domain.com` (Your Production Domain)

Click **Create**. You will receive your **Client ID** (e.g., `1047648392019-xxx.apps.googleusercontent.com`).

---

## 5. Add Client ID to Environment Variables

### Frontend Environment File (`frontend/.env`)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5001/api/v1
```

### Backend Environment File (`backend/.env`)

```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
JWT_SECRET=super_secret_crm_jwt_token_key_123!
```

---

## 6. Restart Application

After updating the `.env` files, restart both frontend and backend development servers:

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

Your Google Authentication is now 100% active and live!
