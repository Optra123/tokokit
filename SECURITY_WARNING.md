# ⚠️ SECURITY WARNING

## Exposed Credentials Detected

The file `frontend/config.js` contains what appears to be real Supabase credentials:

```javascript
SUPABASE_URL: 'https://athkfjurhflzdfvztpha.supabase.co';
SUPABASE_ANON_KEY: 'sb_publishable_g8q9B2EUVWW7sp6V3cUiog_dPtVf14i';
```

### ⚡ Immediate Actions Required:

1. **Rotate Supabase Keys**:
   - Go to https://app.supabase.com/project/athkfjurhflzdfvztpha/settings/api
   - Generate new anon key
   - Update your local `config.js` with new keys
   - Never commit the real keys to Git

2. **Use Template Instead**:
   - Delete `frontend/config.js` from Git: `git rm --cached frontend/config.js`
   - Copy `frontend/config.template.js` to `frontend/config.js`
   - Fill in your credentials in the local copy
   - The `.gitignore` now prevents committing `config.js`

3. **Check Git History**:
   - If keys were previously committed, consider them compromised
   - Rotate all keys in Supabase dashboard
   - For public repositories, keys in history are permanently exposed

4. **For Production**:
   - Use environment variables in Vercel
   - Never store secrets in frontend code
   - Only expose anon keys (with proper RLS policies)

### 🔒 Proper Setup:

**For Development:**

```bash
# Copy template
cp frontend/config.template.js frontend/config.js

# Edit with your credentials (not committed to Git)
# frontend/config.js is now in .gitignore
```

**For Production (Vercel):**

- Set environment variables in Vercel dashboard
- Frontend reads from `window.TOKOKIT_CONFIG`
- Inject at build time or use public env vars

### ✅ After Fixing:

Run these commands:

```bash
# Remove tracked config.js
git rm --cached frontend/config.js

# Commit the security fix
git add .gitignore frontend/config.template.js
git commit -m "Security: Add config template and gitignore credentials"
```

---

**Created**: 2026-07-06
**Priority**: CRITICAL
