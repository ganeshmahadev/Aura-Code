# Authentication Setup Guide

This guide will help you set up user authentication and project management for AuraCode.

## 🚀 Quick Setup

### 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to **Settings** → **API**
3. Copy your **Project URL** and **anon key**

### 2. Environment Configuration

Update your `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Schema

Run the SQL schema in your Supabase project:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **Run** to execute the schema

This will create:
- `profiles` table for user information
- `sessions` table for user projects
- Row Level Security policies
- Automatic triggers and functions

### 4. Install Dependencies

```bash
cd frontend
npm install
```

The authentication system uses `@supabase/supabase-js` which has been added to your package.json.

### 5. Start Development

```bash
npm run dev
```

## 🔐 Authentication Flow

### For New Users:
1. Visit the homepage - they'll see the landing page
2. Click "Sign up" to create an account
3. After email confirmation, they'll be logged in
4. Homepage will show their empty workspace

### For Returning Users:
1. Visit the homepage - they'll see the login page if not authenticated
2. After login, homepage shows their project workspace
3. Can click on project cards to resume work
4. Can create new projects

### Project Management:
- **New Project**: Creates a new session in the database
- **Resume Project**: Loads existing session with saved state
- **Auto-save**: Session title and metadata are automatically updated
- **Project Cards**: Show project thumbnails, titles, and last updated time

## 📊 Database Schema

### Profiles Table
- Links to Supabase auth.users
- Stores additional user metadata
- Auto-created on user signup

### Sessions Table
- Stores user projects/workspaces
- Tracks sandbox IDs, URLs, and metadata
- Supports project thumbnails and descriptions

## 🛡️ Security Features

- **Row Level Security**: Users can only access their own data
- **Authentication Required**: Protected routes require login
- **Automatic Profile Creation**: New users get profiles automatically
- **Session Isolation**: Projects are private to each user

## 🎨 UI Components

### New Components Added:
- `Auth` - Login/signup screen
- `SessionCard` - Individual project card
- `SessionsGrid` - Workspace layout with project grid
- `ProtectedRoute` - Route protection wrapper
- `AuthContext` - Authentication state management

### Updated Components:
- `App.tsx` - Added authentication routing
- `Create/index.tsx` - Integrated session management
- Homepage now shows workspace for logged-in users

## 🔧 Customization

### Styling
All components use your existing design system with:
- Dark theme support
- Glassmorphism effects
- Consistent color palette
- Responsive design

### Session Management
- Sessions auto-save title from first message
- Projects track sandbox IDs and URLs
- Support for project thumbnails (future enhancement)

## 🐛 Troubleshooting

### Common Issues:

1. **Authentication not working**
   - Check Supabase URL and anon key in .env
   - Verify SQL schema was executed successfully

2. **Sessions not saving**
   - Check RLS policies are set up correctly
   - Verify user is authenticated before creating sessions

3. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that TypeScript types are properly imported

### Environment Variables
Make sure your `.env` file is in the `frontend/` directory and contains:
```env
VITE_BEAM_WS_URL=wss://lovable-agent-32a2c27-v3.app.beam.cloud
VITE_BEAM_TOKEN=RXIikfUgLJpEqLpA2t3CSOzoV058gII4jxJzbZqWxExLXb7PQsmqUnKWf6Vti4Qmha9LQF4yS-dGAfJQQbZY1Q==
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🎯 Next Steps

With authentication set up, you can now:

1. **Test the full flow**: Sign up → Create project → Resume project
2. **Add project thumbnails**: Capture screenshots of generated apps
3. **Implement project sharing**: Allow users to share public projects
4. **Add project templates**: Pre-built starting points
5. **Analytics**: Track user engagement and popular features

Your AuraCode platform now has a complete authentication and project management system! 🚀