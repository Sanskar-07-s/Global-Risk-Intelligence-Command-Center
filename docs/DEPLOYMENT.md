# GRICC Deployment Guide

This guide covers deployment options for the frontend and backend services of GRICC.

---

## 1. Local Development
```bash
# 1. Install all root and subproject dependencies
npm install
npm install --prefix frontend
pip install -r backend/requirements.txt

# 2. Run backend & frontend concurrently
npm run dev
```

---

## 2. Production Docker Deployment (Backend)
The Python backend is packaged as an optimized container image suitable for **Google Cloud Run** or standard container runners.

```bash
docker build -t gricc-backend ./backend
docker run -d -p 8000:8000 --env-file backend/.env gricc-backend
```

---

## 3. Frontend Deployment (Firebase Hosting / Vercel)
```bash
cd frontend
npm run build
# Deploy 'dist/' folder to Firebase Hosting or Vercel
firebase deploy --only hosting
```
