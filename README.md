<div align="center">
  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop" alt="PEXIH Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px; max-height: 300px; object-fit: cover;" />

  <h1>🌟 PEXIH</h1>
  <p><b>A High-Performance, Mobile-First Content Publishing Platform</b></p>

  [![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](#)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#)
</div>

<br />

## 🚀 Overview

**PEXIH** is a modern, full-stack web application tailored for content publishing, newsletter management, and community engagement. Built with a **strict mobile-first design philosophy**, it delivers an authentic native app-like experience on mobile devices while offering an expansive, segregated portal optimized specifically for desktop users.

## ✨ Key Features

- **📱 Strict Mobile-First UI**: Features a rigidly bounded `max-w-[400px]` layout on mobile devices to mirror native mobile application UX.
- **💻 Segregated Desktop Portal**: A dedicated `/desktop` routing ecosystem featuring responsive sidebars, wide-grid layouts, and advanced navigation that safely bypasses mobile constraints.
- **⚡ Blazing Fast Architecture**: Built with Astro and Node.js for server-side rendering and lightning-fast page loads.
- **🗄️ Full-Stack Capabilities**: Seamlessly integrates API routes within Astro pages (`/api/*`) and handles dynamic dynamic content generation.
- **🛡️ Secure Admin Control**: An isolated, lightweight administration dashboard for streamlined content management and server moderation.
- **🔔 Real-time Interactions**: Bookmark articles, like posts, and manage custom user profiles with instantaneous UI feedback and localized toast notifications.
- **🌓 Dark Mode Support**: First-class support for dark mode matching system preferences across both mobile and desktop channels.

---

## 🛠️ Technology Stack

| Architecture | Technologies |
| :--- | :--- |
| **Frontend** | Astro 5, Tailwind CSS 4, Vanilla JavaScript, HTML5 |
| **Backend API** | Astro API Endpoints, Node.js SSR |
| **Styling** | Tailwind CSS with custom Orange (#FF6B00) accent theme |
| **Icons** | Lucide Icons (SVG) |

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your local development machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm

### 2. Installation

Clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/pexih.git

# Navigate to the project directory
cd pexih

# Install dependencies
npm install
```

### 3. Running the Application
Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`. 
- **Frontend Mobile App**: `http://localhost:3000/`
- **Frontend Desktop Portal**: `http://localhost:3000/desktop`
- **Admin Mobile Portal**: `http://localhost:3000/admin`
- **Admin Desktop Portal**: `http://localhost:3000/admin/desktop`

### 4. Building for Production

To build the application for production deployment:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

---

## 🎨 UI/UX Guidelines & Continuity Protocol

Contributors must adhere to the **Strict Continuity & Remixing Protocol**:
1. **Layout Integrity**: Do not bypass the `max-w-[400px]` wrapper for mobile routes.
2. **Spacing Consistency**: Inner pages must maintain `h-[52px] px-5` top header paddings. Bottom navigation must remain at `h-[52px]`.
3. **Typography**: Strictly use the predefined micro-typography scale (`text-[8px]` through `text-[16px]`).
4. **Custom Overlays**: Never use native browser alerts (`window.alert`). Use the globally configured custom Toast UI (`window.toast`).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <i>Built with precision and high-performance design principles.</i>
</div>
