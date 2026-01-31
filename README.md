# Preface
This app was made as an experiment using Perplexity ask and research along with GH Copilot chat. It is 99% slop and, in-fact, does not work. Mostly an excuse to use up my January 2026 chat quota.

Before running out of requests, Claude Haiku using perplexity_ask / perplexity_research managed to bootstrap the login process, a mostly functional create widget flow, successfully queried perplexity with a provided API key scraped from a user's widget description, but got stumped deserializing Perpexity's output.

It may have gotten further if it hadn't gotten hung up on unit testing, had organized and executed on tasks sequantially without losing the thread.

I've already had really promising results using Claude Opus agents at work to organize and orchestrate the agent's workflow, but unforunately Haiku without adequate babysitting ended up spinning in circles without validating output properly

Agent was asked to adhere to strict composability and reusability: all components, templates etc. are less than 300 lines

On the whole I wouldn't attempt resuming this project without at least a modest budget for a premium model
<img width="1157" height="922" alt="image" src="https://github.com/user-attachments/assets/462ae7ae-512e-40ae-9b7c-b6f8514af969" />

The rest of this README written by the Agent
# Blinthe - Composable Metric Dashboard PWA

A personal metric dashboard PWA where users input natural language prompts + API credentials to auto-generate custom widgets. Zero backend, all client-side, fully encrypted.

## Features

- 🎯 **Zero Backend**: All computation, encryption, and API calls happen in the browser
- 🔐 **Encrypted Storage**: AES-GCM encryption for all sensitive data with password-derived keys
- 🧩 **Composable Widgets**: Self-contained widgets that can be dragged, resized, and customized
- 🤖 **LLM-Powered**: Perplexity, OpenAI, or Anthropic integration for smart widget generation
- 📱 **PWA Ready**: Installable on mobile, works offline with cached data
- 🎨 **Dark Theme**: Modern Vuetify 3 UI with cyan/dark color scheme
- ⏱️ **Session Management**: 20-minute timeout with automatic extension on interaction

## Tech Stack

- **Framework**: Vue 3 (Composition API) + TypeScript
- **UI Library**: Vuetify 3
- **Build Tool**: Vite + PWA Plugin
- **State Management**: Pinia
- **Storage**: Encrypted localStorage (Web Crypto AES-GCM)
- **Charts**: Chart.js + vue-chartjs
- **Drag & Drop**: Sortable.js

## Project Structure

```
src/
├── components/          # Vue components
│   ├── AuthModal.vue
│   ├── Dashboard.vue
│   ├── WidgetCard.vue
│   ├── CreateWidgetModal.vue
│   ├── EditWidgetModal.vue
│   ├── VersionHistory.vue
│   └── DisplayRenderer.vue
├── composables/         # Reusable logic
│   ├── useAuth.ts
│   ├── useStorage.ts
│   ├── useLLM.ts
│   ├── useWidgets.ts
│   └── useGridLayout.ts
├── stores/              # Pinia stores
│   ├── auth.ts
│   ├── widgets.ts
│   └── layout.ts
├── types/               # TypeScript types
│   └── index.ts
├── utils/               # Utilities
│   ├── crypto.ts
│   ├── keyExtractor.ts
│   └── vuetify.ts
├── App.vue
└── main.ts
```

## Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Creating a Widget

1. Click **+ Add Widget**
2. Enter a prompt with API keys (e.g., `openweather_api_key: abc123` followed by your request)
3. App automatically:
   - Extracts and secures API keys
   - Infers LLM provider (or you select one)
   - Calls LLM to parse intent and generate display config
   - Creates encrypted widget
4. Widget appears on dashboard immediately

### Example Prompts

**Weather Widget**
```
openweather_api_key: YOUR_KEY_HERE
Show me today's high/low temperature in Celsius with weather icon
```

**Crypto Tracker**
```
perplexity_api_key: pplx_xxxxx
Top 3 crypto movers in last 24h with name, ticker, % change - show as table
```

**Stock Dashboard**
```
openai_api_key: sk_xxxxx
Current price of AAPL, GOOGL, MSFT with % change and mini line chart
```

## Security

- ✅ **Zero Backend**: No data ever leaves your browser (except API calls to configured services)
- ✅ **Encrypted Storage**: All data encrypted with AES-GCM using password-derived key
- ✅ **Key Extraction**: API keys extracted before inference, never sent to LLM
- ✅ **No Telemetry**: No analytics, tracking, or external requests
- ✅ **HTTPS Only**: Enforced in production
- ✅ **Session Timeout**: 20-minute inactivity timeout auto-logs you out

## API Integrations

### Supported Providers

- **Perplexity**: `https://api.perplexity.ai/chat/completions`
- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Anthropic**: `https://api.anthropic.com/v1/messages`
- **Weather APIs**: OpenWeather, WeatherAPI, etc.
- **Financial APIs**: CoinGecko, NewsAPI, etc.
- **Generic HTTP**: Custom API URLs supported

### API Key Patterns

The app automatically detects and extracts:
- `perplexity_api_key: ...`
- `openai_api_key: ...`
- `anthropic_api_key: ...`
- `openweather_api_key: ...`
- `newsapi_api_key: ...`
- And more (see `src/utils/keyExtractor.ts`)

## Configuration

### Theme Colors

Edit `src/utils/vuetify.ts`:
- Primary: `#00d4ff` (Cyan)
- Surface: `#16213e` (Dark Blue)
- Background: `#1a1a2e` (Charcoal)
- Error: `#ff6b6b` (Red)
- Success: `#00d97e` (Green)

### Session Timeout

Edit `src/composables/useAuth.ts`:
```typescript
const SESSION_TIMEOUT_MS = 20 * 60 * 1000 // 20 minutes
```

## Deployment

### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify
```bash
npm run build
# Drag dist/ folder to Netlify
```

### GitHub Pages
```bash
npm run build
git add dist/
git commit -m "Build"
git push origin --delete gh-pages
git subtree push --prefix dist origin gh-pages
```

### Self-Hosted
```bash
npm run build
# Serve dist/ via any static server (nginx, Apache, etc.)
```

## Development

### Run Type Checker
```bash
npm run type-check
```

### Local Development with Hot Reload
```bash
npm run dev
```

### Build Watch Mode
```bash
npm run build -- --watch
```

## Testing Prompts

Try these to test functionality:

1. **Simple Text**
   ```
   Show me a greeting message with today's date
   ```

2. **Numbers**
   ```
   Display the number 42 as a large metric
   ```

3. **Table**
   ```
   Show me a table with columns: Name, Age, City
   ```

4. **Real API (requires key)**
   ```
   openweather_api_key: YOUR_KEY
   Show current temperature in New York
   ```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)
- Mobile: ✅ Installable PWA

## PWA Features

- ✅ Installable on home screen
- ✅ Works offline (with cached widgets)
- ✅ Background sync (future)
- ✅ Service worker caching

## Troubleshooting

### "Encryption failed"
- Ensure localStorage isn't full
- Check browser privacy settings allow localStorage
- Try clearing old data

### "API rate limit reached"
- Wait before making another request
- Check your API key quota
- Consider upgrading your API plan

### "Could not understand intent"
- Be more specific in your prompt
- Include example output format
- Try a different LLM provider

## Future Enhancements

- [ ] Widget sharing (encrypted export/import)
- [ ] Webhook support for real-time updates
- [ ] Custom formula editor
- [ ] Data export (CSV, JSON)
- [ ] Widget templates library
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Advanced charting options
- [ ] Database integration (optional)
- [ ] Collaborative dashboards

## License

ISC

## Contributing

Contributions welcome! Please read our contributing guidelines.

## Support

For issues, feature requests, or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Include browser/device info
4. Describe steps to reproduce

---

**Made with ❤️ by the Blinthe team**

D&D Bard Charlatan meets data visualization. Suspicious? Maybe. Brilliant? Definitely.
