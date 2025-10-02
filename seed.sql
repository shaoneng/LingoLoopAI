--
-- PostgreSQL database dump
--

\restrict qhgAfLt8nI4DfeDFnVM5bJwlVfDvO5UWnRzvq2JddsdFfnjpkeRZrX7Batw5pfu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "displayName", "avatarUrl", "emailVerified", settings, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AudioFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AudioFile" (id, "userId", "gcsUri", filename, "durationMs", "sizeBytes", language, mode, "gapSec", status, "errorMessage", meta, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: TranscriptRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TranscriptRun" (id, "audioId", "authorId", version, engine, params, "paramsHash", status, error, text, segments, "speakerCount", confidence, "createdAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: Analysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Analysis" (id, "runId", "segmentIndex", kind, engine, params, "paramsHash", status, summary, score, result, error, "createdAt", "updatedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: Annotation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Annotation" (id, "runId", "userId", content, "anchorType", "anchorValue", "createdAt", "isDeleted") FROM stdin;
\.


--
-- Data for Name: AudioTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AudioTag" (id, "audioId", key, "createdAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "userId", kind, "targetId", meta, "createdAt") FROM stdin;
\.


--
-- Data for Name: AuthSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuthSession" (id, "userId", "refreshToken", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Job" (id, "audioId", "runId", "jobType", "providerJobId", status, "retryCount", "nextRetryAt", "errorMessage", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LearningSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LearningSession" (id, "userId", "audioId", "transcriptRunId", "completedSegments", "totalSegments", "listeningTimeMs", "practiceTimeMs", "loopCount", "recordingCount", score, "completedAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: SharedBbcResource; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SharedBbcResource" (id, title, description, "externalUrl", "durationMs", transcript, segments, "uploadedById", "isPublished", "publishDate", "episodeNumber", "seasonNumber", "bbcUrl", "createdAt", "updatedAt", "sourceType", "licenseInfo") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subscription" (id, "userId", status, "planType", "startedAt", "expiresAt", "cancelledAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TakedownRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TakedownRequest" (id, "resourceId", reason, "contactInfo", "additionalInfo", "requestType", status, "adminNotes", "resolvedAt", "resolvedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TranscriptRevision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TranscriptRevision" (id, "runId", title, text, segments, "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: UsageLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UsageLog" (id, "userId", day, "uploadCount", "durationMs", "createdAt") FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict qhgAfLt8nI4DfeDFnVM5bJwlVfDvO5UWnRzvq2JddsdFfnjpkeRZrX7Batw5pfu

