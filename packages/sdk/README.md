# ContentNext SDK

[![npm version](https://img.shields.io/npm/v/@content-next-v2/sdk.svg)](https://www.npmjs.com/package/@content-next-v2/sdk)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@content-next-v2/sdk)](https://bundlephobia.com/package/@content-next-v2/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

A zero-dependency, type-safe SDK for retrieving published articles from your ContentNext API. Perfect for building blogs, documentation sites, and content-driven applications.

## ✨ Features

- 🚀 **Zero Dependencies** - Uses only native `fetch` API
- 📦 **Lightweight** - ~2KB bundle size (gzipped: ~0.88KB)
- 🔒 **Type-Safe** - Full TypeScript support with exported types
- 🌐 **Framework Agnostic** - Works with any JavaScript/TypeScript project
- 🎯 **Simple API** - Clean, intuitive interface
- ⚡ **Fast** - Optimized for performance

## 📦 Installation

```bash
# npm
npm install @content-next-v2/sdk

# yarn
yarn add @content-next-v2/sdk

# pnpm
pnpm add @content-next-v2/sdk

# bun
bun add @content-next-v2/sdk
```

## 🚀 Quick Start

```typescript
import { ContentNextClient } from "@content-next-v2/sdk";

// Initialize the client
const client = new ContentNextClient({
  apiKey: "your-api-key-here",
  serverUrl: "https://your-server.com", // optional
});

// List published articles
const { articles } = await client.articles.list({ page: 1, limit: 10 });

// Get a specific article
const article = await client.articles.getBySlug("my-article");
```

## 📖 API Reference

### ContentNextClient

The main client class for interacting with the ContentNext API.

#### Constructor

```typescript
new ContentNextClient(options: ClientOptions)
```

**Parameters:**

- `options.apiKey` (string, required): Your API key for authentication
- `options.serverUrl` (string, optional): Custom server URL

#### Methods

##### `articles.list(options?)`

List published articles with pagination.

```typescript
const response = await client.articles.list({
  page: 1, // optional, default: 1
  limit: 20, // optional, default: 20, max: 100
});

// Response: { articles: ArticleSummary[], page: number, limit: number }
```

##### `articles.getBySlug(slug)`

Get a specific published article by its slug.

```typescript
const article = await client.articles.getBySlug("my-article-slug");
// Returns: Article (includes full content)
```

## 📋 Type Definitions

### ArticleSummary

Article metadata without full content (used in list views):

```typescript
interface ArticleSummary {
  id: string;
  websiteId: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  scheduledFor: string | null;
  publishedAt: string | null;
  readTime: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

### Article

Full article including content:

```typescript
interface Article extends ArticleSummary {
  content: string;
}
```

### Other Types

```typescript
interface ListArticlesResponse {
  articles: ArticleSummary[];
  page: number;
  limit: number;
}

interface ListArticlesOptions {
  page?: number;
  limit?: number;
}

interface ClientOptions {
  apiKey: string;
  serverUrl?: string;
}
```

## 🛠️ Usage Examples

### Next.js (App Router)

```typescript
// app/blog/page.tsx
import { ContentNextClient } from "@content-next-v2/sdk";

export default async function BlogPage() {
  const client = new ContentNextClient({
    apiKey: process.env.CONTENT_API_KEY!,
  });

  const { articles } = await client.articles.list({ limit: 10 });

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <article key={article.id} className="border-b pb-4">
          <h2 className="text-2xl font-bold">{article.title}</h2>
          <p className="text-gray-600">{article.description}</p>
          <div className="flex gap-2 mt-2">
            {article.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {article.readTime} min read •{" "}
            {new Date(article.publishedAt!).toLocaleDateString()}
          </p>
        </article>
      ))}
    </div>
  );
}
```

### React with SWR

```typescript
import useSWR from "swr";
import { ContentNextClient } from "@content-next-v2/sdk";

const client = new ContentNextClient({
  apiKey: process.env.NEXT_PUBLIC_CONTENT_API_KEY!,
});

function BlogList() {
  const { data, error, isLoading } = useSWR("articles", () =>
    client.articles.list({ page: 1, limit: 10 })
  );

  if (isLoading) return <div>Loading articles...</div>;
  if (error) return <div>Failed to load articles</div>;

  return (
    <div>
      {data?.articles.map((article) => (
        <div key={article.id} className="mb-4">
          <h3>{article.title}</h3>
          <p>{article.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Node.js / Express

```javascript
const express = require("express");
const { ContentNextClient } = require("@content-next-v2/sdk");

const app = express();
const client = new ContentNextClient({
  apiKey: process.env.CONTENT_API_KEY,
});

// List articles endpoint
app.get("/api/articles", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const {
      articles,
      page: currentPage,
      limit: currentLimit,
    } = await client.articles.list({ page, limit });

    res.json({
      articles,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        hasMore: articles.length === currentLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article by slug
app.get("/api/articles/:slug", async (req, res) => {
  try {
    const article = await client.articles.getBySlug(req.params.slug);
    res.json({ article });
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ error: "Article not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
```

### Vue.js with Composition API

```jsx
<template>
  <div>
    <div v-if="loading">Loading articles...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <article v-for="article in articles" :key="article.id" class="mb-4">
        <h2>{{ article.title }}</h2>
        <p>{{ article.description }}</p>
        <div class="tags">
          <span v-for="tag in article.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ContentNextClient } from "@content-next-v2/sdk";

const client = new ContentNextClient({
  apiKey: import.meta.env.VITE_CONTENT_API_KEY,
});

const articles = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await client.articles.list({ limit: 10 });
    articles.value = response.articles;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
```

## ⚠️ Error Handling

The SDK throws `ContentNextAPIError` for API errors:

```typescript
import { ContentNextAPIError } from "@content-next-v2/sdk";

try {
  const article = await client.articles.getBySlug("non-existent");
} catch (error) {
  if (error instanceof ContentNextAPIError) {
    console.error("API Error:", error.message);
    console.error("Status Code:", error.status);
    console.error("Error Code:", error.code);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
CONTENT_API_KEY=your-api-key-here

# Optional
CONTENT_SERVER_URL=https://your-server.com
```
