# Browser Cache Clearing Instructions

## Issue
After deployment fixes, JavaScript files now serve correctly with proper MIME types (`application/javascript`), but browsers may have cached old 404 responses with incorrect content types. This causes errors like:

```
Refused to execute https://svlentes.com.br/_next/static/chunks/[hash].js as script
because "X-Content-Type-Options: nosniff" was given and its Content-Type is not a script MIME type.
```

## Verification
All files are now serving correctly:
- ✅ 97 JS chunks present in `.next/standalone/.next/static/chunks/`
- ✅ Content-Type: `application/javascript; charset=UTF-8`
- ✅ HTTP Status: 200 OK
- ✅ Server-side caching cleared

## Solution: Clear Browser Cache

### Method 1: Hard Refresh (Fastest)
**Windows/Linux:**
- Chrome/Edge/Firefox: `Ctrl + Shift + R` or `Ctrl + F5`

**macOS:**
- Chrome/Edge: `Cmd + Shift + R`
- Safari: `Cmd + Option + R`

### Method 2: Clear Cache via Developer Tools
1. Open Developer Tools: `F12` or `Ctrl + Shift + I` (Windows) / `Cmd + Option + I` (Mac)
2. Right-click the **Refresh** button
3. Select **"Empty Cache and Hard Reload"**

### Method 3: Full Browser Cache Clear

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Time range: "Last hour" or "All time"
4. Click "Clear data"

**Firefox:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cache"
3. Time range: "Everything"
4. Click "Clear Now"

**Safari:**
1. Safari menu → Preferences → Privacy
2. Click "Manage Website Data"
3. Find `svlentes.com.br`
4. Click "Remove" or "Remove All"

### Method 4: Incognito/Private Window
Open site in incognito/private browsing mode to verify it works without cache:
- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Safari: `Cmd + Shift + N`

### Method 5: Force Reload All Assets
Run in browser console (F12 → Console):
```javascript
// Clear all cached static assets
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  }).then(() => {
    console.log('Cache cleared! Reloading...');
    window.location.reload(true);
  });
} else {
  window.location.reload(true);
}
```

## Verification After Cache Clear

After clearing cache, verify in Developer Tools (F12 → Network tab):

1. **Check Status Codes:**
   - All `/_next/static/chunks/*.js` should return `200 OK`
   - Should NOT see `304 Not Modified` or `404 Not Found`

2. **Check Content-Type:**
   - Click any JS file in Network tab
   - Headers → Response Headers
   - `Content-Type: application/javascript; charset=UTF-8` ✅

3. **Check Console:**
   - Console tab should have NO errors about MIME types
   - Should NOT see "Refused to execute" errors

## Server-Side Verification

For developers/admins, verify server is sending correct headers:

```bash
# Test specific chunk
curl -I https://svlentes.com.br/_next/static/chunks/8c469fd12d2c2e26.js

# Should show:
# HTTP/1.1 200 OK
# Content-Type: application/javascript; charset=UTF-8
```

## Prevention for Future Deployments

To avoid cache issues in future deployments:

1. **Build Hashes Change:** Next.js automatically generates new chunk hashes on each build, so browsers will fetch new files

2. **Clear CDN/Proxy Cache:** After deployment, Nginx cache is cleared with:
   ```bash
   systemctl reload nginx
   ```

3. **Update Build ID:** Build ID changes automatically on each build:
   ```javascript
   // next.config.js
   generateBuildId: async () => 'build-' + Date.now()
   ```

4. **User Notification:** For major updates, consider showing a notification:
   ```javascript
   // "New version available. Please refresh (Ctrl+F5)"
   ```

## Technical Background

**Why This Happened:**
1. Before fix: JS chunks returned `404 Not Found` with `Content-Type: text/html`
2. Browser cached: `/_next/static/chunks/[hash].js` → 404 response
3. After fix: Files exist and serve correctly
4. Browser still uses cached 404 response instead of fetching new file
5. When browser tries to execute cached "HTML" as JavaScript → Error

**Why Hard Refresh Works:**
- Normal refresh (`F5`): Uses cached resources if valid
- Hard refresh (`Ctrl + F5`): Bypasses cache, fetches everything fresh
- This forces browser to fetch actual files with correct MIME types

## Status

✅ Server-side: All fixed, files serve correctly
⚠️ Client-side: Users must clear browser cache

**Recommended User Message:**
```
Site foi atualizado! Por favor, pressione Ctrl+Shift+R
(ou Cmd+Shift+R no Mac) para recarregar com a versão mais recente.
```

## Support

If issues persist after cache clearing:
1. Try incognito/private browsing mode
2. Try different browser
3. Check browser console for specific error messages
4. Contact support with browser/OS details
