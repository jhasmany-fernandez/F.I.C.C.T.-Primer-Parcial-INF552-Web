# NextAdmin - Next.js Admin Dashboard Template and Components

**NextAdmin** is a Free, open-source Next.js admin dashboard toolkit featuring 200+ UI components and templates that come with pre-built elements, components, pages, high-quality design, integrations, and much more to help you create powerful admin dashboards with ease.


[![nextjs admin template](https://cdn.pimjo.com/nextadmin-2.png)](https://nextadmin.co/)


**NextAdmin** provides you with a diverse set of dashboard UI components, elements, examples and pages necessary for creating top-notch admin panels or dashboards with **powerful** features and integrations. Whether you are working on a complex web application or a basic website, **NextAdmin** has got you covered.

### [✨ Visit Website](https://nextadmin.co/)
### [🚀 Live Demo](https://demo.nextadmin.co/)
### [📖 Docs](https://docs.nextadmin.co/)

By leveraging the latest features of **Next.js 16** and key functionalities like **server-side rendering (SSR)**, **static site generation (SSG)**, and seamless **API route integration**, **NextAdmin** ensures optimal performance. With the added benefits of **React 19 advancements** and **TypeScript** reliability, **NextAdmin** is the ultimate choice to kickstart your **Next.js** project efficiently.

## Tech Stack

This project is built with modern technologies and best practices:

### Core Framework
- **Next.js 16.0.10** - Latest version with App Router architecture
- **React 19.2.0** - Latest React with improved performance
- **TypeScript 5.x** - Strict mode enabled for type safety

### UI & Styling
- **Tailwind CSS 3.4.16** - Utility-first CSS framework
- **Class Variance Authority** - Component variants management
- **next-themes 0.4.4** - Dark/Light mode support
- **Satoshi Font** - Custom typography

### Data Visualization
- **ApexCharts 4.5.0** - Interactive charts and graphs
- **React ApexCharts 1.7.0** - React wrapper for ApexCharts
- **JSVectorMap 1.6.0** - Geographic data visualization

### Utilities
- **Day.js 1.11.13** - Date manipulation
- **Flatpickr 4.6.13** - Date picker component
- **nextjs-toploader** - Page loading indicator
- **clsx & tailwind-merge** - Dynamic class management

## Project Structure

```
frontend-intelligent/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (home)/            # Dashboard home (grouped route)
│   │   ├── auth/              # Authentication pages
│   │   ├── calendar/          # Calendar feature
│   │   ├── charts/            # Chart demonstrations
│   │   ├── forms/             # Form examples
│   │   │   ├── elements/      # Form input elements
│   │   │   └── layout/        # Form layouts
│   │   ├── pages/             # Additional pages (settings)
│   │   ├── profile/           # User profile
│   │   ├── tables/            # Data tables
│   │   ├── ui-elements/       # UI component examples
│   │   │   ├── alerts/        # Alert components
│   │   │   └── buttons/       # Button variations
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # Global providers
│   ├── components/            # Reusable components
│   │   ├── Auth/              # Authentication components
│   │   ├── Charts/            # Chart implementations
│   │   ├── FormElements/      # Form components
│   │   ├── Layouts/           # Header, sidebar, layout
│   │   ├── Tables/            # Table implementations
│   │   └── ui/                # Base UI components
│   ├── services/              # API services (mock data)
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript definitions
│   ├── css/                   # Global styles
│   └── assets/                # Icons, logos, images
├── public/                    # Static assets
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## Features Overview

### Dashboard Pages
- **Home Dashboard** - Overview metrics, charts, tables, and analytics
- **Calendar** - Integrated calendar with event management
- **Charts** - Campaign visitors and various chart types
- **Tables** - Data tables with sorting and filtering
- **Forms** - Comprehensive form elements and layouts
- **Profile** - User profile with photo upload
- **Settings** - Application settings page
- **UI Elements** - Alerts, buttons, and component showcases

### Key Components
- **Responsive Sidebar** - Collapsible navigation with mobile support
- **Header** - Search, notifications, theme toggle, user menu
- **Charts** - Payments overview, weekly profits, device usage, campaign analytics
- **Tables** - Top channels, top products, invoices with skeleton loading
- **Forms** - Input groups, checkboxes, radio buttons, switches, date pickers, multi-select
- **Authentication** - Sign in with Google integration

### Design Features
- **Dark/Light Mode** - Seamless theme switching
- **Responsive Design** - Mobile, tablet, desktop breakpoints
- **Custom Color Palette** - Primary color #5750F1 with multiple shades
- **11+ Shadow Variants** - Custom box shadows for depth
- **Custom Animations** - Spinning, sliding, rotating effects
- **8 Responsive Breakpoints** - From 375px to 2560px

## Installation

1. Download/fork/clone the repo and Once you're in the correct directory, it's time to install all the necessary dependencies. You can do this by typing the following command:

```
npm install
```
If you're using **Yarn** as your package manager, the command will be:

```
yarn install
```

2. Okay, you're almost there. Now all you need to do is start the development server. If you're using **npm**, the command is:

```
npm run dev
```
And if you're using **Yarn**, it's:

```
yarn dev
```

And voila! You're now ready to start developing. **Happy coding**!

## Highlighted Features
**200+ Next.js Dashboard Ul Components and Templates** - includes a variety of prebuilt **Ul elements, components, pages, and examples** crafted with a high-quality design.
Additionally, features seamless **essential integrations and extensive functionalities**.

- A library of over **200** professional dashboard UI components and elements.
- Five distinctive dashboard variations, catering to diverse use-cases.
- A comprehensive set of essential dashboard and admin pages.
- More than **45** **Next.js** files, ready for use.
- Styling facilitated by **Tailwind CSS** files.
- A design that resonates premium quality and high aesthetics.
- A handy UI kit with assets.
- Over ten web apps complete with examples.
- Support for both **dark mode** and **light mode**.
- Essential integrations including - Authentication (**NextAuth**), Database (**Postgres** with **Prisma**), and Search (**Algolia**).
- Detailed and user-friendly documentation.
- Customizable plugins and add-ons.
- **TypeScript** compatibility.
- Plus, much more!

All these features and more make **NextAdmin** a robust, well-rounded solution for all your dashboard development needs.

## Update Logs

### Version 1.2.2 - [December 01, 2025]
- Updated to Next.js 16
- Updated dependencies.

### Version 1.2.1 - [Mar 20, 2025]
- Fix Peer dependency issues and NextConfig warning.
- Updated apexcharts and react-apexhcarts to the latest version.

### Version 1.2.0 - Major Upgrade and UI Improvements - [Jan 27, 2025]

- Upgraded to Next.js v15 and updated dependencies
- API integration with loading skeleton for tables and charts.
- Improved code structure for better readability.
- Rebuilt components like dropdown, sidebar, and all ui-elements using accessibility practices.
- Using search-params to store dropdown selection and refetch data.
- Semantic markups, better separation of concerns and more.

### Version 1.1.0
- Updated Dependencies
- Removed Unused Integrations
- Optimized App

### Version 1.0
- Initial Release - [May 13, 2024]
