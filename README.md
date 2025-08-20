# 🎾 Tennis Tournament App

A modern, cross-platform tennis tournament management application built with React Native (Expo), TypeScript, and Supabase.

## 🌟 Features

### 🏆 Tournament Management
- Create and manage tennis tournaments
- Add players to tournaments
- Track match scores and results
- Real-time leaderboard updates

### 👥 User Management
- **Master Admin**: Full system control, can create other admins
- **Admin**: Tournament management and user administration
- **Player**: View tournaments, matches, and leaderboards
- Secure authentication with email/password

### 📱 Cross-Platform Support
- **Mobile Apps**: iOS and Android (React Native/Expo)
- **Web App**: Desktop and mobile browsers (React Native Web)
- **Shared Database**: All platforms use the same Supabase backend
- **Real-time Updates**: Live data synchronization across platforms

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`
- Supabase account (free tier available)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd tennis-tournament-app

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your Supabase credentials
```

### Environment Variables
Create a `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
1. Create a Supabase project
2. Run the SQL script: `supabase-setup.sql`
3. Set up the master user: `npm run setup-master`

## 📱 Mobile Development

### Start Development Server
```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android    # Android
npm run ios        # iOS
```

### Build for Production
```bash
# Build for app stores
expo build:android
expo build:ios
```

## 🌐 Web Development

### Start Web Development Server
```bash
npm run web
```

### Build for Production
```bash
npm run build:web
```

### Test Production Build
```bash
npx serve web-build -p 3000
```

## 🚀 Deployment

### Web App (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Mobile Apps
- **Android**: Build with EAS Build or Expo Application Services
- **iOS**: Build with EAS Build or Expo Application Services

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Query** for server state management
- **Zustand** for client state management

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

### Styling
- **Custom Design System** with tennis theme
- **Responsive Design** for web and mobile
- **Platform-specific optimizations**

## 📊 Database Schema

### Core Tables
- `profiles`: User profiles and roles
- `tournaments`: Tournament information
- `matches`: Match details and scores
- `players`: Player tournament registrations

### Security
- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication flow

## 🎨 Design System

### Colors
- **Primary**: Tennis Green (#2E7D32)
- **Secondary**: Light Green (#4CAF50)
- **Surface**: White (#FFFFFF)
- **Background**: Light Gray (#F5F5F5)

### Typography
- **Web**: System fonts with web optimization
- **Mobile**: Native typography
- **Responsive**: Scales appropriately

## 🔧 Development Scripts

```bash
# User Management
npm run setup-master      # Create master user
npm run create-user       # Create admin/player users
npm run test-master       # Test master user
npm run fix-master        # Fix master profile
npm run check-profiles    # Check all profiles
npm run fix-user          # Fix user profile

# Development
npm start                 # Start Expo dev server
npm run web               # Start web dev server
npm run build:web         # Build web for production
```

## 🧪 Testing

```bash
npm test                  # Run Jest tests
```

## 📱 Platform Features

### Mobile-Specific
- Native performance optimization
- Offline capability
- Push notifications (future)
- Touch-optimized UI

### Web-Specific
- Responsive design
- PWA support
- Desktop navigation
- Browser optimization

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security (RLS)
- **Environment Variables**: Secure credential management

## 📈 Performance

### Web Optimization
- Code splitting
- Image optimization
- CDN delivery
- Caching strategies

### Mobile Optimization
- Native performance
- Efficient re-renders
- Optimized bundle size
- Platform-specific optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the code comments and README
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

## 🎉 Success Stories

Your Tennis Tournament App now supports:
- ✅ **Cross-platform development** with single codebase
- ✅ **Real-time data synchronization** across platforms
- ✅ **Modern, responsive design** for all devices
- ✅ **Secure, scalable backend** with Supabase
- ✅ **Easy deployment** to web and mobile platforms

Start organizing your tennis tournaments today! 🎾
