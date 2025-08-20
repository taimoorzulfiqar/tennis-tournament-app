# Tennis Tournament App

A modern web application for organizing and managing tennis tournaments. Built with React, TypeScript, Vite, and Supabase.

## Features

- **User Management**: Master, Admin, and Player roles with different permissions
- **Tournament Management**: Create and manage tournaments with dates and descriptions
- **Match Tracking**: Schedule matches, track scores, and determine winners
- **Leaderboards**: Real-time rankings based on games won
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, tennis-themed interface with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS with custom tennis theme
- **State Management**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tennis-tournament-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

4. Set up the database:
   - Run the SQL script in `supabase-setup.sql` in your Supabase SQL editor
   - This creates all necessary tables, functions, and policies

5. Create the master user:
```bash
npm run setup-master
```

6. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Copy the contents of supabase-setup.sql
```

This creates:
- `profiles` table for user management
- `tournaments` table for tournament data
- `tournament_players` table for player assignments
- `matches` table for match tracking
- `get_tournament_leaderboard` function for rankings
- Row Level Security policies for data protection

## User Roles

### Master User
- Can create and delete admin users
- Full access to all features
- Email: `taimoorzulfiqar97@gmail.com`
- Password: `TechPM@321`

### Admin Users
- Can create tournaments and matches
- Can manage players and scores
- Can view all data

### Player Users
- Can view tournaments and matches
- Can see their own profile and rankings
- Limited access to admin features

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run setup-master` - Create master user
- `npm run create-user` - Create new user (CLI)
- `npm run test-master` - Test master user authentication

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for scripts | Yes |

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # API and utility functions
├── pages/         # Page components
├── stores/        # Zustand state stores
├── types/         # TypeScript type definitions
├── App.tsx        # Main app component
├── main.tsx       # App entry point
└── index.css      # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
