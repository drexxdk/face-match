# Icon Component

A reusable icon wrapper component built with CVA (class-variance-authority) for consistent icon sizing and theming across the application.

## Features

- **Consistent sizing** with predefined variants
- **Theme-aware colors** that work with light/dark modes
- **TypeScript support** with proper type checking
- **Flexible overrides** via className prop
- **Accessibility** support with aria attributes

## Installation

The Icon component is already set up in the project. Simply import it:

```tsx
import { Icon } from '@/components/ui/icon';
import { FaUser } from 'react-icons/fa6';
```

## Basic Usage

```tsx
// Simple icon with default size (md = 20px)
<Icon icon={FaUser} />

// Icon with custom size
<Icon icon={FaUser} size="lg" />

// Icon with color variant
<Icon icon={FaUser} size="md" color="primary" />

// Icon with custom className for additional styling
<Icon icon={FaUser} size="xl" className="animate-spin" />
```

## Size Variants

| Variant | Size | Tailwind Classes   |
| ------- | ---- | ------------------ |
| `xs`    | 12px | `size-3`           |
| `sm`    | 16px | `size-4`           |
| `md`    | 20px | `size-5` (default) |
| `lg`    | 24px | `size-6`           |
| `xl`    | 32px | `size-8`           |
| `2xl`   | 40px | `size-10`          |
| `3xl`   | 48px | `size-12`          |
| `4xl`   | 64px | `size-16`          |

## Color Variants

| Variant     | Usage                         |
| ----------- | ----------------------------- |
| `default`   | Inherits current text color   |
| `primary`   | Primary brand color           |
| `secondary` | Secondary brand color         |
| `accent`    | Accent color                  |
| `success`   | Green (light: 600, dark: 400) |
| `error`     | Red/destructive color         |
| `warning`   | Yellow/amber (600/400)        |
| `info`      | Blue (600/400)                |
| `muted`     | Muted/subdued text color      |
| `white`     | Pure white                    |
| `inherit`   | No color applied              |

## Common Patterns

### Icons in Buttons

```tsx
<button className="flex items-center gap-2">
  <Icon icon={FaPlus} size="sm" />
  Add Item
</button>
```

### Icons in Cards

```tsx
<div className="flex items-center gap-3">
  <Icon icon={FaUser} size="lg" color="primary" />
  <h3>User Profile</h3>
</div>
```

### Loading Spinners

```tsx
<Icon icon={FaSpinner} size="md" className="animate-spin" />
```

### Status Indicators

```tsx
<div className="flex items-center gap-2">
  <Icon icon={FaCheck} size="sm" color="success" />
  <span>Completed</span>
</div>

<div className="flex items-center gap-2">
  <Icon icon={FaXmark} size="sm" color="error" />
  <span>Failed</span>
</div>
```

### Featured Icons (Large)

```tsx
<div className="flex flex-col items-center gap-4">
  <div className="bg-gradient-primary flex size-16 items-center justify-center rounded-2xl">
    <Icon icon={FaTrophy} size="xl" color="white" />
  </div>
  <h3>Learn Together</h3>
</div>
```

## Accessibility

The Icon component supports all standard aria attributes:

```tsx
// Decorative icon
<Icon icon={FaUser} aria-hidden />

// Icon with label
<Icon icon={FaUser} aria-label="User profile" />
```

## Migration Guide

### Before (Direct Icon Usage)

```tsx
import { FaUser } from 'react-icons/fa6';

<FaUser className="size-4 text-primary" />
<FaTrophy className="size-8 text-white" />
<FaSpinner className="size-5 animate-spin" />
```

### After (Icon Component)

```tsx
import { Icon } from '@/components/ui/icon';
import { FaUser, FaTrophy, FaSpinner } from 'react-icons/fa6';

<Icon icon={FaUser} size="sm" color="primary" />
<Icon icon={FaTrophy} size="xl" color="white" />
<Icon icon={FaSpinner} size="md" className="animate-spin" />
```

## Benefits

1. **Consistency**: All icons use the same size scale across the app
2. **Maintainability**: Change icon sizes globally by updating variants
3. **Type Safety**: TypeScript ensures correct prop usage
4. **Cleaner Code**: Less repetition of size/color classes
5. **Flexibility**: Can still override with className for edge cases
6. **Documentation**: Clear size variants make it easy to choose the right size

## TypeScript

The Icon component is fully typed:

```tsx
import type { IconType } from 'react-icons';

interface IconProps extends VariantProps<typeof iconVariants> {
  icon: IconType;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}
```

## Examples in the Codebase

See these files for real-world usage examples:

- `app/page.tsx` - Landing page with various icon sizes
- `components/ui/button.tsx` - Loading spinner in buttons
- `components/ui/error-message.tsx` - Status icons with color variants
