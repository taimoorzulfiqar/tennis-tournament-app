# User Setup Guide

This guide explains how to set up users with passwords in the Tennis Tournament App.

## User Types and Password Requirements

### 1. Master User
- **Email**: `taimoorzulfiqar97@gmail.com`
- **Password**: `TechPM@321`
- **Role**: `master`
- **Permissions**: Full system access, can create admin and player accounts

### 2. Admin Users
- **Password**: Required (minimum 6 characters)
- **Role**: `admin`
- **Permissions**: Can create/manage tournaments, schedule matches, view all profiles
- **Creation**: Can be created by master user through the admin dashboard

### 3. Player Users
- **Password**: Required (minimum 6 characters)
- **Role**: `player`
- **Permissions**: Can view tournaments/matches, update own profile, view leaderboards
- **Creation**: Can sign up directly or be created by master user

## Setting Up the Master User

### Step 1: Get Supabase Service Role Key
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the **service_role** key (not the anon key)

### Step 2: Update Environment Variables
Add the service role key to your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://apttvxzslzlgxmdvtuhe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Run the Setup Script
```bash
npm run setup-master
```

This will:
- Create the master user in Supabase Auth
- Set the password to `TechPM@321`
- Create the user profile in the database
- Auto-confirm the email

## Creating Additional Users

### Option 1: Self-Signup (Players and Admins)
Users can sign up directly through the app:
1. Open the app
2. Go to "Sign Up" screen
3. Fill in email, password, full name
4. Select role (player or admin)
5. Submit

### Option 2: Master User Creation
The master user can create accounts through the admin dashboard:
1. Sign in as master user
2. Go to "Admin" tab
3. Use "Create New User" form
4. Set email, password, full name, and role

## Password Security

### Requirements
- Minimum 6 characters
- Passwords are securely hashed by Supabase Auth
- No password recovery email is sent (users must contact admin)

### Best Practices
- Use strong, unique passwords
- Consider implementing password complexity requirements
- Regularly update passwords
- Never share passwords in plain text

## Authentication Flow

1. **Sign In**: Users enter email and password
2. **Validation**: Supabase validates credentials
3. **Profile Fetch**: App fetches user profile with role
4. **Access Control**: UI shows features based on user role
5. **Session Management**: Token-based authentication with automatic refresh

## Troubleshooting

### Master User Setup Issues
- Ensure service role key is correct
- Check that SQL script has been run
- Verify email format is correct
- Check Supabase logs for errors

### User Authentication Issues
- Verify email is confirmed (for self-signup)
- Check password meets minimum requirements
- Ensure user profile exists in database
- Check network connectivity

### Role-Based Access Issues
- Verify user profile has correct role
- Check RLS policies are properly configured
- Ensure user is signed in with valid session

## Security Notes

- Service role key has full database access - keep it secure
- Never expose service role key in client-side code
- Use environment variables for all sensitive data
- Regularly audit user permissions and roles
- Monitor authentication logs for suspicious activity
