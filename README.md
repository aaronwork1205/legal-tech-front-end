# LexiFlow Front-end

React front-end for the LexiFlow SaaS legal advisory experience. It implements a marketing landing page, a protected workspace with an agentic AI assistant, and account management flows with mocked identity and subscription logic.

## Features

- **Authentication flows** – dedicated sign-in, sign-up, and email verification pages backed by a simulated auth service with persistence.
- **Protected dashboard** – multi-section layout with conversation summary, AI-driven assistant console, and subscription controls.
- **Agentic assistant logic** – contextual responses, regulation tagging, lawyer recommendations, and live summary updates via asynchronous service calls.
- **Subscription governance** – reusable plan data with selection, upgrades, and messaging tied to the authenticated workspace.
- **React router structure** – clean routing between marketing, auth, and application surfaces with guarded routes and shared layout shell.

## Tech stack

- React 18 with React Router 6
- Vite build tooling
- React Hook Form + Zod for form validation
- Local storage–backed mock services for auth/session state
- Classcat for conditional styling helpers
- UUID + date-fns utilities

## Getting started

```bash
# install dependencies
npm install

# run local dev server (http://localhost:5173)
npm run dev

# lint the project
npm run lint

# build for production
npm run build

# preview the production build
npm run preview
```

## Project structure

```
.
├── src
│   ├── components
│   │   ├── auth/          # Auth layout + forms
│   │   ├── dashboard/     # Dashboard sections (hero, assistant, plans, testimonials)
│   │   ├── demo/          # Demo lab styling & animations
│   │   ├── layout/        # Shared shell and footer
│   │   └── routing/       # Protected route wrapper
│   ├── data/              # Subscription tier definitions
│   ├── pages/             # Page-level route components
│   ├── services/          # Mock auth + assistant API simulators
│   ├── state/             # Auth and assistant context providers
│   ├── styles/            # Global styling tokens
│   ├── App.jsx            # Route definitions
│   └── main.jsx           # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## Mock credentials

The seeded workspace lets you skip registration during development:

- Email: `legal@nebulalabs.io`
- Password: `LexiFlow#2024`

Or visit the login screen and click **Use demo workspace** to auto-fill these credentials.

## Next steps

- Replace the mock services in `src/services/` with real API integrations.
- Wire analytics, logging, and design system tokens as needed.
- Extend the assistant provider to call your production AI orchestration layer.

## Demo lab

Navigate to `http://localhost:5173/demo` (also linked in the global navigation) to explore the animated product walkthrough:

- Simulated user intake with typewriter effect cycling through immigration, tax, and property scenarios.
- Auto-generated document bundles ready for download preview.
- Attorney recommendations with ratings, availability, and contact actions.
- Automation pipeline visualization plus integration showcase.
