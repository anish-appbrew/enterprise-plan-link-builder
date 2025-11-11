## Enterprise Plan Subscribe Link Builder

Generate links for the Appbrew enterprise plan subscription endpoint in a friendly UI.

- Base endpoint: `https://api.appbrew.tech/billing/subscribe-enterprise-plan`
- Example: `https://api.appbrew.tech/billing/subscribe-enterprise-plan?shop=thesashbag-2.myshopify.com&amountInUSD=850&period=MONTHLY&provider=STRIPE`

### Features
- Validates Shopify shop domain and amount
- Supports MONTHLY or YEARLY periods
- Provider fixed to STRIPE
- Live preview, one-click copy/open/share
- Remembers inputs locally (toggle)
- Advanced override for base URL
- Optional trialDays or trialEndDate (mutually exclusive)
- Optional variable fee percentage and variable type (SALES_BASED/USER_BASED)

### Quick start
1. Open `index.html` in your browser.
2. Fill in:
   - Shop domain (e.g. `thesashbag-2.myshopify.com`)
   - Amount in USD (whole number)
   - Billing period (MONTHLY or YEARLY)
   - Optional: `trialDays` OR `trialEndDate` (YYYY-MM-DD). If `trialEndDate` is provided, `trialDays` is forced to `0`.
   - Optional: `variableFeePercentage` (number) and `variableType` (SALES_BASED or USER_BASED)
3. Click “Generate link” and copy/open the URL.

### Deploy
This is a static site—no backend required. You can publish it with any static hosting:

- GitHub Pages: serve the folder as the site root
- Netlify/Vercel: drag-and-drop the folder or set build to “None”

### Inspired by
- `otp-api-provider-form` on GitHub ([link](https://github.com/anish-appbrew/otp-api-provider-form))

### License
MIT


