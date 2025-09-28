# Deployment Guide - Vercel

This guide will help you deploy your LLM Playground to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): Install with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the repository containing your LLM Playground

2. **Configure Project**:
   - **Framework Preset**: Select "Other" or "Node.js"
   - **Root Directory**: Leave as default (`.`)
   - **Build Command**: `npm run vercel-build` (already configured)
   - **Output Directory**: Leave empty (serverless functions)
   - **Install Command**: `npm install`

3. **Environment Variables**:
   Add the following environment variables in the Vercel dashboard:
   
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   DEFAULT_MODEL=gpt-4o
   DEFAULT_PROVIDER=openai
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your app will be available at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
4. **Set Environment Variables**:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add GOOGLE_API_KEY
   vercel env add GROQ_API_KEY
   vercel env add NODE_ENV
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Required Environment Variables

Copy these from your `.env` file to Vercel's environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `GOOGLE_API_KEY` | Google AI API key | Optional |
| `GROQ_API_KEY` | Groq API key | Optional |
| `DEFAULT_MODEL` | Default AI model | Yes |
| `DEFAULT_PROVIDER` | Default AI provider | Yes |

## Project Structure

The deployment includes:

- **Frontend**: `index.html`, `styles.css`, `script.js` (served as static files)
- **Backend**: `server.js` (deployed as serverless function)
- **API Routes**: All `/api/*` routes handled by the Node.js backend
- **Static Assets**: CSS, JS, and other assets served directly

## Vercel Configuration

The `vercel.json` file configures:

- **Builds**: Static files and Node.js serverless function
- **Routes**: API routing and static file serving
- **Functions**: Serverless function configuration
- **Environment**: Production environment settings

## Post-Deployment

1. **Test Your Deployment**:
   - Visit your Vercel URL
   - Test the chat functionality
   - Verify API endpoints work correctly

2. **Custom Domain** (Optional):
   - Go to your project settings in Vercel
   - Add your custom domain
   - Configure DNS settings

3. **Monitor Performance**:
   - Use Vercel Analytics
   - Monitor function execution times
   - Check error logs in the dashboard

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Working**:
   - Ensure all required variables are set in Vercel dashboard
   - Redeploy after adding new environment variables

2. **API Routes Not Working**:
   - Check that routes start with `/api/`
   - Verify `vercel.json` routing configuration

3. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`

4. **Function Timeout**:
   - Increase `maxDuration` in `vercel.json`
   - Optimize API response times

### Support:

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- Check deployment logs in Vercel dashboard

## Security Notes

- Never commit API keys to your repository
- Use Vercel's environment variables for sensitive data
- Enable CORS properly for your domain
- Consider rate limiting for production use

## Updates

To update your deployment:
1. Push changes to your Git repository
2. Vercel will automatically redeploy
3. Or use `vercel --prod` for manual deployment