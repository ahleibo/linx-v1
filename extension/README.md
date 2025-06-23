
# LiNX X Post Saver Browser Extension

A browser extension that adds a "Save to LiNX" button to X/Twitter posts, allowing you to save posts directly to your LiNX knowledge base.

## Installation

1. Download/clone this extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your browser toolbar

## Setup

1. Click the LiNX extension icon in your browser toolbar
2. Get your authentication token:
   - Open your LiNX app
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Find "supabase.auth.token" and copy the `access_token` value
3. Paste the token in the extension popup and click "Save Configuration"

## Usage

1. Visit any X/Twitter post
2. Look for the blue "Save to LiNX" button next to the like/retweet buttons
3. Click it to save the post to your LiNX knowledge base
4. The button will show "Saved!" when complete

## Features

- Automatically detects X/Twitter posts
- Extracts post content, author info, media, and engagement metrics
- Saves directly to your LiNX database
- Works on both x.com and twitter.com
- Visual feedback for save status
- Respects dark mode and accessibility settings

## Troubleshooting

- **Button not appearing**: Refresh the page after installing the extension
- **Save fails**: Check that your auth token is correct and not expired
- **Permission errors**: Make sure you're logged into your LiNX app

## Privacy

This extension only runs on X/Twitter pages and only sends data to your own LiNX instance. No data is sent to third parties.
