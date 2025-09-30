# Vercel Deployment Troubleshooting Guide

## 🚨 Common Deployment Issues & Solutions

### 1. Build Failed Errors

#### **Issue: "Build script exited with 1"**
**Symptoms:**
- Build logs show `npm run build exited with 1`
- Red error sections in build logs

**Solutions:**
1. **Test locally first:**
   ```bash
   npm run build
   ```
   Fix any errors that appear locally before deploying.

2. **Check your build script in package.json:**
   ```json
   {
     "scripts": {
       "build": "echo 'Build completed successfully'",
       "start": "node server.js"
     }
   }
   ```

3. **For Node.js/Express apps:** Use a simple echo command for build if no compilation is needed.

#### **Issue: "Cannot find module" errors**
**Symptoms:**
- `Error: Cannot find module '../build/output/log'`
- Missing dependencies during build

**Solutions:**
1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check case sensitivity:** Vercel uses case-sensitive filesystem. Ensure file names match exactly.

3. **Verify all dependencies are in package.json:**
   ```bash
   npm ls --depth=0
   ```

### 2. Configuration Issues

#### **Issue: Invalid vercel.json**
**Symptoms:**
- Build fails without logs
- "Invalid vercel.json configuration" error

**Solutions:**
1. **Validate your vercel.json structure:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server.js"
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

2. **Common mistakes to avoid:**
   - Don't mix `routes` with `rewrites`/`redirects`
   - Ensure `src` paths are correct
   - Use proper regex syntax in routes

#### **Issue: Environment Variables Not Working**
**Symptoms:**
- App works locally but fails on Vercel
- "Cannot read property of undefined" for env vars

**Solutions:**
1. **Set environment variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add all required variables:
     ```
     NODE_ENV=production
     OPENAI_API_KEY=your_key_here
     ANTHROPIC_API_KEY=your_key_here
     ```

2. **Use .env.example as reference:**
   ```bash
   # Copy from .env.example
   NODE_ENV=production
   DEFAULT_MODEL=gpt-4o
   DEFAULT_PROVIDER=openai
   ```

### 3. Function & Runtime Issues

#### **Issue: Function Timeout**
**Symptoms:**
- 504 Gateway Timeout
- Functions taking too long to respond

**Solutions:**
1. **Increase function timeout in vercel.json:**
   ```json
   {
     "functions": {
       "server.js": {
         "maxDuration": 30
       }
     }
   }
   ```

2. **Optimize your code:**
   - Add request timeouts
   - Implement caching
   - Reduce API call chains

#### **Issue: Memory/Disk Space Limits**
**Symptoms:**
- Build cancelled due to resource limits
- Out of Memory (OOM) errors

**Solutions:**
1. **Check resource usage:**
   - Set `VERCEL_BUILD_SYSTEM_REPORT=1` as environment variable
   - Review build logs for resource report

2. **Optimize dependencies:**
   ```bash
   # Remove unused dependencies
   npm prune
   
   # Use production dependencies only
   npm ci --only=production
   ```

### 4. Git & Repository Issues

#### **Issue: "Repository not found"**
**Symptoms:**
- Git push fails with 128 exit code
- "Repository not found" error

**Solutions:**
1. **Check repository URL:**
   ```bash
   git remote -v
   # Should show correct GitHub URL
   ```

2. **Update remote URL if needed:**
   ```bash
   git remote set-url origin git@github.com:username/repo-name.git
   ```

3. **Verify SSH key is added to GitHub:**
   ```bash
   ssh -T git@github.com
   # Should show successful authentication
   ```

### 5. Static File Issues

#### **Issue: CSS/JS files not loading**
**Symptoms:**
- Styles not applied
- JavaScript not executing
- 404 errors for static files

**Solutions:**
1. **Check vercel.json routes:**
   ```json
   {
     "routes": [
       {
         "src": "/(.*\\.(css|js|ico|png|jpg|jpeg|gif|svg))",
         "dest": "/$1"
       }
     ]
   }
   ```

2. **Verify file structure:**
   ```
   project/
   ├── index.html
   ├── styles.css
   ├── script.js
   └── server.js
   ```

### 6. API Route Issues

#### **Issue: API endpoints returning 404**
**Symptoms:**
- `/api/*` routes not working
- Server routes not accessible

**Solutions:**
1. **Check API routing in vercel.json:**
   ```json
   {
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

2. **Verify server.js handles routes correctly:**
   ```javascript
   app.use('/api', require('./routes/chat'));
   ```

## 🔧 Debugging Steps

### 1. Check Build Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Expand "Building" section
4. Look for red error messages

### 2. Test Locally
```bash
# Test build
npm run build

# Test start
npm start

# Test with Vercel CLI
vercel dev
```

### 3. Verify Configuration
```bash
# Check vercel.json syntax
cat vercel.json | jq .

# Check package.json scripts
npm run
```

### 4. Check Environment Variables
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Ensure all required variables are set
3. Redeploy after adding variables

## 📋 Pre-Deployment Checklist

- [ ] ✅ Code works locally (`npm start`)
- [ ] ✅ Build script works (`npm run build`)
- [ ] ✅ vercel.json is valid JSON
- [ ] ✅ All dependencies in package.json
- [ ] ✅ Environment variables set in Vercel
- [ ] ✅ Git repository is up to date
- [ ] ✅ No sensitive data in code
- [ ] ✅ Static files properly configured

## 🆘 Still Having Issues?

1. **Check Vercel Status:** https://vercel-status.com
2. **Review Vercel Docs:** https://vercel.com/docs
3. **Community Support:** https://github.com/vercel/vercel/discussions
4. **Contact Support:** support@vercel.com (Pro/Enterprise)

## 📝 Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `BUILD_FAILED` | Build script failed | Check build logs, test locally |
| `FUNCTION_INVOCATION_TIMEOUT` | Function timeout | Increase maxDuration |
| `FUNCTION_INVOCATION_FAILED` | Runtime error | Check function logs |
| `DEPLOYMENT_ERROR` | General deployment error | Check configuration |
| `INVALID_VERCEL_CONFIG` | vercel.json issues | Validate JSON syntax |

---

*Last updated: $(date)*
*For the latest troubleshooting tips, visit: https://vercel.com/docs/deployments/troubleshoot-a-build*