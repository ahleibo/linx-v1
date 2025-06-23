
// LiNX X Post Saver - Content Script
class LiNXSaver {
  constructor() {
    this.linxBaseUrl = 'https://jayfyarydzkycjzciblj.supabase.co';
    this.init();
  }

  init() {
    this.addStyles();
    this.observeDOM();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .linx-save-btn {
        background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
        border: none;
        border-radius: 20px;
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        padding: 6px 16px;
        margin-left: 8px;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      
      .linx-save-btn:hover {
        background: linear-gradient(135deg, #0d8bd9, #0a6bb8);
        transform: translateY(-1px);
      }
      
      .linx-save-btn:active {
        transform: translateY(0);
      }
      
      .linx-save-btn.saving {
        opacity: 0.7;
        pointer-events: none;
      }
      
      .linx-save-btn.saved {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      .linx-icon {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
    `;
    document.head.appendChild(style);
  }

  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.addSaveButtons(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial scan
    this.addSaveButtons(document.body);
  }

  addSaveButtons(container) {
    // Find tweet articles (X's current structure)
    const tweets = container.querySelectorAll('article[data-testid="tweet"]:not([data-linx-processed])');
    
    tweets.forEach(tweet => {
      tweet.setAttribute('data-linx-processed', 'true');
      this.addSaveButtonToTweet(tweet);
    });
  }

  addSaveButtonToTweet(tweetElement) {
    // Find the action bar (contains like, retweet, etc. buttons)
    const actionBar = tweetElement.querySelector('[role="group"]');
    if (!actionBar) return;

    // Check if button already exists
    if (actionBar.querySelector('.linx-save-btn')) return;

    // Extract tweet data
    const tweetData = this.extractTweetData(tweetElement);
    if (!tweetData) return;

    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'linx-save-btn';
    saveBtn.innerHTML = `
      <svg class="linx-icon" viewBox="0 0 24 24">
        <path d="M19 21l-7-5-7 5V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v16z"/>
      </svg>
      Save to LiNX
    `;

    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.saveTweet(saveBtn, tweetData);
    });

    actionBar.appendChild(saveBtn);
  }

  extractTweetData(tweetElement) {
    try {
      // Extract tweet URL
      const timeElement = tweetElement.querySelector('time');
      const linkElement = timeElement?.closest('a');
      const tweetUrl = linkElement?.href;
      
      if (!tweetUrl) return null;

      // Extract author info
      const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
      const authorName = authorElement?.querySelector('span')?.textContent?.trim();
      const authorUsername = tweetUrl.split('/')[3]; // Extract from URL

      // Extract tweet text
      const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
      const content = textElement?.textContent?.trim() || '';

      // Extract media
      const mediaElements = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img, [data-testid="videoPlayer"] video');
      const mediaUrls = Array.from(mediaElements).map(el => {
        if (el.tagName === 'IMG') return el.src;
        if (el.tagName === 'VIDEO') return el.poster || el.src;
        return null;
      }).filter(Boolean);

      // Extract engagement metrics
      const metrics = this.extractMetrics(tweetElement);

      return {
        url: tweetUrl,
        authorName: authorName || 'Unknown',
        authorUsername: authorUsername || 'unknown',
        content,
        mediaUrls,
        ...metrics,
        createdAt: new Date().toISOString() // Fallback since we can't easily extract the exact date
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  extractMetrics(tweetElement) {
    const metrics = {
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0
    };

    // Try to extract metrics from aria-labels or text content
    const buttons = tweetElement.querySelectorAll('[role="button"]');
    buttons.forEach(button => {
      const ariaLabel = button.getAttribute('aria-label') || '';
      const text = button.textContent || '';
      
      if (ariaLabel.includes('like') || text.includes('like')) {
        const match = ariaLabel.match(/(\d+)/);
        if (match) metrics.likesCount = parseInt(match[1]);
      } else if (ariaLabel.includes('retweet') || text.includes('repost')) {
        const match = ariaLabel.match(/(\d+)/);
        if (match) metrics.retweetsCount = parseInt(match[1]);
      } else if (ariaLabel.includes('repl') || text.includes('repl')) {
        const match = ariaLabel.match(/(\d+)/);
        if (match) metrics.repliesCount = parseInt(match[1]);
      }
    });

    return metrics;
  }

  async saveTweet(button, tweetData) {
    button.classList.add('saving');
    button.innerHTML = `
      <svg class="linx-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
      </svg>
      Saving...
    `;

    try {
      // Get stored auth token
      const result = await chrome.storage.sync.get(['linxAuthToken']);
      const authToken = result.linxAuthToken;

      if (!authToken) {
        throw new Error('Please configure your LiNX authentication in the extension popup');
      }

      // Call LiNX import service
      const response = await fetch(`${this.linxBaseUrl}/functions/v1/save-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          xPostId: this.extractTweetId(tweetData.url),
          authorName: tweetData.authorName,
          authorUsername: tweetData.authorUsername,
          content: tweetData.content,
          mediaUrls: tweetData.mediaUrls,
          createdAt: tweetData.createdAt,
          likesCount: tweetData.likesCount,
          retweetsCount: tweetData.retweetsCount,
          repliesCount: tweetData.repliesCount,
          xUrl: tweetData.url
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      // Success
      button.classList.remove('saving');
      button.classList.add('saved');
      button.innerHTML = `
        <svg class="linx-icon" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        Saved!
      `;

      // Reset button after 3 seconds
      setTimeout(() => {
        button.classList.remove('saved');
        button.innerHTML = `
          <svg class="linx-icon" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v16z"/>
          </svg>
          Save to LiNX
        `;
      }, 3000);

    } catch (error) {
      console.error('Error saving tweet:', error);
      button.classList.remove('saving');
      button.innerHTML = `
        <svg class="linx-icon" viewBox="0 0 24 24">
          <path d="M12 9v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
        </svg>
        Error
      `;

      setTimeout(() => {
        button.innerHTML = `
          <svg class="linx-icon" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v16z"/>
          </svg>
          Save to LiNX
        `;
      }, 3000);
    }
  }

  extractTweetId(url) {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LiNXSaver());
} else {
  new LiNXSaver();
}
