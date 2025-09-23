# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LingoLoopAI is a Next.js-based speech transcription and analysis platform that provides:

- **Audio Upload & Management**: Direct-to-GCS upload with resumable sessions, metadata extraction, and quota enforcement
- **Speech Transcription**: Google Cloud Speech-to-Text API integration with both sync and async processing
- **Transcript Analysis**: AI-powered sentence structure and grammar analysis using Google Gemini
- **User Authentication**: JWT-based auth with refresh tokens, Google OAuth integration, and session management
- **Interactive Transcript Player**: Real-time audio playback with word/segment highlighting and analysis display
- **Learning Analytics**: Comprehensive user progress tracking with session metrics and achievements

## Core Architecture

### Data Models (Prisma)
- **User**: Authentication, settings, and relationships to all user data
- **AudioFile**: Audio metadata, GCS storage info, upload status, and duration
- **TranscriptRun**: Transcription results with versioning, engine configuration, and status tracking
- **Analysis**: AI-powered sentence/grammar analysis results with deduplication
- **Job**: Background task queue for long-running operations
- **AuditLog**: Comprehensive audit trail for all user actions
- **UsageLog**: Daily quota enforcement and usage tracking
- **SharedBbcResource**: BBC content management with subscription-based access control
- **Subscription**: User subscription management for premium features
- **LearningSession**: Tracks user learning progress with completed segments, listening time, and practice metrics
- **AuthSession**: Refresh token management for session persistence
- **PasswordResetToken**: Secure password reset functionality
- **TakedownRequest**: Copyright infringement and content moderation workflow
- **AudioTag**: Audio file categorization and metadata tagging
- **TranscriptRevision**: Transcript versioning and user-created revisions
- **Annotation**: User annotations and notes on transcript segments

### Key Patterns

**Soft Deletes**: All main entities support soft deletion via `deletedAt` timestamp. Always include `deletedAt: null` in queries.

**Versioning**: Transcript runs are versioned per audio file to support multiple transcription attempts with different parameters.

**Idempotency**: Analysis operations use `paramsHash` to prevent duplicate work. Transcription runs use `(audioId, paramsHash)` unique constraint.

**Audit Trail**: All significant user actions generate audit logs via `recordAuditLog()` helper.

**Quota Management**: Multi-level quota system including per-file size, per-file duration, daily upload count, and daily duration limits.

**Background Processing**: Long-running operations (transcription, analysis) use a job queue system with worker process for asynchronous execution.

**State Management**: React Context for authentication (`AuthContext`) and real-time events (`EventContext`) with localStorage persistence.

**Real-time Updates**: Server-Sent Events (SSE) for transcription status updates and progress tracking.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js development server (port 3000/3001)
npm run build        # Production build
npm start            # Start production server

# Database
npx prisma db push   # Sync schema to PostgreSQL
npx prisma studio    # Browse database in browser

# Background Worker
npm run worker       # Start background job processor for transcription tasks
npm run test-worker  # Test worker functionality

# Manual Testing
node test-auth.js    # Test authentication endpoints
node test-sse.js     # Test Server-Sent Events functionality

# Google Cloud Services (required for full functionality)
# Ensure GCS_BUCKET, GOOGLE_APPLICATION_CREDENTIALS, GCLOUD_PROJECT are set

# Tailwind CSS (recently added for Apple-style design)
# Styles are configured in tailwind.config.js and postcss.config.js
# Global styles in styles/globals.css with Apple-inspired design patterns
```

## Environment Configuration

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_JWT_SECRET`: JWT signing secret (minimum 32 chars)
- `GCS_BUCKET`: Google Cloud Storage bucket name
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON
- `GCLOUD_PROJECT`: Google Cloud project ID
- `GEMINI_API_KEY`: Google Gemini API key for analysis features

### Optional Variables
- `GOOGLE_OAUTH_CLIENT_ID`: For Google Sign-In
- `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`: Client-side Google OAuth
- `SPEECH_LOCATION`: Google Speech region (default: "global")
- `UPLOAD_URL_TTL_SEC`: Resumable upload URL expiry (default: 3600)
- `TASKS_INLINE_PROCESSING=1`: Process tasks synchronously for debugging
- `AUTH_ACCESS_TOKEN_TTL_SEC`: Access token TTL (default: 900s/15min)
- `AUTH_REFRESH_TOKEN_TTL_DAYS`: Refresh token TTL (default: 14 days)
- `AUTH_PASSWORD_RESET_TTL_MIN`: Password reset token TTL (default: 30min)

### Quota Configuration
- `QUOTA_PER_FILE_SIZE_BYTES`: Max file size (default: 100MB)
- `QUOTA_PER_FILE_DURATION_MS`: Max audio duration (default: 30min)
- `QUOTA_DAILY_UPLOAD_LIMIT`: Daily upload count (default: 10)
- `QUOTA_DAILY_DURATION_LIMIT_MS`: Daily total duration (default: 2hrs)

## API Architecture

### Authentication Flow
1. Login/Register returns JWT `accessToken` (15min TTL) and `refreshToken` (14 days)
2. Frontend stores auth state in localStorage with auto-refresh via `AuthContext`
3. All API endpoints require `Authorization: Bearer <accessToken>` header
4. Use `requireAuth()` middleware in API routes for authentication
5. Refresh token rotation ensures session security and prevents replay attacks

### BBC Resource Integration
- BBC resources use virtual run IDs with format `shared-bbc-{resourceId}`
- API endpoints handle BBC resources by checking for `shared-bbc-` prefix
- BBC segments API: `/api/runs/shared-bbc-{id}/segments`
- BBC analysis API: `/api/runs/shared-bbc-{id}/segments/{index}/analysis`
- BBC resources support subscription-based access control (first 5 resources free)

### Upload Workflow
1. `POST /api/uploads/create` → Creates AudioFile record, returns GCS resumable URL
2. Client uploads directly to GCS using the resumable session with proper headers
3. `POST /api/uploads/commit` → Validates upload, extracts metadata with ffprobe, enforces quotas
4. Upload supports SHA-256 integrity verification and file size/duration validation
5. **Enhanced Upload Modal**: Drag-and-drop interface with real-time progress tracking and error handling
6. **Background Processing**: Transcription automatically starts after successful upload with status updates
7. **Manual Transcription**: Failed uploads or uploaded files can be manually triggered for transcription via "开始转写" button

### Transcription Flow
1. `POST /api/audios/:audioId/transcribe` → Triggers transcription
2. Small files (<10MB, <60s): Processed synchronously
3. Large files: Enqueued as background job, returns 202 Accepted
4. Background worker processes jobs from the queue with retry logic
5. Results stored in `transcript_runs` with versioning
6. Real-time status updates via SSE at `/api/runs/:runId/events`

### Analysis Flow
1. `POST /api/runs/:runId/segments/:index/analysis` → Triggers AI analysis
2. Supports `sentence`, `grammar`, `translation`, and `overview` analysis types
3. Uses Google Gemini with smart model fallback and error handling
4. Results cached by `paramsHash` to avoid duplicate API calls

### Learning Analytics
- `GET /api/user/learning-stats` → Returns comprehensive learning statistics including total sessions, minutes, segments, streak days, and achievements
- `GET /api/user/progress` → Provides progress tracking with goals, recent sessions, skill progression, and personalized suggestions
- Learning sessions track completed segments, listening time, practice time, loop count, and recording count

## Frontend Architecture

### Component Structure
- **LandingPage**: Apple-style homepage for non-authenticated users with clean navigation, hero section, and feature showcase
- **UserDashboard**: Main dashboard for authenticated users with WelcomeSection, QuickStats, and audio management
- **EnhancedDashboard**: Main dashboard with tabbed interface (my-audio, stats, progress) and card-based audio management
- **TranscriptPlayer**: Core audio playback with synchronized transcript highlighting
- **PaginatedTranscript**: Reusable transcript display component with pagination
- **AuthProvider**: JWT management with automatic refresh and persistence
- **EventProvider**: Server-Sent Events (SSE) management for real-time updates
- **LearningStats**: Displays user learning statistics and achievements
- **ProgressTracker**: Shows learning goals, recent sessions, and personalized suggestions
- **AuthLayout**: Authentication page layout with Google Sign-In integration
- **GoogleSignInButton**: Google OAuth2 button component
- **AnalysisPanel**: Displays AI analysis results for selected segments
- **RunHistoryList**: Shows transcription run history with versioning
- **AnnotationsPanel**: User annotation system for transcripts
- **RevisionsPanel**: Transcript revision management
- **AudioUploadModal**: Enhanced drag-and-drop upload modal with progress tracking and background processing
- **TestModal**: Testing modal component for development and debugging

### State Management
- **Authentication**: React Context with localStorage persistence via `AuthContext`
- **Real-time Events**: Server-Sent Events managed via `EventContext` for live updates
- **Component state**: Local React state or props
- **No global state management library needed**
- **Auto-refresh tokens** with padding to prevent expiration during active sessions
- **SSE Connections**: Automatic cleanup and reconnection logic for real-time updates

### UI Patterns
- Chinese language interface with English content display
- **Apple-style Design**: Clean typography, subtle animations, rounded corners, minimalist aesthetic
- Responsive design with mobile-first approach
- Real-time updates using Server-Sent Events (SSE)
- Dashboard uses tabbed interface with integrated audio management in "my-audio" tab
- Card-based layout for audio files with status indicators and contextual actions
- Enhanced drag-and-drop file upload with visual feedback and progress tracking
- Real-time audio playback with synchronized transcript highlighting
- Status-based button states (View Details, Play Transcript, Start Transcribe)
- Background processing with status updates and error handling
- **Authentication-based Routing**: Homepage shows different experiences for logged-in vs non-logged users via pages/index.jsx

## Key Libraries & Dependencies

### Core Stack
- **Next.js 14**: React framework with API routes and file-based routing
- **Prisma**: TypeScript ORM with PostgreSQL and schema migrations
- **React 18**: UI library with hooks and concurrent features
- **Google Cloud**: Speech-to-Text, Storage, and Gemini APIs
- **PostgreSQL**: Primary database with relational data modeling

### Development
- **formidable**: File upload handling and parsing
- **crypto**: Built-in Node.js crypto for JWT and password hashing
- **ffprobe**: Audio metadata extraction (system dependency)
- **bcryptjs**: Alternative password hashing library
- **Tailwind CSS**: Utility-first CSS framework with Apple-inspired design configuration
- **@tailwindcss/postcss**: PostCSS plugin for Tailwind CSS processing
- **autoprefixer**: PostCSS plugin for automatic vendor prefixing

## Important Implementation Details

### Audio Processing
- Use `ffprobe` for duration/size extraction (install via `brew install ffmpeg`)
- Segmentation by silence detection configurable via `gapSec` parameter
- Speaker diarization support with min/max speaker counts
- Direct-to-GCS upload with resumable sessions and client-side uploads
- **Enhanced Error Handling**: Graceful handling of upload/transcription failures with retry mechanisms
- **Status Management**: Real-time status updates with visual indicators (uploading, uploaded, transcribing, transcribed, failed)
- **Background Processing**: Non-blocking transcription processing with automatic refresh

### Security
- **Password hashing**: PBKDF2 with 100k rounds and SHA-512
- **JWT tokens**: HS256 algorithm with proper expiration and refresh rotation
- **Refresh token rotation**: Single-use tokens that are consumed and replaced
- **GCS signed URLs**: V4 signing with configurable TTL
- **CSRF protection**: Built-in Next.js CSRF middleware
- **Input validation**: Comprehensive validation on all API endpoints

### Error Handling
- **Custom `QuotaError`**: Detailed limit information and user-friendly messages
- **Comprehensive audit logging**: All significant operations are tracked
- **Graceful degradation**: Missing dependencies don't break core functionality
- **HTTP status codes**: Proper error responses with meaningful error messages
- **Transaction safety**: Database operations wrapped in transactions for consistency

### Performance
- **Prisma client singleton**: Reused in development for efficiency
- **Direct GCS uploads**: Minimize server load by uploading directly to cloud storage
- **Background job queue**: Long-running operations processed asynchronously
- **Analysis result caching**: Param-based deduplication prevents duplicate API calls
- **Pagination**: All list endpoints support pagination with `page` and `pageSize`
- **Soft deletes**: Efficient data retention without performance impact

## Testing & Quality

- **Manual Testing Scripts**:
  - `node test-auth.js` - Test authentication endpoints (login, register, token refresh)
  - `node test-sse.js` - Test Server-Sent Events functionality
- **No Testing Framework**: No automated testing framework currently configured
- **Manual Testing**: API endpoints can be tested manually via development server
- **Error Handling**: Comprehensive error responses with detailed messages
- **Transaction Safety**: Database operations wrapped in transactions for consistency
- **TypeScript**: Full TypeScript support via Prisma generated types
- **Development Logging**: Comprehensive console logging in development mode

## Deployment Notes

- Requires PostgreSQL database with proper indexing
- Google Cloud project with Speech-to-Text, Storage, and Gemini APIs enabled
- System dependency: `ffprobe` must be installed on server
- Environment variables must be properly configured in production
- GCS bucket must have proper CORS configuration for direct uploads
- Service account needs appropriate IAM roles for Google Cloud services

## Common Issues

1. **Missing ffprobe**: Install ffmpeg package which includes ffprobe
2. **Google Cloud permissions**: Ensure service account has Storage and Speech API access
3. **Database migrations**: Use `npx prisma db push` for schema changes
4. **Quota exceeded**: Check usage logs and adjust quota limits as needed
5. **Large audio files**: Use batch recognition for files >10MB or >60 seconds
6. **BigInt serialization**: Prisma generates BigInt fields that need custom serialization in JSON responses
7. **Import path errors**: In nested API routes, use correct relative paths (e.g., `../../../../lib/` from `/pages/api/shared-resources/[id]/`)
8. **Hydration errors**: Use client-only components for authentication-dependent UI to avoid server-client mismatch
9. **Dashboard 404 errors**: If dashboard returns 404, restart the development server to reload routes
10. **Database field errors**: When accessing AudioFile fields, use `filename` instead of `title` (AudioFile model has filename field, not title)
11. **Audio list not showing**: Ensure API response format matches frontend expectations - `/api/audios` should return `{items, hasMore}` not `{items, page, pageSize, total, totalPages}`
12. **Auth state persistence**: Check localStorage for `lingoloop.auth.v1` key if authentication issues occur
13. **CORS issues**: Ensure GCS bucket has proper CORS configuration for direct uploads
14. **Environment variables**: Verify all required environment variables are set in production
15. **Upload Modal Issues**: If upload modal doesn't open, check browser console for errors and ensure accessToken is valid
16. **Manual Transcription**: For failed uploads, use the "开始转写" button to restart transcription process
17. **Card Layout Issues**: If audio cards don't display properly, check API response format and ensure `/api/audios` returns correct structure
18. **Status Updates**: Audio status may not update immediately - refresh manually or wait for automatic background updates
19. **Worker Dependencies**: Background worker requires same environment variables as main application
20. **BigInt Handling**: Prisma BigInt fields require custom serialization in JSON responses - use `BigInt.prototype.toString()` or similar serialization methods
21. **SSE Connection Issues**: If real-time updates don't work, check accessToken validity and network connectivity
22. **Context Usage**: Always use `useAuth()` and `useEvents()` hooks within their respective provider contexts
23. **Worker Process**: Background worker must be started separately for processing long transcription tasks
24. **File Upload Limits**: GCS has specific file size limits - ensure your bucket configuration supports expected file sizes
25. **Tailwind CSS Configuration**: If styles don't load, ensure @tailwindcss/postcss is properly configured in postcss.config.js and globals.css is imported in pages/_app.jsx
26. **Apple-style Design**: Custom animations (blob) and grid patterns are defined in styles/globals.css and tailwind.config.js for the modern UI aesthetic