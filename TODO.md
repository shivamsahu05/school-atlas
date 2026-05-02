# SAMS School Web - Critical Fixes TODO

## ✅ Phase 1: Core Production Fixes (Approved)

### 1. ✅ Vercel SPA Routing Fix
- ✅ Created `frontend/vercel.json`
- [ ] Deploy to Vercel: `npx vercel --prod`
- [ ] Test: Refresh `/admin`, `/login` → no 404

### 2. ✅ API Endpoint Fix
- [ ] Add `VITE_API_URL=https://school-atlas-sams.onrender.com/api` to Vercel env vars
- ✅ Created `frontend/.env.example` template
- [ ] Test: Login → POST /api/auth/login succeeds

### 3. ✅ Remove Hardcoded Credentials
- ✅ Verified `frontend/src/pages/Login.jsx` - already clean (fillDemo commented, no creds shown)
- ✅ Test: No creds visible in source ✓

## 🔄 Progress Tracking
- After each step: Mark [✅] + run tests
- Final: `attempt_completion` when Phase 1 complete

## 📋 Deployment Commands
```
# Frontend
cd frontend
npm run build
npx vercel --prod

# Backend (if needed)
cd backend
npm start
```

## 🚀 Next: Deploy & Test
1. Vercel deploy with vercel.json + VITE_API_URL env var
2. Test login + route refresh
3. Mark complete
```


