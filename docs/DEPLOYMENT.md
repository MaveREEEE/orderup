# OrderUP Deployment Guide

## Pre-Deployment Checklist

### 1. Security
- [ ] Remove sensitive data from `.env` file before committing
- [ ] Use `.env.example` for configuration template
- [ ] Rotate JWT_SECRET in production
- [ ] Use strong MongoDB Atlas credentials
- [ ] Enable MongoDB IP whitelist
- [ ] Set Stripe keys to production keys (not test keys)

### 2. Backend Deployment

#### Environment Setup
```bash
cd backend
npm install --production
```

#### Configuration
Create a `.env` file in the backend root with:
```
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=4000
NODE_ENV=production
```

#### Deploy to Cloud (Heroku example)
```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=your_uri JWT_SECRET=your_secret STRIPE_SECRET_KEY=your_key
```

Or use Render/Railway/Vercel for Node.js hosting.

### 3. Frontend Deployment

#### Build the frontend
```bash
cd frontend
npm install --production
npm run build
```

#### Deploy to Vercel/Netlify
**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Or set up GitHub Actions for automated deployment.

### 4. Admin Panel Deployment

#### Build the admin
```bash
cd admin
npm install --production
npm run build
```

Deploy the `dist` folder to the same hosting as frontend or separate subdomain.

### 5. Environment Variables

**Backend (.env):**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/OrderUP
JWT_SECRET=your_production_secret
STRIPE_SECRET_KEY=sk_live_xxxxx
PORT=4000
NODE_ENV=production
```

**Frontend (create `.env.production` or configure in build):**
```
VITE_API_URL=https://your-backend-domain.com
```

**Admin (create `.env.production`):**
```
VITE_API_URL=https://your-backend-domain.com
```

### 6. Database

- [ ] Backup MongoDB before deployment
- [ ] Run any pending migrations
- [ ] Clean up development/test data

### 7. Build Verification

```bash
# Backend - test start
npm start

# Frontend - verify build works
npm run build && npm run preview

# Admin - verify build works
npm run build && npm run preview
```

### 8. Post-Deployment

- [ ] Test all critical user flows
- [ ] Verify authentication works
- [ ] Check image uploads
- [ ] Test payment processing (if implemented)
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure SSL/TLS certificates

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Deploy Backend
        run: |
          cd backend
          npm ci --only=production
          # Add your deployment command
      
      - name: Deploy Frontend
        run: |
          cd frontend
          npm ci
          npm run build
          # Add your deployment command
```

## Troubleshooting

### Backend Issues
- Check logs: `heroku logs --tail`
- Verify MongoDB connection: Test URI in MongoDB Atlas
- Check CORS settings in `server.js`

### Frontend Issues
- Clear browser cache
- Check API URL in requests
- Verify build output in `dist` folder

### Image Upload Issues
- Ensure `/uploads` directory exists on server
- Check file permissions
- Verify multer configuration

## Performance Optimization

- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Use production build flag (`NODE_ENV=production`)
- [ ] Enable caching headers
- [ ] Minify/compress images before upload

## Monitoring & Logging

- [ ] Set up application monitoring (e.g., Sentry)
- [ ] Configure server logging
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Set up alerts for critical errors
