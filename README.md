# One Question - 오늘의 질문

React Native + Expo 기반 모바일 앱

## 🚀 Tech Stack

- **Platform**: Expo SDK 54 (React Native 0.81)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router v6
- **State Management**:
  - TanStack Query v5 (server state)
  - Zustand v5 (client state)
- **UI**: React Native + Tamagui (planned)
- **Animation**: React Native Reanimated v4
- **Architecture**: New Architecture Enabled

## 📁 Project Structure

```
src/
├── app/              # Expo Router screens
├── features/         # Feature-based modules
├── services/         # API client, query client
├── stores/           # Zustand stores
├── shared/           # Shared UI components
├── hooks/            # Custom hooks
├── types/            # TypeScript types
├── constants/        # App constants
├── utils/            # Utility functions
└── assets/           # Images, fonts, etc.
```

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20.19.4
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📝 Development Status

✅ Project initialization
✅ Core dependencies installed
✅ Folder structure created
✅ TypeScript & Babel configured
✅ Path aliases (@/) setup
✅ API client & Query client setup
⏳ UI prototype (next step)
⏳ Authentication (future)

## 🎯 Development Plan

1. **Phase 1 (Current)**: UI Prototype without authentication
2. **Phase 2**: Feature implementation with mock data
3. **Phase 3**: Backend integration
4. **Phase 4**: Authentication & production release

## 📖 Architecture Reference

See [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) for detailed architecture guidelines.
