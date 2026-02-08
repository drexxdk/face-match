<h1 align="center">Face Match - Social Learning Game</h1>

<p align="center">
 A simple, non-competitive learning game designed to help people get to know each other
</p>

<p align="center">
  <a href="#about"><strong>About</strong></a> ·
  <a href="#use-cases"><strong>Use Cases</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a>
</p>
<br/>

## About

**Face Match** is an icebreaker game that helps people learn about each other in a fun, engaging way. Unlike competitive games, this is purely a social learning tool focused on building connections and familiarity within groups.

### Core Philosophy

- **Non-Competitive**: This is not about winning or losing, scores are just for engagement
- **Learning-Focused**: The goal is to help people remember facts about each other
- **Social Connection**: Builds relationships through shared experiences and discovery

## Use Cases

Perfect scenarios for this game include:

- 🏢 **New Employee Onboarding**: Help new hires learn about their colleagues
- 🎓 **New Student Integration**: Students getting to know classmates at the start of term
- 👥 **Team Building**: Existing teams learning more about each other
- 🎉 **Social Events**: Ice breaker for parties, meetups, or group gatherings
- 🏕️ **Camp/Workshop Groups**: Help participants connect in intensive group settings

## Features

### Game Management

- Create custom groups of people with photos and facts
- Host and manage game sessions with live player tracking
- Players join with simple codes and play on their own devices
- Each player progresses at their own pace while host monitors participation

### User Experience

- Sound effects and haptic feedback
- Smooth animations with Framer Motion
- Keyboard shortcuts for power users
- Avatar images with automatic fallbacks
- Responsive design for all devices

### Authentication

- Secure user authentication with Supabase
- Password reset and account management
- Admin routes for authenticated users

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth with cookie-based sessions
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([create one here](https://database.new))

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd face-match
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [database.new](https://database.new)
   - Run the database migrations (found in SQL files in the project)
   - Get your project URL and anon key from the API settings

   **Configure Email Authentication:**

   To enable email confirmations for new user sign-ups:
   1. Go to your Supabase project dashboard
   2. Navigate to **Authentication** > **Providers** > **Email**
   3. Make sure **Enable Email provider** is ON
   4. Enable **Confirm email** (this ensures users must verify their email)
   5. Optionally customize the email templates in **Authentication** > **Email Templates**

   **Email Configuration Options:**
   - **Development**: Supabase provides a built-in email service (limited sending, emails may go to spam)
   - **Production**: Configure a custom SMTP provider in **Project Settings** > **Auth** for reliable email delivery:
     - Recommended providers: SendGrid, AWS SES, Mailgun, Postmark
     - This prevents emails from being marked as spam and provides better deliverability

   **Site URL Configuration:**

   In **Authentication** > **URL Configuration**, set:
   - **Site URL**: Your production domain (e.g., `https://yourdomain.com`)
   - **Redirect URLs**: Add allowed redirect URLs including `http://localhost:3000/**` for development

4. **Configure environment variables**

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_SUPABASE_ANON_KEY]
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000) to see the app.

### Database Setup

The app requires several database tables. You'll need to run migrations in your Supabase SQL Editor to set up:

- `groups` - Group definitions
- `people` - People within groups
- `game_sessions` - Active game sessions
- `game_answers` - Player answers and scores

## Troubleshooting

### Email Issues

**Sign-up confirmation emails not being sent?**

1. **Check Supabase Auth Settings**:
   - Go to **Authentication** > **Providers** > **Email**
   - Ensure **Confirm email** is enabled
   - Check that **Enable Email provider** is ON

2. **Check Email Templates**:
   - Go to **Authentication** > **Email Templates**
   - Verify the "Confirm signup" template is enabled and configured
   - Test by clicking "Send test email"

3. **Check Spam Folder**:
   - Development emails from Supabase often end up in spam
   - Check junk/spam folders
   - For Gmail, check the Promotions tab

4. **For Production**:
   - Configure custom SMTP in **Project Settings** > **Auth**
   - Use a reputable email service (SendGrid, AWS SES, etc.)
   - Verify your domain to improve deliverability

5. **Check Supabase Logs**:
   - Go to **Logs** > **Auth Logs** in your Supabase dashboard
   - Look for sign-up events and any error messages

6. **Resend Confirmation**:
   - Users can click "Resend confirmation email" on the sign-up success page
   - Or use the Supabase auth dashboard to manually send confirmation emails

## Project Structure

```
face-match/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── game/              # Game flow pages
│   └── admin/             # Admin app pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and helpers
│   └── supabase/         # Supabase client setup
└── public/               # Static assets
```

## AI Development Guidelines

**For AI assistants (Claude, etc.):**

This is a **social learning game**, not a competitive application. Key context:

- The purpose is helping people get to know each other
- Target use cases: new employees, new students, team building
- Scores and timing are just for engagement, not competition
- Focus should be on ease of use and social connection

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT
