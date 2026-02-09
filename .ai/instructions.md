# Claude Development Guidelines

## Git Workflow

- **Do NOT auto-commit changes**
  - Make all changes and build/test them
  - Let the user review changes before committing
  - Only run `git commit` commands when explicitly asked by the user
  - The user will handle their own git workflow
- **Before committing, always run:**
  - `npm run build` - Verify the project compiles
  - `npm test` - Run all tests
  - `npm run lint` - Check for linting errors
  - Only proceed with commit if all checks pass

## Development Server

- **Do NOT stop the currently running dev server**
  - If `npm run dev` is already running in a terminal, leave it running
  - The user may be actively viewing the app in their browser
- **Always run `npm run build` in a terminal where nothing else is running**
  - Don't run build commands in the same terminal where dev server is active
  - Check which terminals have active processes before running build
  - If all terminals are busy, the command will fail - that's expected behavior
- **Use `npm run build` for testing changes**
  - After making changes, run build to verify they compile correctly
  - Don't try to start the dev server if it's already running

## Package Management

- **Always ask before installing new packages**
  - Don't run `npm install` without explicit user approval
  - Present the package name, purpose, and size if known
  - Suggest alternatives when appropriate (e.g., built-in solutions, lighter packages)
  - Explain why the package is needed and what problem it solves
  - Let the user decide whether to proceed with installation

## Opinion vs Implementation

- **When the user asks for your opinion or ideas:**
  - Provide suggestions and recommendations
  - Explain your reasoning and options
  - **Do NOT automatically implement** what you suggest
  - **Always ask the user how they want to proceed** before making changes
  - Wait for explicit approval or direction before implementing
- **Example phrases that indicate opinion requests:**
  - "What do you think?"
  - "How would you improve...?"
  - "What are your ideas?"
  - "Any suggestions?"

## General Guidelines

- Follow the existing code style and patterns in the project
- Test changes with `npm run build` before presenting them
- Use the design system and color palette established in the project

## Code Quality

- **Always follow ESLint rules, especially `react/no-unescaped-entities`:**
  - Use HTML entities for special characters in JSX text content
  - Replace apostrophes with `&apos;` or `'` (e.g., `don&apos;t` or `don't`)
  - Replace quotes with `&quot;` or `"` (e.g., `&quot;hello&quot;` or `"hello"`)
  - Replace `>` with `&gt;` and `<` with `&lt;` when needed
  - Alternatively, wrap text containing special characters in curly braces: `{"don't"}`
  - **Examples:**
    - ❌ Bad: `<p>Don't forget</p>`
    - ✅ Good: `<p>Don&apos;t forget</p>` or `<p>{"Don't forget"}</p>`
    - ❌ Bad: `<p>She said "hello"</p>`
    - ✅ Good: `<p>She said &quot;hello&quot;</p>` or `<p>{'She said "hello"'}</p>`

## CSS & Styling

- **Use flex/grid `gap` instead of margin-based spacing:**
  - Prefer `gap` utilities for spacing between elements
  - Use `flex flex-col gap-4` instead of `space-y-4`
  - Use `flex gap-2` instead of `space-x-2`
  - Use `flex items-center gap-2` instead of individual `mr-*` or `ml-*` on child elements
  - **Examples:**
    - ❌ Bad: `<div className="space-y-4"><h1>Title</h1><p>Text</p></div>`
    - ✅ Good: `<div className="flex flex-col gap-4"><h1>Title</h1><p>Text</p></div>`
    - ❌ Bad: `<button><FaIcon className="mr-2" />Label</button>`
    - ✅ Good: `<button className="flex items-center gap-2"><FaIcon />Label</button>`
    - ❌ Bad: `<div><h1 className="mb-4">Title</h1><p className="mb-8">Text</p></div>`
    - ✅ Good: `<div className="flex flex-col gap-4"><h1>Title</h1><p>Text</p></div>`
  - **Benefits:**
    - More maintainable and predictable spacing
    - Easier to adjust spacing globally
    - Cleaner markup without margin utilities on every child element
    - Better for responsive design with consistent gaps

- **Use `size-*` utility for square elements:**
  - Use `size-*` instead of `h-* w-*` when width and height are the same
  - **Examples:**
    - ❌ Bad: `<div className="h-16 w-16">`
    - ✅ Good: `<div className="size-16">`
    - ❌ Bad: `<FaIcon className="h-4 w-4" />`
    - ✅ Good: `<FaIcon className="size-4" />`
    - ❌ Bad: `<button className="h-12 w-12">`
    - ✅ Good: `<button className="size-12">`
  - **Benefits:**
    - More concise and readable
    - Easier to maintain (one utility instead of two)
    - Clearer intent that the element is square

- **Use the `<Icon>` component for all icons:**
  - Import the Icon component: `import { Icon } from '@/components/ui/icon';`
  - Pass the icon as a prop instead of using it directly
  - Use CVA size variants instead of manual width/height classes
  - Use CVA color variants for consistent theming
  - **Size Variants:**
    - `xs` = 12px (size-3)
    - `sm` = 16px (size-4) - default
    - `md` = 20px (size-5)
    - `lg` = 24px (size-6)
    - `xl` = 32px (size-8)
    - `2xl` = 40px (size-10)
    - `3xl` = 48px (size-12)
    - `4xl` = 64px (size-16)
  - **Color Variants:**
    - `default` - inherits current text color
    - `primary`, `secondary`, `accent`
    - `success`, `error`, `warning`, `info`
    - `muted`, `white`, `inherit`
  - **Examples:**
    - ❌ Bad: `<FaUser className="size-4 text-primary" />`
    - ✅ Good: `<Icon icon={FaUser} size="sm" color="primary" />`
    - ❌ Bad: `<FaTrophy className="size-8 text-white" />`
    - ✅ Good: `<Icon icon={FaTrophy} size="xl" color="white" />`
    - ❌ Bad: `<FaSpinner className="size-5 animate-spin" />`
    - ✅ Good: `<Icon icon={FaSpinner} size="md" className="animate-spin" />`
  - **Benefits:**
    - Consistent sizing across the application
    - Easier to maintain and update icon styles globally
    - Better TypeScript support with proper typing
    - Reduced duplication of size/color utilities
    - Can still override with className for special cases
