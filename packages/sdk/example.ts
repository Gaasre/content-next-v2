/**
 * Example usage of the ContentNext API SDK
 *
 * This file demonstrates how to use the SDK to retrieve articles.
 */

import {
  ContentNextClient,
  type Article,
  type ArticleSummary,
} from "./src/index";

// Initialize the client
const client = new ContentNextClient({
  apiKey: "cn_tagm606mjMvyMeI3Daq5sxlrrz4aCcM_",
  serverUrl: "http://localhost:3000", // or your server URL
});

async function example() {
  try {
    // List articles with pagination
    console.log("Fetching articles...");
    const { articles, page, limit } = await client.articles.list({
      page: 1,
      limit: 10,
    });

    console.log(
      `Received ${articles.length} articles (page ${page}, limit ${limit})`
    );

    // Display article summaries (no content field)
    articles.forEach((article: ArticleSummary) => {
      console.log(`- ${article.title} (${article.slug})`);
      console.log(`  Description: ${article.description}`);
      console.log(`  Tags: ${article.tags.join(", ")}`);
      console.log(`  Read time: ${article.readTime} min`);
      console.log(`  Published: ${article.publishedAt}`);
    });

    // Get a specific article by slug (includes full content)
    if (articles.length > 0 && articles[0]) {
      const firstArticleSlug = articles[0].slug;
      console.log(`\nFetching full article: ${firstArticleSlug}...`);

      const article: Article = await client.articles.getBySlug(
        firstArticleSlug
      );

      console.log(`\nFull Article:`);
      console.log(`Title: ${article.title}`);
      console.log(`Content length: ${article.content.length} characters`);
      console.log(`Content preview: ${article.content.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
example();
