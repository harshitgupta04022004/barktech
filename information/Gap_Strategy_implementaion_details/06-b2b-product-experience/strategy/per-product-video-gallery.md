# Strategy: No Per-Product Video Gallery

## Status: IMPLEMENTED

## Objective

At least one operation video on top 10 products; factory tour on About.

## Implementation Details

- Created `partials/video_section.html` — reusable video gallery partial
- Created `static/js/product-video.js` — lazy-load video on click (no iframe on page load)
- Featured video with large poster + play button overlay
- Additional videos in grid layout (up to 3 per row)
- YouTube, Vimeo, and direct URL support with auto-embed
- Thumbnails with play button overlay
- Duration display when available

## Files Created/Modified

- `app/templates/partials/video_section.html` — NEW: Video gallery section
- `app/templates/product_detail.html` — Includes video_section.html
- `app/static/js/product-video.js` — NEW: Lazy-load video player
- `app/static/css/theme.css` — Play button styles

## What Was Done

1. Video gallery partial that reads `product.media` where type='video'
2. Featured video with poster image and play button
3. Grid of additional videos with thumbnails
4. Lazy-loading: YouTube/Vimeo iframes only load on user click
5. YouTube URL parsing: handles youtube.com/watch, youtube.com/embed, youtu.be
6. Vimeo URL parsing: handles vimeo.com/12345
7. CSS for play buttons (large + small) with hover effects
8. Dark mode support for play buttons

## Video Data Model

Videos are stored in `product_media` table:
- `type`: 'video'
- `url`: YouTube URL, Vimeo URL, or direct MP4 path
- `thumbnail_url`: poster image URL
- `alt_text`: video description
- `duration`: length in seconds (optional)

## Production Plan

1. Die cutting (hero product) — shoot priority
2. Flute laminator (Fengchi competitive set)
3. Window patching
4. Factory tour for About page

## Remaining

- Replace ambiguous homepage embeds with dated playlist: "Installations 2025"
- 360-degree view support (model already exists in ProductMedia)
- Video analytics tracking

## Effort

**Medium** (video production + CMS fields)
