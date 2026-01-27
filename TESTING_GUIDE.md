# Account Creation Testing Guide

## Current Status: ✅ Ready for Manual Testing

All unit and integration tests are passing. The application is now ready for end-to-end testing of the account creation flow.

## Quick Start Testing

### 1. Access the Application
- **Local Development**: http://localhost:5173/
- The app should load with the AuthModal component showing

### 2. Create Account Flow

#### Test Case 1: Basic Account Creation
1. Click the **"Create Account"** tab
2. Enter:
   - Username: `testuser123`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click **"Create Account"** button
4. **Expected Result**: 
   - ✅ Account creation succeeds
   - ✅ Dashboard should load
   - ✅ Session persists in localStorage

#### Test Case 2: Sign In with Created Account
1. Refresh the page (Ctrl+R)
2. If session restoration works:
   - You should go directly to Dashboard
   - No need to enter credentials again
3. If session not restored:
   - Click "Sign In" tab
   - Enter same credentials
   - Should authenticate successfully

#### Test Case 3: Session Persistence
1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Look for `blinthe_session` key
4. **Expected**: Encrypted session data should be present
5. Verify structure:
   ```json
   {
     "username": "testuser123",
     "passwordHash": "...",
     "encryptedSession": {
       "ciphertext": "",
       "iv": "",
       "salt": "",
       "algorithm": "AES-GCM"
     }
   }
   ```

### 3. Error Handling Tests

#### Test Case 4: Validation Errors
1. Try creating account with:
   - Empty username → Should show error
   - Username with 1 character → Should show error
   - Password with 5 characters → Should show error
2. **Expected**: Clear error messages displayed

#### Test Case 5: Session Timeout
1. Create account
2. Wait 20 minutes (or modify code for faster testing)
3. **Expected**: Session auto-expires and returns to login

### 4. Browser DevTools Verification

#### Console Tab
- Should see no errors related to:
  - Buffer is not defined
  - Crypto operations
  - Storage access
- Check console warnings (should be minimal)

#### Network Tab
- Account creation should NOT send credentials to any server
- All crypto happens locally
- No external API calls

#### Storage Tab
- `blinthe_session`: Encrypted session data
- localStorage should contain encrypted content only
- No plain text passwords

## Advanced Testing

### Clearing Sessions
```javascript
// In browser console:
localStorage.clear()
// Page will reset to login screen
```

### Testing with Different Browsers
1. **Chrome**: Full Web Crypto API support ✅
2. **Firefox**: Full Web Crypto API support ✅
3. **Safari**: Full Web Crypto API support ✅
4. **Edge**: Full Web Crypto API support ✅

### Testing Encryption
```javascript
// In browser console, after login:
// Check if session key is derived
const stored = JSON.parse(localStorage.getItem('blinthe_session'))
console.log('Password Hash:', stored.passwordHash)
console.log('Encrypted Session:', stored.encryptedSession)
```

## Debugging Tips

### If Account Creation Fails:
1. Check Console (F12) for errors
2. Verify localStorage is available:
   ```javascript
   localStorage.setItem('test', 'value')
   localStorage.removeItem('test')
   ```
3. Check Web Crypto API availability:
   ```javascript
   console.log(window.crypto)
   console.log(window.crypto.subtle)
   ```

### If Session Won't Restore:
1. Check localStorage has data:
   ```javascript
   JSON.stringify(localStorage.getItem('blinthe_session'))
   ```
2. Verify JSON parsing works:
   ```javascript
   JSON.parse(localStorage.getItem('blinthe_session'))
   ```

## Performance Expectations

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| PBKDF2 key derivation | 100-300ms | 100,000 iterations |
| Account creation | 200-500ms | Includes crypto |
| Sign in | 200-500ms | Same as creation |
| Session restoration | 1-10ms | No crypto needed |

## Test Automation (Optional)

### Using Playwright
```bash
npm install --save-dev @playwright/test
```

### Using Selenium
```bash
npm install --save-dev selenium-webdriver
```

### Test Script Example (Playwright)
```javascript
import { test, expect } from '@playwright/test'

test('should create account', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.click('text=Create Account')
  await page.fill('input[placeholder="Username"]', 'testuser')
  await page.fill('input[placeholder="Password"]', 'password123')
  await page.fill('input[placeholder="Confirm"]', 'password123')
  await page.click('button:has-text("Create Account")')
  await expect(page).toHaveURL(/.*dashboard/)
})
```

## Success Criteria

✅ **Account Creation Successful If**:
- No console errors
- Dashboard loads after account creation
- Session stored in localStorage
- Can refresh and stay logged in
- No API calls are made
- All crypto operations complete in <500ms

## Next Steps

1. ✅ Test account creation in browser
2. ✅ Test session restoration
3. ✅ Test error messages
4. ✅ Verify localStorage encryption
5. ✅ Test across different browsers
6. (Optional) Set up Playwright E2E tests
7. Deploy to production

## Contact & Support

If you encounter issues:
1. Check the TEST_REPORT.md for technical details
2. Review Browser console for errors
3. Verify Web Crypto API is available
4. Check localStorage is enabled in browser
5. Run unit tests: `npm run test`
