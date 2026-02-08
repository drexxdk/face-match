# Testing

This project uses Jest with React Testing Library for unit testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Fully Tested (100% coverage)

#### lib/utils.ts

- `cn()` - Class name merging with Tailwind support
- `isValidEmail()` - Email validation
- `formatDate()` - Date formatting
- `formatDateTime()` - Date and time formatting
- `formatNumber()` - Number formatting with locale support
- `capitalize()` - String capitalization
- `sleep()` - Async delay utility

#### lib/logger.ts

- `logger.log/warn/error/info/debug()` - Development logging
- `logError()` - Production error logging
- `getErrorMessage()` - Error message extraction

#### lib/game-utils.ts

- `generateGameCode()` - Random game code generation
- `deletePersonImage()` - Supabase storage image deletion
- `endGameSession()` - Game session completion
- `getRandomIcebreakerTip()` - Random tip selection
- `formatTime()` - Seconds to MM:SS conversion
- `formatScorePercentage()` - Score percentage calculation
- `truncate()` - Text truncation with ellipsis
- `getInitials()` - Name to initials conversion

#### components/ui/section-card.tsx

- `SectionCard` - Reusable card component with consistent spacing
- `InfoListCard` - Specialized card for ordered/unordered lists

## Test Files

- `lib/utils.test.ts` - 20 tests covering utility functions
- `lib/logger.test.ts` - 15 tests covering logging functionality
- `lib/game-utils.test.ts` - 35 tests covering game utilities
- `components/ui/section-card.test.tsx` - 22 tests covering card components

## Test Principles

1. **Pure Functions First** - Utility functions and helpers are easiest to test
2. **Mock External Dependencies** - Supabase clients, routers, etc. are mocked
3. **Locale Awareness** - Tests handle different locale formatting (commas, dots, etc.)
4. **Edge Cases** - Tests cover null, empty, and boundary conditions
5. **Component Testing** - UI components tested for rendering and behavior

## Future Test Candidates

Areas that could benefit from additional testing:

- Custom hooks (use-game-state, use-realtime, etc.)
- Form validation components
- Complex UI components with user interactions
- API route handlers
- Authentication flows
