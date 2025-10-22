/**
 * ContentNext Analytics Client
 *
 * A lightweight browser script for tracking article views and reading engagement.
 * Load via script tag with data-api-key attribute.
 */

// ============================================================================
// Types
// ============================================================================

interface AnalyticsConfig {
  apiKey: string;
  serverUrl: string;
  blogPath?: string;
}

interface TrackingData {
  slug: string;
  visitorId: string;
  scrollDepth: number;
  timeSpent: number;
}

// ============================================================================
// Core Analytics Class
// ============================================================================

class ContentNextAnalytics {
  private config: AnalyticsConfig;
  private visitorId: string;
  private pageLoadTime: number;
  private maxScrollDepth: number = 0;
  private isTracking: boolean = false;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.visitorId = this.getOrCreateVisitorId();
    this.pageLoadTime = Date.now();
    this.maxScrollDepth = 0;
    this.isTracking = false;
  }

  /**
   * Initialize tracking - call this after creating the instance
   */
  public init(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.trackView();
    this.startReadTracking();
  }

  /**
   * Get or create visitor ID from cookie
   */
  private getOrCreateVisitorId(): string {
    const cookieName = "cn_visitor_id";
    const existingId = this.getCookie(cookieName);

    if (existingId) {
      return existingId;
    }

    // Generate new visitor ID
    const newId = this.generateVisitorId();
    this.setCookie(cookieName, newId, 365); // 1 year
    return newId;
  }

  /**
   * Generate a unique visitor ID
   */
  private generateVisitorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `visitor_${timestamp}_${random}`;
  }

  /**
   * Extract article slug from current URL
   */
  private extractSlug(): string {
    const path = window.location.pathname;

    // If blog path is configured, extract slug from it
    if (this.config.blogPath) {
      const blogPath = this.config.blogPath.replace(/^\/+|\/+$/g, ""); // trim slashes
      const pathSegments = path.replace(/^\/+|\/+$/g, "").split("/");
      const blogSegments = blogPath.split("/");

      // Find where blog path starts in the URL
      const blogIndex = pathSegments.findIndex((_segment, index) => {
        return blogSegments.every(
          (blogSegment, blogIndex) =>
            pathSegments[index + blogIndex] === blogSegment
        );
      });

      if (blogIndex !== -1) {
        const slugIndex = blogIndex + blogSegments.length;
        return pathSegments[slugIndex] || "";
      }
    }

    // Fallback: use last path segment
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] || "";
  }

  /**
   * Track page view
   */
  private async trackView(): Promise<void> {
    const slug = this.extractSlug();
    if (!slug) return;

    try {
      await this.sendRequest("/rpc/analytics/trackView", {
        json: {
          slug,
          visitorId: this.visitorId,
        },
      });
    } catch (error) {
      // Silently fail - don't break user experience
      console.warn("ContentNext Analytics: Failed to track view", error);
    }
  }

  /**
   * Start tracking reading engagement
   */
  private startReadTracking(): void {
    // Track scroll depth
    this.trackScrollDepth();

    // Set up exit tracking
    this.setupExitTracking();
  }

  /**
   * Track maximum scroll depth
   */
  private trackScrollDepth(): void {
    const updateScrollDepth = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (documentHeight > 0) {
        const scrollPercentage = Math.min(
          100,
          Math.round((scrollTop / documentHeight) * 100)
        );
        this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);
      }
    };

    // Update on scroll
    window.addEventListener("scroll", updateScrollDepth, { passive: true });

    // Initial check
    updateScrollDepth();
  }

  /**
   * Set up exit tracking using sendBeacon
   */
  private setupExitTracking(): void {
    let hasSentData = false;

    const sendReadData = () => {
      if (hasSentData) return; // Prevent duplicate sends
      hasSentData = true;

      const slug = this.extractSlug();
      if (!slug) return;

      const timeSpent = Math.round((Date.now() - this.pageLoadTime) / 1000); // seconds

      const data: TrackingData = {
        slug,
        visitorId: this.visitorId,
        scrollDepth: this.maxScrollDepth,
        timeSpent,
      };

      // Use sendBeacon for reliable delivery during page unload
      const url = `${this.config.serverUrl}/rpc/analytics/trackRead`;
      const payload = JSON.stringify({ json: data });

      // Include API key in URL for sendBeacon (since it doesn't support custom headers)
      const urlWithKey = `${url}?apiKey=${encodeURIComponent(
        this.config.apiKey
      )}`;

      if (navigator.sendBeacon) {
        navigator.sendBeacon(urlWithKey, payload);
      } else {
        // Fallback for older browsers
        this.sendRequestSync(url, { json: data });
      }
    };

    // Primary: Track on visibility change (most reliable)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendReadData();
      }
    });

    // Fallback: Track on pagehide (for browsers without visibilitychange)
    window.addEventListener("pagehide", sendReadData);
  }

  /**
   * Send HTTP request using fetch
   */
  private async sendRequest(endpoint: string, data: any): Promise<void> {
    const url = `${this.config.serverUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Send synchronous request (fallback for sendBeacon)
   */
  private sendRequestSync(endpoint: string, data: any): void {
    const url = `${this.config.serverUrl}${endpoint}`;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, false); // synchronous
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("x-api-key", this.config.apiKey);
      xhr.send(JSON.stringify(data));
    } catch (error) {
      // Silently fail
      console.warn("ContentNext Analytics: Failed to send sync request", error);
    }
  }

  /**
   * Cookie utilities
   */
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
}

// ============================================================================
// Auto-initialization
// ============================================================================

/**
 * Auto-initialize analytics when script loads
 */
function initializeAnalytics(): void {
  // Find the script tag that loaded this script
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  // Extract configuration from data attributes
  const apiKey = currentScript.getAttribute("data-api-key");
  if (!apiKey) {
    console.warn("ContentNext Analytics: data-api-key attribute is required");
    return;
  }

  const serverUrl =
    currentScript.getAttribute("data-server-url") || "https://content-next.com";
  const blogPath = currentScript.getAttribute("data-blog-path") || undefined;

  // Create and initialize analytics
  const analytics = new ContentNextAnalytics({
    apiKey,
    serverUrl,
    blogPath,
  });

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => analytics.init());
  } else {
    analytics.init();
  }
}

// Initialize immediately
initializeAnalytics();

// ============================================================================
// Exports (for manual usage if needed)
// ============================================================================

export { ContentNextAnalytics };
export default ContentNextAnalytics;
