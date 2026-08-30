# Sle Qelbachin Website — Professional AI Navigation System

Welcome to **Sle Qelbachin**, a modern Islamic educational website featuring AI-powered navigation, Kitab collections, audio lectures, and Muhadara content in multiple languages (Amharic, Arabic, English).

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## ⚠️ Important: Media Files Not Included

The `public/telegram_media/` folder (1.9 GB, 800 files) is **NOT included in this repository**. 

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including media file upload.**

## 🎯 Features

- 🤖 **AI Navigation System**: Intent-based navigation with Groq API
- 📚 **Kitab Library**: Islamic texts with dual-pane PDF viewer
- 🎧 **Audio Player**: Global audio player with playlists
- 🎥 **Video Library**: Educational video content
- 👥 **Sahabah Profiles**: Stories of the companions
- 🌐 **Multi-language**: Amharic, Arabic, English
- 🌓 **Dark/Light Mode**: Theme toggle

## 🌍 Deployment

### Quick Deploy to Netlify

1. Connect repository: `mesudhassen5450-sketch/Sile_qelbachin1`
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Add environment variable:
   - `GROQ_API_KEY`: your_groq_api_key
4. Upload media files (see DEPLOYMENT.md)

**Full instructions**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔧 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Groq AI (qwen/qwen3.6-27b)
- Radix UI

## 🔑 Environment Variables

Create `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

## 📱 Pages

- `/` - Home
- `/kitab` - Kitab library
- `/kitab/[slug]` - Kitab detail with PDF viewer
- `/muhadara` - Islamic lectures
- `/videos` - Video library
- `/sahabah` - Companion profiles
- `/reminders` - Daily reminders
- `/knowledge` - Blog
- `/contact` - Contact info

## 🐛 Troubleshooting

- **404 errors**: Upload `telegram_media` folder (see DEPLOYMENT.md)
- **API routes not working**: Remove `output: 'export'` from `next.config.js`
- **AI not working**: Check `GROQ_API_KEY` environment variable

## 🔗 Links

- **Telegram**: https://t.me/Sle_qelbachn1
- **TikTok**: https://www.tiktok.com/@sle_qelbachn1
- **GitHub**: https://github.com/mesudhassen5450-sketch/Sile_qelbachin1

---

**For complete deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
