# 🚀 OrLife Connect

**OrLife Connect** is a high-performance, premium WhatsApp Multi-Sender SaaS Dashboard.

## 🏗️ Architecture (Master-Worker)
- **Frontend (Master):** Built with Next.js 15 (App Router), Tailwind CSS v4, and TypeScript. This handles the UI, User Management, and Dashboard.
- **Backend (Worker):** Powered by **Evolution API** (Baileys) hosted on Oracle Cloud. It handles all WhatsApp sessions, WebSocket connections, and message dispatching.
- **Database:** PostgreSQL for persistent storage, Redis for fast caching and session management.

## 📂 Project Structure
\\\
orlife-connect/
├── src/
│   ├── app/                 # Next.js App Router (Pages & API Routes)
│   │   ├── page.tsx         # Dashboard Overview (Stats & Charts)
│   │   ├── layout.tsx       # Root Layout (Sidebar + Header + Theme)
│   │   ├── globals.css      # Global Styles & Tailwind Variables
│   │   └── devices/         # WhatsApp Devices Management Page
│   ├── components/          # Reusable React Components
│   │   ├── layout/          # Sidebar, Header, etc.
│   │   └── theme-provider.tsx # Dark/Light Mode Provider
│   └── lib/                 # Utility functions, Zustand stores, API clients
├── AGENTS.md                # AI Constitution & Core Rules (CRITICAL)
├── tailwind.config.ts       # Tailwind CSS configuration
└── package.json             # Project dependencies and scripts
\\\

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Theming:** next-themes (Dark & Light mode support)

## 🚦 Getting Started

1. **Install dependencies:**
   \\\ash
   npm install
   \\\

2. **Run the development server:**
   \\\ash
   npm run dev
   \\\
   The server will start on [http://localhost:3002](http://localhost:3002).

## 🛡️ Developer Rules
Please refer to the \AGENTS.md\ file in the root directory for the complete "AI Project Constitution Version 1.0" which outlines all strict rules regarding performance, security, and clean code.
