# ContentNext Analytics Client

[![npm version](https://img.shields.io/npm/v/@content-next-v2/analytics-client.svg)](https://www.npmjs.com/package/@content-next-v2/analytics-client)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@content-next-v2/analytics-client)](https://bundlephobia.com/package/@content-next-v2/analytics-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

A lightweight, zero-dependency browser script for tracking article views and reading engagement in your ContentNext-powered blog or documentation site.

## ✨ Features

- 🚀 **Zero Dependencies** - Uses only native browser APIs
- 📦 **Lightweight** - ~2.8KB minified and obfuscated
- 🔒 **Privacy-Focused** - No third-party tracking, data stays on your servers
- 🎯 **Automatic Tracking** - Works out of the box with minimal configuration
- 📊 **Reading Analytics** - Tracks scroll depth and time spent on articles
- 🌐 **Framework Agnostic** - Works with any website or framework
- ⚡ **Reliable** - Uses modern `visibilitychange` + `navigator.sendBeacon()` for accurate exit tracking

## 📦 Installation

### Via CDN (Recommended)

```html
<script
  defer
  data-api-key="dfid_******"
  src="https://content-next.com/js/analytics.js"
></script>
```

### Via npm (Self-hosted)

```bash
# npm
npm install @content-next-v2/analytics-client

# yarn
yarn add @content-next-v2/analytics-client

# pnpm
pnpm add @content-next-v2/analytics-client

# bun
bun add @content-next-v2/analytics-client
```

Then host the built file and include it:

```html
<script defer data-api-key="dfid_******" src="/path/to/analytics.js"></script>
```

## 🚀 Quick Start

### Basic Usage

Add the script tag to your article pages:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Article</title>
    <!-- Add analytics script -->
    <script
      defer
      data-api-key="dfid_your_api_key_here"
      src="https://content-next.com/js/analytics.js"
    ></script>
  </head>
  <body>
    <article>
      <h1>My Awesome Article</h1>
      <p>Article content...</p>
    </article>
  </body>
</html>
```

That's it! The script will automatically:

- Track page views when the article loads
- Track reading engagement (scroll depth and time spent)
- Send data when the user leaves the page

### Advanced Configuration

```html
<script
  defer
  data-api-key="dfid_your_api_key_here"
  data-server-url="https://your-api.com"
  data-blog-path="/blog"
  src="https://content-next.com/js/analytics.js"
></script>
```

## 📖 Configuration Options

### Required Attributes

| Attribute      | Description              | Example          |
| -------------- | ------------------------ | ---------------- |
| `data-api-key` | Your ContentNext API key | `dfid_abc123...` |

### Optional Attributes

| Attribute         | Description                         | Default                    | Example                      |
| ----------------- | ----------------------------------- | -------------------------- | ---------------------------- |
| `data-server-url` | Custom API server URL               | `https://content-next.com` | `https://api.myblog.com`     |
| `data-blog-path`  | Blog path prefix for slug detection | `undefined`                | `/blog` or `/articles/posts` |

## 🔧 Slug Detection

The script automatically detects article slugs from URLs using these rules:

### 1. Blog Path Detection

```html
<script data-blog-path="/blog" ...></script>
```

For URL `https://example.com/blog/my-article/comments`:

- Extracts: `my-article` (first segment after `/blog`)

### 2. Last Path Segment (Fallback)

For URL `https://example.com/any/structure/my-article`:

- Extracts: `my-article` (last path segment)

## 📊 What Gets Tracked

### Page Views

- **When**: Immediately when the page loads
- **Data**: Article slug, visitor ID, timestamp
- **API**: `POST /rpc/analytics/trackView`

### Reading Engagement

- **When**: When user leaves the page (tab switching, app switching, navigation, etc.)
- **Data**: Article slug, visitor ID, scroll depth (0-100%), time spent (seconds)
- **API**: `POST /rpc/analytics/trackRead`
- **Method**: Uses `navigator.sendBeacon()` with `visibilitychange` event for maximum reliability

### Visitor Identification

- **Method**: Auto-generated unique ID stored in cookie
- **Cookie**: `cn_visitor_id` (1-year expiration)
- **Format**: `visitor_{timestamp}_{random}`

## 🛠️ Usage Examples

### Next.js (App Router)

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-api-key={process.env.NEXT_PUBLIC_CONTENT_API_KEY}
          data-blog-path="/blog"
          src="https://content-next.com/js/analytics.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Next.js (Pages Router)

```tsx
// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script
            defer
            data-api-key={process.env.NEXT_PUBLIC_CONTENT_API_KEY}
            data-blog-path="/blog"
            src="https://content-next.com/js/analytics.js"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

### React (Create React App)

```tsx
// public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script
      defer
      data-api-key="%REACT_APP_CONTENT_API_KEY%"
      data-blog-path="/blog"
      src="https://content-next.com/js/analytics.js"
    ></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### Vue.js

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script
      defer
      data-api-key="%VITE_CONTENT_API_KEY%"
      data-blog-path="/blog"
      src="https://content-next.com/js/analytics.js"
    ></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

### Static Sites (Hugo, Jekyll, etc.)

```html
<!-- layouts/_default/baseof.html (Hugo) -->
<!DOCTYPE html>
<html>
  <head>
    <script
      defer
      data-api-key="{{ .Site.Params.contentApiKey }}"
      data-blog-path="/blog"
      src="https://content-next.com/js/analytics.js"
    ></script>
  </head>
  <body>
    {{ block "main" . }}{{ end }}
  </body>
</html>
```

### Manual Integration (Programmatic)

```typescript
import { ContentNextAnalytics } from "@content-next-v2/analytics-client";

// Create analytics instance
const analytics = new ContentNextAnalytics({
  apiKey: "dfid_your_api_key_here",
  serverUrl: "https://content-next.com",
  blogPath: "/blog",
});

// Initialize tracking
analytics.init();
```

## 🔒 Privacy & Data

### What We Collect

- **Article slug** - Which article was viewed
- **Visitor ID** - Anonymous identifier (stored in cookie)
- **Scroll depth** - How much of the article was read (0-100%)
- **Time spent** - How long the user spent on the page (seconds)
- **Timestamp** - When the interaction occurred

### What We Don't Collect

- Personal information (name, email, etc.)
- IP addresses (handled by your server)
- Browsing history outside your site
- Any data sent to third parties

### Data Storage

- All data is sent to **your** ContentNext API server
- No data is sent to ContentNext or any third parties
- Visitor ID is stored locally in browser cookies only

## 🚨 Error Handling

The analytics script is designed to fail silently and never break your website:

- **Network errors**: Logged to console (in development), ignored in production
- **Invalid configuration**: Warning logged, tracking disabled
- **API errors**: Silently ignored to prevent user experience issues

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-org/content-next-v2.git
cd content-next-v2/packages/analytics-client

# Install dependencies
bun install

# Build the package (production)
bun run build

# Build for development (with sourcemaps and readable code)
bun run build:dev
```

### Build Output

The production build generates a single optimized file:

- **`dist/analytics.js`** - Minified and obfuscated JavaScript (2.8KB)

The build process:

- ✅ **Webpack** - Professional bundling and optimization
- ✅ **Variable Mangling** - All variable and method names are obfuscated
- ✅ **Minification** - Code is compressed and optimized
- ✅ **Dead Code Elimination** - Unused code is removed
- ✅ **Zero Dependencies** - No external libraries included

### Testing Locally

```bash
# Serve the built file locally
python -m http.server 8000

# Test in browser
open http://localhost:8000/test.html
```

## 📈 Analytics Dashboard

View your analytics data in the ContentNext dashboard:

1. **Article Performance**: Views, read time, completion rates
2. **Reading Patterns**: Scroll depth distribution, time spent analysis
3. **Content Health**: Engagement scores and trends
4. **Visitor Insights**: Unique visitors and return rates
