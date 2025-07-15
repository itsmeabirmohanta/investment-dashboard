# Deployment Guide

This guide covers how to deploy Investment Dashboard to various hosting platforms.

## Prerequisites

- Node.js (v18 or higher)
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Firebase project configured
- Production environment variables ready

## Build Process

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   - Create production environment file or configure in hosting platform
   - Ensure all Firebase config variables are set

3. **Build for production**
   ```bash
   npm run build
   ```

## Firebase Hosting (Recommended)

### Initial Setup
1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase in your project**
   ```bash
   firebase init hosting
   ```

3. **Configure firebase.json** (already configured)

### Deploy
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with custom message
firebase deploy --only hosting -m "Deploy version 1.0.0"
```

### Custom Domain
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. SSL certificate is automatically provisioned

## Vercel Deployment

### Using Vercel CLI
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Using GitHub Integration
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Auto-deploy on every push to main branch

### Environment Variables (Vercel)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Netlify Deployment

### Using Netlify CLI
1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Using Git Integration
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## GitHub Pages

### Using GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Environment Variables Setup

### Development (.env)
```env
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-dev-auth-domain
VITE_FIREBASE_PROJECT_ID=your-dev-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-dev-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
VITE_FIREBASE_APP_ID=your-dev-app-id
```

### Production
Use the same variable names but with production Firebase project values.

## Post-Deployment Checklist

- [ ] Verify all Firebase services are connected
- [ ] Test user authentication
- [ ] Test data persistence
- [ ] Check responsive design on different devices
- [ ] Verify SSL certificate is active
- [ ] Test all investment modules
- [ ] Check console for errors
- [ ] Verify analytics tracking (if enabled)

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Build with specific mode
npm run build -- --mode production
```

### Firebase Performance
1. Enable Performance Monitoring in Firebase Console
2. Add performance SDK if needed
3. Monitor Core Web Vitals

## Monitoring & Analytics

### Firebase Analytics
1. Enable Analytics in Firebase Console
2. Add Analytics SDK to track user interactions
3. Set up custom events for investment actions

### Error Monitoring
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Firebase Crashlytics for crash reporting

## Backup & Recovery

### Database Backup
1. Export Firestore data regularly
2. Store backups in Cloud Storage
3. Test restoration procedures

### Code Backup
1. Use Git for version control
2. Regular commits and tags
3. Multiple remote repositories

## Security Considerations

### Pre-deployment Security
- [ ] Update all dependencies
- [ ] Audit for vulnerabilities: `npm audit`
- [ ] Review Firestore security rules
- [ ] Enable Firebase App Check
- [ ] Configure CORS policies
- [ ] Set up rate limiting

### Post-deployment Security
- [ ] Monitor security alerts
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Monitor authentication logs

## Troubleshooting

### Common Issues
1. **Environment variables not loading**
   - Check variable names start with `VITE_`
   - Verify variables are set in hosting platform

2. **Firebase connection issues**
   - Verify Firebase config is correct
   - Check Firebase project permissions
   - Ensure Firestore rules allow access

3. **Build failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Review build logs for specific errors

### Debug Commands
```bash
# Check build output
npm run build -- --debug

# Test production build locally
npm run preview

# Firebase emulator for testing
firebase emulators:start
```

## Rolling Back Deployments

### Firebase Hosting
```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:channel:deploy --only hosting previous-version
```

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

## Cost Optimization

### Firebase Costs
- Monitor Firestore read/write operations
- Optimize queries to reduce reads
- Use caching to minimize API calls
- Set up budget alerts in Google Cloud Console

### CDN Optimization
- Use Firebase Hosting CDN
- Enable compression
- Optimize images and assets
- Implement proper caching headers

---

For additional support, refer to the platform-specific documentation or contact the development team.