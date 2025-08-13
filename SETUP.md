# Quick Setup Guide

## Step-by-Step Setup (5 minutes)

### 1. Google Sheets & Apps Script Setup

1. **Create Google Sheet:**

   - Go to [sheets.google.com](https://sheets.google.com)
   - Create new sheet, name it "Cabo Verde Help Map"

2. **Setup Google Apps Script:**

   - Go to [script.google.com](https://script.google.com)
   - New Project → Delete default code
   - Copy & paste code from `google-apps-script.js`
   - Save as "Cabo Verde Map API"

3. **Deploy Web App:**

   - Deploy → New Deployment → Web app
   - Execute as: "Me", Access: "Anyone"
   - Copy the deployment URL

4. **Update Config:**
   - Edit `config.js`
   - Replace `YOUR_SCRIPT_ID` with your deployment URL

### 2. Test Locally

```bash
# Serve files (choose one):
python -m http.server 8000
# OR
npx http-server
# OR
php -S localhost:8000

# Open browser:
http://localhost:8000
```

### 3. Deploy to GitHub Pages

1. Create GitHub repo
2. Push all files
3. Settings → Pages → Deploy from main branch
4. Access at: `https://yourusername.github.io/repo-name`

## Testing

- Double-click map to add location
- Check Google Sheet for new entries
- Verify markers appear on map

## Need Help?

Check the full README.md for detailed instructions and troubleshooting.
