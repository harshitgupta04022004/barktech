# Claude Ads - Setup & Configuration Guide

## Overview

Claude Ads is a Claude-first paid-media operations skill that works across 12 advertising platforms:

| Segment | Platforms |
|---------|-----------|
| Search, video, social | Google Ads, Meta Ads, YouTube Ads, LinkedIn Ads, TikTok Ads, Microsoft Advertising, Reddit Ads, Snapchat Ads, X Ads |
| Commerce/retail | Apple Ads, Amazon Ads, Pinterest Ads |

## Key Commands

| Command | Purpose |
|---------|---------|
| `/ads setup` | Create client, account, KPI, privacy, and guardrail profile |
| `/ads audit [all|platform|scope]` | Run evidence-backed audit |
| `/ads plan` | Build channel, campaign, budget, competitor, and measurement plans |
| `/ads create` | Produce copy, image, video, or product-photo assets |
| `/ads launch --draft` | Draft campaign mutation plan without changing account |
| `/ads monitor` | Review pacing, delivery, tracking, fatigue, policy, and performance |
| `/ads optimize --draft` | Draft evidence-backed optimization changes |
| `/ads experiment` | Design or read out a controlled test |
| `/ads report` | Render a validated JSON run bundle |

Platform shortcuts: `/ads google`, `/ads meta`, `/ads amazon`, `/ads reddit` route to matching platform audit.

## Installation

### From your fork (recommended for your setup)

```bash
cd /home/harshit/Desktop/bark_technology
git clone https://github.com/harshitgupta04022004/claude-ads.git
cd claude-ads
bash install.sh --target=cursor --source=local
```

### From original repo

```bash
git clone https://github.com/AgriciDaniel/claude-ads.git
cd claude-ads
bash install.sh --source=local
```

### Manual Cursor install path

Skills install to: ~/.cursor/extensions/claude-ads/skills/
Agents install to: ~/.cursor/extensions/claude-ads/agents/

## Architecture

- One conductor dispatches platform and cross-platform workers
- Workers analyze bounded slices and return schema-valid findings
- Canonical result is versioned JSON, rendered to Markdown/HTML/PDF
- Read-only by default - changes require approval gates

## Scoring

| Metric | Threshold |
|--------|-----------|
| Graded | 80%+ evidence coverage |
| Provisional | 60-79% evidence coverage |
| Insufficient | Below 60% |

Controls use: pass, fail, unknown, not_applicable

## Account Safety

All adapters are read-only by default. Applying a change requires:
1. Tested and enabled capability for the exact operation
2. Explicit account and object IDs
3. Human-readable before/after diff with blast radius
4. Owner approval within account-defined ceilings
5. Idempotency key, audit destination, rollback, and verification window
6. Verification that remote state matches mutation precondition

## Environment Variables Needed

Add these to your .env file for platform integrations:

```bash
# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
GOOGLE_ADS_CUSTOMER_ID=""

# Meta Ads (Facebook/Instagram)
META_ACCESS_TOKEN=""
META_AD_ACCOUNT_ID=""
META_APP_ID=""
META_APP_SECRET=""

# LinkedIn Ads
LINKEDIN_ACCESS_TOKEN=""
LINKEDIN_AD_ACCOUNT_URN=""

# TikTok Ads
TIKTOK_ACCESS_TOKEN=""
TIKTOK_ADVERTISER_ID=""

# Microsoft Advertising (Bing)
MSADS_DEVELOPER_TOKEN=""
MSADS_ACCESS_TOKEN=""
MSADS_CUSTOMER_ID=""

# Twitter/X Ads
TWITTER_ACCESS_TOKEN=""
TWITTER_ACCESS_SECRET=""
TWITTER_CONSUMER_KEY=""
TWITTER_CONSUMER_SECRET=""

# YouTube Ads (uses Google Ads credentials)
YOUTUBE_CHANNEL_ID=""

# Reddit Ads
REDDIT_ACCESS_TOKEN=""
REDDIT_CLIENT_ID=""
REDDIT_CLIENT_SECRET=""

# Snapchat Ads
SNAPCHAT_ACCESS_TOKEN=""
SNAPCHAT_REFRESH_TOKEN=""
SNAPCHAT_CLIENT_ID=""
SNAPCHAT_CLIENT_SECRET=""

# Apple Ads
APPLE_ADS_API_KEY=""
APPLE_ADS_ORG_ID=""

# Amazon Ads
AMAZON_ACCESS_TOKEN=""
AMAZON_CLIENT_ID=""
AMAZON_CLIENT_SECRET=""
AMAZON_PROFILE_ID=""

# Pinterest Ads
PINTEREST_ACCESS_TOKEN=""
PINTEREST_AD_ACCOUNT_ID=""
```

## Repository Structure

```
claude-ads/
├── ads/                  # Main skill, interface metadata, shared references
├── skills/               # Platform and lifecycle skills
├── agents/               # Platform, cross-platform, research, verifier workers
├── claude_ads_core/      # Typed contracts, adapters, validation, scoring
├── control-plane/        # Evidence, capability, safety, maturity, release state
├── scripts/              # Browser, creative, reporting, release helpers
├── evals/                # Routing and behavioral evaluation cases
├── tests/                # Deterministic, security, installer, adapter tests
└── install.sh            # Installation script
```

## Your Setup Notes

- Repository: https://github.com/harshitgupta04022004/claude-ads (forked from AgriciDaniel/claude-ads)
- License: MIT
- Python: 96.8%, Shell: 3.2%
- Target: Cursor IDE
