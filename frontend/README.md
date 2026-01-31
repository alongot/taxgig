# TaxGig - Web Dashboard

A Next.js web application for tracking side hustle income, expenses, and quarterly tax estimates.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Backend API running on port 3001

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Features

- **Dashboard**: Overview of income, expenses, tax estimates, and upcoming deadlines
- **Transactions**: View and categorize transactions from connected bank accounts
- **Expenses**: Manual expense entry and mileage tracking
- **Tax**: Quarterly tax estimates and payment tracking
- **Reports**: Generate and download PDF tax reports
- **Notifications**: Stay informed about deadlines and important updates
- **Accounts**: Connect and manage bank accounts via Plaid
- **Settings**: Profile, notification preferences, and security settings

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Hook Form
- Axios
- Headless UI
- Heroicons
- Recharts

## Project Structure

```
frontend/
├── src/
│   ├── app/           # Next.js App Router pages
│   │   ├── (auth)/    # Auth pages (login, register)
│   │   └── (dashboard)/ # Protected dashboard pages
│   ├── components/    # Reusable UI components
│   │   ├── layout/    # Layout components
│   │   └── ui/        # Base UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and API client
│   ├── store/         # Zustand stores
│   └── types/         # TypeScript types
├── public/            # Static assets
└── package.json
```

## API Integration

The frontend connects to the backend API at `http://localhost:3001/api`. Key endpoints:

- `/auth` - Authentication (login, register, Google OAuth)
- `/transactions` - Transaction management
- `/expenses` - Manual expense and mileage tracking
- `/tax` - Tax estimates and payments
- `/reports` - PDF report generation
- `/notifications` - In-app notifications
- `/accounts` - Bank account connections

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```
