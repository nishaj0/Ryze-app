# Ryze - Gym Progress Tracker

A comprehensive gym progress tracking app built with Expo (React Native) and Node.js/Express.

## Features

- **Onboarding Flow**: Personalized setup based on goals, experience, and equipment
- **Prebuilt Splits**: Full Body 3x, PPL, and Bro Split with 55+ exercises
- **Workout Logger**: Track sets, reps, weight with progressive overload detection
- **Progress Tracking**: Charts for weight progression, volume, and personal records
- **Progress Photos**: Capture and compare progress photos over time
- **Body Metrics**: Track body weight and view trends
- **Offline Support**: MMKV storage for offline-first experience
- **Push Notifications**: Workout reminders and weekly check-ins

## Tech Stack

### Mobile App
- Expo (React Native) + TypeScript
- NativeWind (Tailwind CSS)
- Zustand (state management)
- TanStack Query (data fetching)
- React Navigation
- MMKV (local storage)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)
- JWT authentication

## Project Structure

```
gym-tracker-app/
├── api/                    # Backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── prisma/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
├── expo-app/              # Mobile app
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── store/
│   │   └── types/
│   └── package.json
└── package.json           # Root scripts
```

## Setup

### Prerequisites
- Node.js 18+
- npm
- Expo Go app (for mobile testing)

### Installation

1. **Install all dependencies:**
```bash
npm run setup
```

2. **Setup database:**
```bash
cd api
npx prisma migrate dev
npm run prisma:seed
```

3. **Start development servers:**
```bash
# Start both API and mobile app
npm run dev

# Or start individually:
npm run api:dev    # Backend on http://localhost:3000
npm run app:start  # Expo dev server
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Onboarding
- `POST /api/onboarding/complete` - Complete onboarding
- `GET /api/onboarding/recommended-splits` - Get split recommendations

### Splits
- `GET /api/splits` - List all splits
- `GET /api/splits/:id` - Get split details
- `PUT /api/splits/user/active` - Set active split
- `GET /api/splits/user/active` - Get active split

### Workouts
- `POST /api/sessions` - Start workout session
- `GET /api/sessions` - List sessions
- `PATCH /api/sessions/:id/complete` - Complete session
- `POST /api/sessions/rest` - Mark rest day
- `POST /api/sessions/exercises/:id/sets` - Log set

### Exercises
- `GET /api/exercises` - List exercises
- `GET /api/exercises/:id/alternatives` - Get alternatives

### Progress
- `GET /api/progress/overview` - Get progress overview
- `GET /api/progress/exercise/:id` - Exercise progression
- `GET /api/progress/muscle-volume` - Weekly muscle volume
- `GET /api/records` - Personal records

### Metrics
- `POST /api/metrics/body` - Log body weight
- `GET /api/metrics/body` - Get weight history

### Photos
- `POST /api/photos` - Upload progress photo
- `GET /api/photos` - List photos
- `DELETE /api/photos/:id` - Delete photo

## Database Schema

The app uses Prisma with the following main entities:
- User
- Split, SplitDay, SplitDayExercise
- Exercise, ExerciseAlternative
- UserSplit
- WorkoutSession, ExerciseLog, SetLog
- BodyMetric
- ProgressPhoto
- PersonalRecord

## Seed Data

The seed script includes:
- **3 Prebuilt Splits:**
  - Full Body 3x (beginner, 3 days)
  - Push/Pull/Legs (intermediate, 6 days)
  - Bro Split (5 days)

- **55+ Exercises** covering all major muscle groups with alternatives

## Development

### Backend
```bash
cd api
npm run dev              # Start dev server
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Reseed database
```

### Mobile App
```bash
cd expo-app
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
```

## Environment Variables

### Backend (api/.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### Mobile (expo-app/.env)
```
API_URL=http://localhost:3000/api
```

## Production Deployment

### Backend
1. Switch to PostgreSQL (update DATABASE_URL)
2. Deploy to Railway/Heroku/Render
3. Set environment variables

### Mobile
1. Configure EAS Build
2. Build for iOS/Android
3. Submit to app stores

## License

MIT
