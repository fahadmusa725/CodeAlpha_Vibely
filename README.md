# Vibely

Vibely is an Instagram-style social media application built with the MERN stack.

![React](https://img.shields.io/badge/React-19.2.8-blue)
![Vite](https://img.shields.io/badge/Vite-8.3.0-purple)
![React Router](https://img.shields.io/badge/React_Router-7.18.4-red)
![Recharts](https://img.shields.io/badge/Recharts-3.10.1-22b5bf)
![Axios](https://img.shields.io/badge/Axios-1.20.0-5a29e4)
![Node.js](https://img.shields.io/badge/Node.js-Express_4.21.2-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8.9.5-brightgreen)
![Cloudinary](https://img.shields.io/badge/Cloudinary-2.5.1-blue)
![JWT](https://img.shields.io/badge/JWT-9.0.2-black)
![bcryptjs](https://img.shields.io/badge/bcryptjs-3.0.2-teal)

Live demo: <https://vibely-e8zu.vercel.app>

Built during the CodeAlpha internship.

## Overview

Vibely provides a complete media sharing and creator interaction workflow. Users can publish single or multi-image posts, share 24-hour expiring stories, interact through threaded comments and likes, follow creators, and manage their profile and saved collection. An admin dashboard provides platform-wide metrics and user moderation.

## Features

- Authentication: User registration, login, current session check, password change, and token-based password reset via email
- Profiles: Custom avatar, cover photo, bio, location, website link, and follower/following counts and lists
- Posts: Upload up to 10 images per post with captions and hashtags, edit captions and media, delete posts, toggle likes, and toggle saves
- Comments: Add comments to posts, delete own comments, and pin comments (author)
- Stories: Create image stories that expire after 24 hours, view active stories by creator, mark stories as viewed, and delete own stories
- Feed and Discovery: Chronological feed of posts from followed creators, discover grid with tag-based filtering, and trending hashtags
- Search and Suggestions: Live user search across usernames and full names, along with suggested creators to follow
- Notifications: In-app notifications for likes, comments, and follows, with unread counters and read status updates
- Admin Dashboard: Platform overview showing total users, posts, stories, user growth charts, account type breakdown, recent posts, recent signups, trending tags, user management table with search and filters, verified badge toggling, and user deletion
- Theme: Dark and light theme switcher with preference stored in local storage

## Local Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

Set the required environment variables in `server/.env`. The backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

On Windows PowerShell:

```powershell
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. In development, Vite proxies requests from `/api` to `http://localhost:5000`.

## Seed Data

To populate the database with creator accounts, posts, comments, stories, and follow relationships:

```bash
cd server
npm run seed
```

The seed script deletes existing records that have `isSeeded: true`, `@vibely.app` email domains, or matching seed usernames, then inserts 15 creator profiles. All seeded user accounts use the password `password123`.

To backfill hashtags on existing posts:

```bash
cd server
npm run backfill:hashtags
```

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port for the Express server. Defaults to `5000`. |
| `MONGODB_URI` | MongoDB connection URI string. |
| `JWT_SECRET` | Secret key for signing JWT tokens. The server exits on startup if this is not set. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media uploads. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `CLIENT_URL` | Comma-separated list of allowed frontend origins for CORS. In development, defaults to `http://localhost:5173` if unset. In production, `CLIENT_URL` must be set because CORS denies all origins when it is empty. |
| `NODE_ENV` | Environment mode (`development` or `production`). Enables Morgan logging when not `production`. |
| `EMAIL_SERVICE` | Nodemailer email service (for example, `gmail`). Used for password reset emails. |
| `EMAIL_USER` | Nodemailer email address. |
| `EMAIL_PASS` | Nodemailer app password. |
| `EMAIL_FROM` | Sender display string (for example, `Vibely <your_email@example.com>`). |
| `ADMIN_EMAIL` | Email address for initial admin account creation or promotion on server start. |
| `ADMIN_PASSWORD` | Password for the admin account (minimum 6 characters). |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL. Optional in development (Vite proxies `/api` to `http://localhost:5000`). Required in production deployments where the API is hosted separately. |

## Project Structure

```text
Vibely/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── stories/
│   │   │   │   ├── CreateStoryModal.jsx / .css
│   │   │   │   ├── StoriesTray.jsx / .css
│   │   │   │   └── StoryViewerModal.jsx / .css
│   │   │   ├── CreatePostModal.jsx / .css
│   │   │   ├── LeftSidebar.jsx / .css
│   │   │   ├── MobileNav.jsx / .css
│   │   │   ├── Navbar.jsx / .css
│   │   │   ├── PostCard.jsx / .css
│   │   │   ├── PostDetailModal.jsx / .css
│   │   │   ├── RightSidebar.jsx / .css
│   │   │   └── VerifiedBadge.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AccountsDonut.jsx / .css
│   │   │   │   ├── AdminLayout.jsx / .css
│   │   │   │   ├── EmptyState.jsx / .css
│   │   │   │   ├── ListSkeleton.jsx / .css
│   │   │   │   ├── Overview.jsx / .css
│   │   │   │   ├── QuickActions.jsx / .css
│   │   │   │   ├── RecentPostsCard.jsx / .css
│   │   │   │   ├── RecentSignupsCard.jsx / .css
│   │   │   │   ├── StatCard.jsx / .css
│   │   │   │   ├── TopUsersCard.jsx / .css
│   │   │   │   ├── TrendingCard.jsx / .css
│   │   │   │   ├── TrendLine.jsx / .css
│   │   │   │   ├── UserGrowthChart.jsx / .css
│   │   │   │   ├── UsersSection.jsx / .css
│   │   │   │   └── adminUtils.js
│   │   │   ├── Auth.jsx / .css
│   │   │   ├── Explore.jsx / .css
│   │   │   ├── Feed.jsx / .css
│   │   │   ├── ForgotPassword.jsx / .css
│   │   │   ├── Notifications.jsx / .css
│   │   │   ├── PostPage.jsx / .css
│   │   │   ├── Profile.jsx / .css
│   │   │   ├── ResetPassword.jsx / .css
│   │   │   ├── Saved.jsx / .css
│   │   │   ├── Search.jsx / .css
│   │   │   └── Settings.jsx / .css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.jsx / .css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── config/
    │   ├── cloudinary.js
    │   └── db.js
    ├── controllers/
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── commentController.js
    │   ├── notificationController.js
    │   ├── postController.js
    │   ├── storyController.js
    │   └── userController.js
    ├── middleware/
    │   ├── adminOnly.js
    │   ├── auth.js
    │   ├── optionalAuth.js
    │   └── upload.js
    ├── models/
    │   ├── Comment.js
    │   ├── Notification.js
    │   ├── Post.js
    │   ├── Story.js
    │   └── User.js
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── commentRoutes.js
    │   ├── notificationRoutes.js
    │   ├── postRoutes.js
    │   ├── storyRoutes.js
    │   └── userRoutes.js
    ├── scripts/
    │   └── ensureAdmin.js
    ├── seed/
    │   ├── backfillHashtags.js
    │   └── seed.js
    ├── utils/
    │   ├── email.js
    │   └── notify.js
    ├── .env.example
    ├── package.json
    └── server.js
```

## Security, CORS and Rate Limiting

- CORS configuration: Allowed origins are set by `CLIENT_URL` (comma-separated origins). In production (`NODE_ENV=production`), `CLIENT_URL` must be set because CORS denies all origins when it is empty.
- Rate limiting:
  - `POST /api/auth/register` and `POST /api/auth/login` are restricted to 10 requests per 15-minute window per IP.
  - `POST /api/auth/forgot-password` and `POST /api/auth/reset-password/:token` are restricted to 5 requests per 1-hour window per IP.
- Helmet security headers are applied to all HTTP responses.
- Protected endpoints require an `Authorization: Bearer <token>` header verified by JWT. Admin endpoints require an account with `role: 'admin'`.

## API Endpoints

All routes are prefixed with `/api`. Endpoints marked `(auth)` require an `Authorization: Bearer <token>` header.

### Auth (`/api/auth`)

- `POST /register`: Register user (rate limited)
- `POST /login`: Log in user (rate limited)
- `GET /me`: Current user (auth)
- `PUT /change-password`: Change password (auth)
- `POST /forgot-password`: Request reset token via email (rate limited)
- `POST /reset-password/:token`: Reset password with token (rate limited)

### Users (`/api/users`)

- `GET /search`: Search users by query
- `GET /suggested`: Suggested users
- `GET /me/saved`: Saved posts for authenticated user (auth)
- `GET /me/contacts`: Following contacts for authenticated user (auth)
- `GET /:username`: User profile and posts
- `PUT /profile`: Update user profile details (auth)
- `PUT /media`: Upload avatar or cover photo (auth)
- `POST /:id/follow`: Follow or unfollow user (auth)
- `GET /:id/followers`: Followers list
- `GET /:id/following`: Following list

### Posts (`/api/posts`)

- `POST /`: Create post with up to 10 images (auth)
- `GET /feed`: Feed posts from followed users (auth)
- `GET /discover`: Discover explore grid
- `GET /trending-tags`: Trending hashtags
- `GET /:id`: Post details with comments
- `PATCH /:id`: Edit post caption or images (auth)
- `DELETE /:id`: Delete post (auth)
- `POST /:id/like`: Toggle like on post (auth)
- `POST /:id/save`: Toggle save on post (auth)

### Comments (`/api/comments`)

- `POST /:postId`: Add comment to post (auth)
- `GET /:postId`: Get comments for post
- `DELETE /:id`: Delete comment (auth)
- `PATCH /:id/pin`: Pin or unpin comment (auth)

### Stories (`/api/stories`)

- `POST /`: Create story with single image (auth)
- `GET /feed`: Stories feed grouped by creator (auth)
- `POST /:id/view`: Mark story as viewed (auth)
- `DELETE /:id`: Delete story (auth)

### Notifications (`/api/notifications`)

- `GET /`: Get notifications list (auth)
- `GET /unread-count`: Get unread count (auth)
- `PATCH /read-all`: Mark all notifications as read (auth)
- `PATCH /:id/read`: Mark single notification as read (auth)

### Admin (`/api/admin`)

Requires authenticated user with `role === 'admin'`.

- `GET /stats`: Aggregated metrics, registration trends, and top creators
- `GET /posts/recent`: Recent posts with metrics
- `GET /users`: Paginated user list with search, filter, and sorting
- `PATCH /users/:id/verify`: Toggle verified badge on user
- `DELETE /users/:id`: Delete user account and associated content
