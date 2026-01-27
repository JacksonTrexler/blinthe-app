# Blinthe Quick Start Guide

## 1. Installation & Setup

```bash
# Clone or navigate to project
cd blinthe-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## 2. First Time Setup

### Create Your Account
1. Choose "Create Account" tab
2. Enter username (2+ characters)
3. Enter password (6+ characters)
4. **Important**: Your password is used to derive an encryption key. Write it down—it cannot be recovered if lost

### Sign In
Use your username and password to sign in. Session lasts 20 minutes with automatic extension on activity.

## 3. Create Your First Widget

### Simple Text Widget
1. Click **+ Add Widget**
2. Paste this:
```
Show me a greeting with today's date
```
3. Select LLM provider (Perplexity recommended)
4. Click **Create Widget**
5. Widget appears instantly!

### Weather Widget (Requires API Key)
1. Get free API key from [OpenWeather](https://openweathermap.org/api)
2. Click **+ Add Widget**
3. Paste:
```
openweather_api_key: YOUR_API_KEY_HERE
Show me current temperature in London with weather description
```
4. Widget auto-extracts key and creates display

### Crypto Tracker (Requires Perplexity Key)
1. Get free API key from [Perplexity AI](https://www.perplexity.ai/settings/api)
2. Click **+ Add Widget**
3. Paste:
```
perplexity_api_key: pplx_YOUR_KEY_HERE
Top 5 crypto gainers in last 24 hours with % change - format as table
```

## 4. Managing Widgets

### Edit Widget
- Click **⋮** menu on any widget
- Select "Edit" to modify title, description, or display type
- Changes create a new version (see History)

### View History
- Click **⋮** menu > "History"
- See all previous versions
- Click "Restore" to revert to older version

### Refresh Data
- Click **⋮** menu > "Refresh"
- Or set auto-refresh interval in widget config

### Export Widget
- Click **⋮** menu > "Export"
- Downloads widget config as JSON
- Share or backup your widgets

### Delete Widget
- Click **⋮** menu > "Delete"
- Confirm deletion
- Deleted widgets cannot be recovered

## 5. Supported Display Types

When creating a widget, the LLM automatically detects the best format:

- **Text**: Paragraphs, descriptions, summaries
- **Number**: Large metric display (temperature, price, count)
- **List**: Ordered or unordered items
- **Table**: Tabular data with columns and rows
- **Chart**: Bar, line, or pie charts (coming soon)

## 6. Using API Keys

### Supported Providers

| Service | Detection Pattern |
|---------|------------------|
| Perplexity | `perplexity_api_key: ...` |
| OpenAI | `openai_api_key: sk-...` |
| Anthropic | `anthropic_api_key: sk-ant-...` |
| OpenWeather | `openweather_api_key: ...` |
| NewsAPI | `newsapi_api_key: ...` |
| WeatherAPI | `weatherapi_api_key: ...` |
| CoinGecko | `coingecko_api_key: ...` |

### How Key Extraction Works
1. You paste prompt with API key
2. App scans for known key patterns
3. Keys are extracted and secured
4. Keys are **NOT** sent to LLM
5. Only redacted prompt is analyzed
6. Keys stored encrypted locally

### Security Notes
- ✅ Keys never leave your browser (except to their own API)
- ✅ Keys stored encrypted with your password
- ✅ Session expires after 20 minutes of inactivity
- ✅ All data encrypted in localStorage

## 7. Keyboard Shortcuts

- `Enter` - Submit in forms
- `Escape` - Close modals
- `Ctrl+S` - Export widget (future)

## 8. Troubleshooting

### "Session expired"
- Click "Sign In" to re-authenticate
- Your widgets are still encrypted and saved

### "Encryption failed"
- Clear browser cache
- Ensure localStorage isn't full
- Check browser privacy settings

### "API rate limit"
- Wait a few minutes before trying again
- Check your API key quota
- Consider upgrading your plan

### Widget shows "No data yet"
- Widget may need initial evaluation
- Click refresh button (⋮ > Refresh)
- Check API key is valid
- Try a simpler prompt

## 9. Best Practices

### Writing Effective Prompts
✅ **Good**:
```
openweather_api_key: abc123
Show temperature in Celsius, humidity, and wind speed for New York as numbers
```

❌ **Avoid**:
```
weather widget
```

### Managing Multiple Widgets
- Create widgets for specific metrics
- Use clear, descriptive titles
- Organize by refreshing frequently-used ones
- Archive old versions to keep history tidy

### Data Privacy
- Your password is never stored
- Your data is encrypted before leaving your browser
- API calls go directly to the service provider
- No analytics or tracking

## 10. Deployment

### Deploy to Production

**Vercel** (Recommended):
```bash
npm run build
# Push to GitHub, connect in Vercel
```

**Netlify**:
```bash
npm run build
# Drag dist/ folder to Netlify
```

**GitHub Pages**:
```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

### Install as PWA
1. Open in Chrome/Edge
2. Click address bar icon (Install app)
3. Follow prompts
4. Access from home screen!

## 11. Next Steps

- Explore different API providers
- Create custom dashboard layouts
- Share widgets with others (export/import)
- Set up auto-refresh for live data
- Try combining multiple widgets

## 12. Getting Help

- Check [README.md](README.md) for full docs
- See [src/types/index.ts](src/types/index.ts) for data structure
- Check [src/utils/keyExtractor.ts](src/utils/keyExtractor.ts) for API patterns
- Review example prompts in this guide

---

**Happy dashboard building!** 🎯

Remember: You're a D&D Bard Charlatan—be creative with your prompts. The LLM understands natural language, so describe what you actually want to see.
