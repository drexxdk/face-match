# Face Match - GitHub Copilot Instructions

## AI Assistant Workflow Guidelines

### Git Workflow

- **Never auto-commit changes** - Let the user review and commit when ready
- Only run `git commit` commands when explicitly requested
- Before committing, always run: `npm run build`, `npm test`, `npm run lint`
- Only proceed with commit if all checks pass

### Development Server

- **Never stop running dev servers** - User may be viewing the app
- Run `npm run build` in a different terminal than the dev server
- Use build command to verify changes compile correctly

### Package Management

- **Always ask before installing packages**
- Explain package purpose, size, and alternatives
- Let user decide whether to proceed

### Opinion vs Implementation

- When user asks for opinions/suggestions, provide recommendations but **wait for approval before implementing**
- Example phrases: "What do you think?", "How would you improve?", "Any suggestions?"

## Project Overview

Face Match is a Next.js-based social icebreaker game that helps people learn names and faces in groups. It's designed for team building, onboarding new employees/students, and social events. The focus is on learning and social connection, not competition.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Custom components based on Headless UI patterns
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with cookie-based sessions
- **Real-time**: Supabase Realtime for live game updates
- **Storage**: Supabase Storage for person images
- **State Management**: React hooks + SWR for data fetching
- **Animations**: Framer Motion
- **Icons**: react-icons (fa6)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library

## Project Structure

```
app/                    # Next.js App Router pages
├── actions/           # Server actions
├── admin/             # Admin dashboard and group management
│   └── groups/[id]/  # Group detail and game hosting
├── auth/              # Authentication pages (login, signup, etc.)
├── game/              # Player-facing game pages (join, play, results)
└── offline/           # Offline fallback page

components/            # React components
├── ui/               # Reusable UI components (buttons, cards, dialogs, etc.)
├── providers/        # Context providers
├── pwa/              # PWA-specific components (service worker, install prompt)
├── game/             # Game-specific components
└── auth/             # Auth-specific components

lib/                   # Utility libraries
├── supabase/         # Supabase client configuration
├── hooks/            # Custom React hooks
└── security/         # Security utilities

public/               # Static assets
├── icons/            # PWA icons
└── sw.js             # Service worker
```

## Core Features

### 1. Group Management

- Create groups with custom names
- Add people to groups with names, photos, and gender
- Edit/delete people and groups
- Duplicate groups for reuse
- Bulk upload people via CSV

### 2. Game Modes

- **Guess the Name**: Show photo, player picks correct name from options
- **Guess the Face**: Show name, player picks correct photo from options

### 3. Game Flow

1. Host creates a group and adds people with photos
2. Host starts a game session with custom settings (timer, options count, questions)
3. Game generates a unique code
4. Players join using the code on their own devices
5. Players answer questions at their own pace
6. Host monitors real-time progress
7. Results show scores and statistics

### 4. Real-time Features

- Live player presence tracking
- Real-time answer updates for host
- Online/offline player status

## Coding Conventions

### Components

- Use functional components with TypeScript
- Export components as named exports for better tree-shaking
- Use `'use client'` directive for client components
- Wrap client-only code in `typeof window !== 'undefined'` checks
- Use `suppressHydrationWarning` for components with dynamic content

### Styling

- Use Tailwind CSS utility classes
- Follow consistent spacing scale (gap-2, gap-3, gap-4, gap-6, gap-12)
- Use semantic color tokens (`primary`, `secondary`, `destructive`, `muted`, etc.)
- Responsive design with mobile-first approach
- Use `group` and `group-hover` for hover states on parent elements
- **Prefer `gap` over margin-based spacing** - Use `flex gap-4` instead of `space-y-4` or individual margins
- **Use `size-*` for square elements** - Use `size-16` instead of `h-16 w-16`
- **Use the `<Icon>` component for all icons**:
  - Import: `import { Icon } from '@/components/ui/icon'`
  - Pass icon as prop: `<Icon icon={FaUser} size="sm" color="primary" />`
  - Size variants: xs (12px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (40px), 3xl (48px), 4xl (64px)
  - Color variants: default, primary, secondary, accent, success, error, warning, info, muted, white

### State Management

- Use React hooks for local state
- Use SWR for data fetching with automatic revalidation
- Use Supabase Realtime for live updates
- Use Loading Context for global loading state

### Navigation

- Use `LoadingLink` component instead of plain Next.js `Link` for route transitions
- Show loading states with spinners in buttons (`loading` prop)
- Use `useRouter` from `next/navigation` for programmatic navigation
- Set global loading state with `setLoading(true)` before navigation

### Forms

- Use controlled inputs with React state
- Validate inputs with Zod schemas
- Show real-time validation errors
- Use `loading` prop on submit buttons
- Disable inputs during submission

### Images

- Use Next.js `Image` component with proper width/height or fill
- Implement image cropping for person photos (1:1 aspect ratio)
- Store images in Supabase Storage (`person-images` bucket)
- Validate image types (JPEG/PNG) and size (max 1MB)
- Compress images to JPEG with 0.85 quality

### Database

- Use Supabase client from `@/lib/supabase/client` or `@/lib/supabase/server`
- Use server-side client for Server Components and API routes
- Use generated TypeScript types from `lib/database.types.ts`
- Use Row Level Security (RLS) policies for data access
- Query with `.select()` and relation joins (e.g., `groups(*)`)

### Error Handling

- Use try/catch for async operations
- Log errors with `logError()` from `@/lib/logger`
- Show user-friendly error messages with toast notifications
- Use `ErrorMessage` component for inline errors
- Return meaningful error messages from server actions

### Accessibility

- Use semantic HTML elements
- Add proper ARIA labels and roles
- Ensure keyboard navigation works
- Use proper heading hierarchy
- Add loading/disabled states to interactive elements

### Code Quality

- **Follow ESLint rules, especially `react/no-unescaped-entities`**:
  - Use HTML entities for special characters in JSX text content
  - Replace apostrophes with `&apos;` or use curly braces: `{"don't"}`
  - Replace quotes with `&quot;` or use curly braces: `{'She said "hello"'}`
  - Examples:
    - ❌ Bad: `<p>Don't forget</p>`
    - ✅ Good: `<p>Don&apos;t forget</p>` or `<p>{"Don't forget"}</p>`

### Performance

- Use `memo()` for expensive components
- Lazy load heavy components with dynamic imports
- Optimize images with Next.js Image component
- Use SWR for efficient data fetching and caching
- Implement proper loading states to prevent layout shift

## Important Patterns

### Button States

All buttons should support loading states:

```tsx
<Button loading={isLoading} loadingText="Saving..." disabled={!isValid}>
  Submit
</Button>
```

### Modal Patterns

- Use Dialog component from `@/components/ui/dialog`
- Control with `open` and `onOpenChange` props
- Hide form buttons when showing cropper UI
- Reset state when modal opens/closes

### Real-time Subscriptions

- Subscribe to channels in `useEffect`
- Clean up subscriptions on unmount
- Use presence for online/offline status
- Handle reconnection gracefully

### Server Actions

- Mark with `'use server'` directive
- Validate inputs with Zod schemas
- Return structured responses with success/error
- Handle authentication checks

### PWA Features

- Service worker for offline support
- Install prompt for mobile devices
- Update notifications (only show for PWA/mobile, not desktop)
- Manifest file with app metadata

## Security Best Practices

- Sanitize all user inputs
- Validate file uploads (type, size, content)
- Use parameterized queries (Supabase handles this)
- Implement proper RLS policies
- Don't expose sensitive data in client code
- Use environment variables for secrets
- Validate session on server-side

## Testing Guidelines

- Write unit tests for utility functions
- Test components with React Testing Library
- Mock Supabase client in tests
- Test error handling paths
- Use meaningful test descriptions

## Common Issues & Solutions

### Service Worker Updates

- Only show update prompt for PWA/mobile users
- Desktop browsers should silently update
- Check `window.matchMedia('(display-mode: standalone)')` for PWA status

### Image Upload

- Validate file type and size before upload
- Compress images to reduce storage costs
- Use unique filenames with timestamps
- Handle upload errors gracefully

### Real-time Connection

- Handle disconnections and reconnections
- Clean up presence when user leaves
- Use stable IDs for presence tracking
- Debounce rapid updates

### Loading States

- Show loading indicator immediately on action
- Reset loading state on error or success
- Use global loading overlay for page transitions
- Button loading states for form submissions

## Code Style Preferences

- Use descriptive variable names
- Prefer `const` over `let`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use template literals for string interpolation
- Group related code with comments
- Keep functions focused and small
- Extract complex logic into utility functions
- Use TypeScript for type safety

## Design System

### Colors

- Primary: Blue gradient
- Secondary: Gray tones
- Destructive: Red for errors/delete
- Success: Green for positive actions
- Muted: Low-emphasis text and backgrounds

### Spacing

- Use consistent spacing scale (2, 3, 4, 6, 8, 12)
- Gap for flex/grid layouts
- Padding for internal spacing
- Margin sparingly (prefer gap/padding)

### Typography

- Headings: text-2xl, text-3xl, text-4xl with font-bold or font-semibold
- Body: text-sm, text-base with standard weight
- Muted text: text-muted-foreground class

### Components

- Cards with variant="compact" or variant="flush"
- Buttons with proper size (sm, default, lg) and variant
- Icons from react-icons with consistent sizing
- Loading spinners with animate-spin
- Badges for status and counts

## When to Use What

### Client vs Server Components

- **Client**: Interactive elements, hooks, browser APIs, event handlers
- **Server**: Data fetching, database queries, authentication checks

### Link vs LoadingLink

- **Link**: Static navigation without loading state
- **LoadingLink**: Dynamic navigation with loading indicator

### State vs SWR

- **useState**: Local UI state (forms, modals, toggles)
- **SWR**: Server data that needs caching and revalidation

### Toast vs ErrorMessage

- **toast**: Temporary notifications (success, error, info)
- **ErrorMessage**: Persistent inline error display

## Git Workflow

- Write clear commit messages
- Keep commits focused and atomic
- Test changes before committing
- Update documentation when needed

## Additional Notes

- This is a learning/social tool, not a competitive game
- Focus on user experience and smooth interactions
- Prioritize mobile experience (many users will play on phones)
- Keep the UI clean and intuitive
- Performance matters (fast loading, smooth animations)
- Error messages should be helpful and actionable
