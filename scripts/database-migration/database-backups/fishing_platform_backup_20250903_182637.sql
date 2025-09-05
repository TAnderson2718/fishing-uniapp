--
-- PostgreSQL database dump
--

\restrict 7gpxH8yEFhP5T7iwBxbgKTMgEbkhgX4IFocG3d7jM7I3e8lb9dpMKeNlBB2tEB3

-- Dumped from database version 17.6 (Postgres.app)
-- Dumped by pg_dump version 17.6 (Postgres.app)

-- Started on 2025-09-03 18:26:37 CST

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

DROP DATABASE IF EXISTS wanyu_diaowan_dev;
--
-- TOC entry 4131 (class 1262 OID 27071)
-- Name: wanyu_diaowan_dev; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE wanyu_diaowan_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = icu LOCALE = 'en_US.UTF-8' ICU_LOCALE = 'en-US';


\unrestrict 7gpxH8yEFhP5T7iwBxbgKTMgEbkhgX4IFocG3d7jM7I3e8lb9dpMKeNlBB2tEB3
\connect wanyu_diaowan_dev
\restrict 7gpxH8yEFhP5T7iwBxbgKTMgEbkhgX4IFocG3d7jM7I3e8lb9dpMKeNlBB2tEB3

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
-- TOC entry 879 (class 1247 OID 27098)
-- Name: ActivityStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- TOC entry 960 (class 1247 OID 30573)
-- Name: ActivityTimeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityTimeType" AS ENUM (
    'FULL_DAY',
    'TIMED',
    'BOTH'
);


--
-- TOC entry 978 (class 1247 OID 32470)
-- Name: ArticleStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ArticleStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- TOC entry 975 (class 1247 OID 32460)
-- Name: BannerLinkType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BannerLinkType" AS ENUM (
    'ARTICLE',
    'ACTIVITY',
    'EXTERNAL',
    'NONE'
);


--
-- TOC entry 903 (class 1247 OID 27166)
-- Name: CommentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommentStatus" AS ENUM (
    'VISIBLE',
    'HIDDEN',
    'DELETED'
);


--
-- TOC entry 966 (class 1247 OID 30590)
-- Name: ExtensionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExtensionType" AS ENUM (
    'ADD_TIME',
    'CONVERT_FULL_DAY'
);


--
-- TOC entry 906 (class 1247 OID 27174)
-- Name: MembershipStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MembershipStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


--
-- TOC entry 999 (class 1247 OID 34837)
-- Name: NewsStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NewsStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED'
);


--
-- TOC entry 993 (class 1247 OID 33606)
-- Name: OperationResult; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OperationResult" AS ENUM (
    'SUCCESS',
    'FAILED',
    'PARTIAL_SUCCESS',
    'FAILURE'
);


--
-- TOC entry 990 (class 1247 OID 33545)
-- Name: OperationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OperationType" AS ENUM (
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_REGISTER',
    'USER_UPDATE_PROFILE',
    'USER_DELETE',
    'USER_ROLE_CHANGE',
    'ORDER_CREATE',
    'ORDER_PAY',
    'ORDER_CANCEL',
    'ORDER_REFUND',
    'ORDER_UPDATE',
    'ACTIVITY_CREATE',
    'ACTIVITY_UPDATE',
    'ACTIVITY_DELETE',
    'ACTIVITY_PUBLISH',
    'ACTIVITY_ARCHIVE',
    'TICKET_VERIFY',
    'TICKET_REFUND',
    'MEMBERSHIP_CREATE',
    'MEMBERSHIP_UPDATE',
    'MEMBERSHIP_CANCEL',
    'POST_CREATE',
    'POST_UPDATE',
    'POST_DELETE',
    'POST_APPROVE',
    'POST_REJECT',
    'SYSTEM_CONFIG',
    'SYSTEM_BACKUP',
    'SYSTEM_MAINTENANCE',
    'OTHER',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILURE',
    'TICKET_CREATE',
    'MEMBERSHIP_ACTIVATE',
    'TIMED_ORDER_CREATE',
    'TIMED_ORDER_EXTEND',
    'TIMED_ORDER_EXPIRE'
);


--
-- TOC entry 885 (class 1247 OID 27112)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'CREATED',
    'PENDING',
    'PAID',
    'CANCELLED',
    'REFUNDED',
    'FAILED'
);


--
-- TOC entry 882 (class 1247 OID 27106)
-- Name: OrderType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderType" AS ENUM (
    'TICKET',
    'MEMBERSHIP'
);


--
-- TOC entry 888 (class 1247 OID 27126)
-- Name: PaymentProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentProvider" AS ENUM (
    'WECHAT_PAY'
);


--
-- TOC entry 891 (class 1247 OID 27130)
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'INIT',
    'PREPARED',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);


--
-- TOC entry 900 (class 1247 OID 27158)
-- Name: PostStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PostStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- TOC entry 876 (class 1247 OID 27092)
-- Name: Provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Provider" AS ENUM (
    'WECHAT_MINI',
    'PASSWORD'
);


--
-- TOC entry 873 (class 1247 OID 27084)
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'STAFF',
    'ADMIN'
);


--
-- TOC entry 894 (class 1247 OID 27142)
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'UNUSED',
    'USED',
    'EXPIRED',
    'REFUNDED'
);


--
-- TOC entry 963 (class 1247 OID 30578)
-- Name: TimedOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TimedOrderStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'EXPIRED',
    'EXTENDED',
    'COMPLETED'
);


--
-- TOC entry 897 (class 1247 OID 27152)
-- Name: VerificationResult; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationResult" AS ENUM (
    'SUCCESS',
    'FAILED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 27217)
-- Name: Activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "coverImageUrl" text,
    address text,
    status public."ActivityStatus" DEFAULT 'DRAFT'::public."ActivityStatus" NOT NULL,
    "normalPrice" numeric(10,2) NOT NULL,
    "memberPrice" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "durationHours" integer,
    "overtimePrice" numeric(10,2),
    "timeType" public."ActivityTimeType" DEFAULT 'FULL_DAY'::public."ActivityTimeType" NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "upgradePrice" numeric(10,2)
);


--
-- TOC entry 223 (class 1259 OID 27226)
-- Name: ActivitySession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActivitySession" (
    id text NOT NULL,
    "activityId" text NOT NULL,
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    capacity integer NOT NULL
);


--
-- TOC entry 238 (class 1259 OID 32488)
-- Name: Article; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Article" (
    id text NOT NULL,
    title text NOT NULL,
    summary text,
    content text NOT NULL,
    "coverImage" text,
    status public."ArticleStatus" DEFAULT 'DRAFT'::public."ArticleStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 239 (class 1259 OID 32499)
-- Name: ArticleImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ArticleImage" (
    id text NOT NULL,
    "articleId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 27190)
-- Name: AuthIdentity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuthIdentity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."Provider" NOT NULL,
    "externalId" text NOT NULL,
    "passwordHash" text,
    "passwordSalt" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 32477)
-- Name: Banner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Banner" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "imageUrl" text NOT NULL,
    "linkType" public."BannerLinkType" DEFAULT 'ARTICLE'::public."BannerLinkType" NOT NULL,
    "linkValue" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 27297)
-- Name: Comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    status public."CommentStatus" DEFAULT 'VISIBLE'::public."CommentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 27322)
-- Name: EmployeeProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "employeeCode" text,
    title text,
    active boolean DEFAULT true NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 27306)
-- Name: Like; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Like" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 27198)
-- Name: MemberPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberPlan" (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "durationDays" integer NOT NULL,
    benefits text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 27207)
-- Name: Membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Membership" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    status public."MembershipStatus" DEFAULT 'ACTIVE'::public."MembershipStatus" NOT NULL,
    "startAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 240 (class 1259 OID 33613)
-- Name: OperationLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OperationLog" (
    id text NOT NULL,
    "userId" text,
    "userType" public."Role",
    "userName" text,
    "operationType" public."OperationType" NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    "targetType" text,
    "targetId" text,
    "targetName" text,
    details jsonb,
    "ipAddress" text,
    "userAgent" text,
    result public."OperationResult" DEFAULT 'SUCCESS'::public."OperationResult" NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 27233)
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."OrderType" NOT NULL,
    status public."OrderStatus" DEFAULT 'CREATED'::public."OrderStatus" NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    "payAmount" numeric(10,2) NOT NULL,
    currency text DEFAULT 'CNY'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 236 (class 1259 OID 30606)
-- Name: OrderExtension; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderExtension" (
    id text NOT NULL,
    "timedOrderId" text NOT NULL,
    "extensionType" public."ExtensionType" NOT NULL,
    "originalPrice" numeric(10,2) NOT NULL,
    "paidAmount" numeric(10,2) NOT NULL,
    "addedHours" integer,
    "convertedToFullDay" boolean DEFAULT false NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'INIT'::public."PaymentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 27243)
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    type public."OrderType" NOT NULL,
    "activityId" text,
    "sessionId" text,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "planId" text
);


--
-- TOC entry 226 (class 1259 OID 27251)
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    provider public."PaymentProvider" NOT NULL,
    status public."PaymentStatus" DEFAULT 'INIT'::public."PaymentStatus" NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'CNY'::text NOT NULL,
    "prepayId" text,
    "transactionId" text,
    "mchOrderNo" text,
    "codeUrl" text,
    "notifyRaw" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifyNote" text,
    "verifyStatus" text
);


--
-- TOC entry 229 (class 1259 OID 27278)
-- Name: Post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    status public."PostStatus" DEFAULT 'PENDING'::public."PostStatus" NOT NULL,
    "likesCount" integer DEFAULT 0 NOT NULL,
    "commentsCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 27289)
-- Name: PostImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PostImage" (
    id text NOT NULL,
    "postId" text NOT NULL,
    url text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 27314)
-- Name: ShopInfo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShopInfo" (
    id text DEFAULT 'default'::text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    about text,
    images jsonb
);


--
-- TOC entry 227 (class 1259 OID 27261)
-- Name: Ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "orderItemId" text NOT NULL,
    "activityId" text NOT NULL,
    "sessionId" text NOT NULL,
    code text NOT NULL,
    status public."TicketStatus" DEFAULT 'UNUSED'::public."TicketStatus" NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 30596)
-- Name: TimedOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimedOrder" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "activityId" text NOT NULL,
    "startTime" timestamp(3) without time zone,
    "endTime" timestamp(3) without time zone,
    "durationHours" integer NOT NULL,
    status public."TimedOrderStatus" DEFAULT 'PENDING'::public."TimedOrderStatus" NOT NULL,
    "isExpired" boolean DEFAULT false NOT NULL,
    "expiredAt" timestamp(3) without time zone,
    "notifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 27181)
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    nickname text,
    "avatarUrl" text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 27270)
-- Name: VerificationLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationLog" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "verifiedById" text NOT NULL,
    result public."VerificationResult" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 27074)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 241 (class 1259 OID 34841)
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    status public."NewsStatus" DEFAULT 'DRAFT'::public."NewsStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 4106 (class 0 OID 27217)
-- Dependencies: 222
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Activity" (id, title, description, "coverImageUrl", address, status, "normalPrice", "memberPrice", "createdAt", "updatedAt", "durationHours", "overtimePrice", "timeType", "sortOrder", "upgradePrice") FROM stdin;
lure-fishing	路亚钓鱼活动	专业路亚钓鱼体验，学习路亚技巧，享受钓鱼乐趣	/images/lure-fishing.jpg	湖心岛钓鱼基地A区	PUBLISHED	150.00	120.00	2025-09-02 07:14:06.223	2025-09-02 09:09:52.827	3	40.00	TIMED	1	\N
family-fishing	亲子钓鱼活动	两大一小套餐，适合全家参与的钓鱼活动，包含儿童钓具和安全指导	/images/family-fishing.jpg	家庭钓鱼乐园	PUBLISHED	350.00	280.00	2025-09-02 07:14:06.226	2025-09-02 09:09:52.829	\N	\N	FULL_DAY	2	\N
forest-yoga	森林瑜伽活动	在自然环境中练习瑜伽，放松身心，享受大自然的宁静	/images/forest-yoga.jpg	森林公园瑜伽区	PUBLISHED	120.00	90.00	2025-09-02 07:14:06.227	2025-09-02 09:09:52.83	2	30.00	TIMED	3	\N
cmf2gbru80000bt5ejq7eigqx	深海垂钓探险之旅	\N	\N	\N	PUBLISHED	200.00	150.00	2025-09-02 11:15:00.653	2025-09-02 11:28:34.178	\N	\N	FULL_DAY	0	\N
cmf2hbzvo0000bt0l6nv6iyg3	测试草稿活动	\N	\N	\N	DRAFT	0.00	0.00	2025-09-02 11:43:10.69	2025-09-02 11:43:10.69	\N	\N	FULL_DAY	0	\N
cmf2r2all0000btcw3geyx5bu	测试支持两种模式活动	\N	\N	\N	DRAFT	200.00	150.00	2025-09-02 16:15:34.184	2025-09-02 16:15:34.184	3	20.00	BOTH	0	30.00
cmf2rxwnm0000btrkh7m35v1o	测试新功能活动	这是一个测试新功能的活动，包含了封面图上传和详情描述功能。\n\n活动亮点：\n1. 支持封面图片上传\n2. 支持详细描述编辑\n3. 字符数限制功能\n4. 文件格式验证\n\n欢迎大家参与体验！		\N	DRAFT	100.00	80.00	2025-09-02 16:40:09.074	2025-09-02 16:40:09.074	3	\N	FULL_DAY	0	0.00
pro-competition	专业钓鱼比赛	高水平钓鱼竞技比赛，奖品丰厚	\N	\N	PUBLISHED	300.00	250.00	2025-09-02 02:30:30.28	2025-09-02 07:58:59.912	\N	\N	FULL_DAY	40	\N
weekend-fishing	周末休闲钓	轻松愉快的周末钓鱼活动，适合全家参与	\N	\N	PUBLISHED	180.00	150.00	2025-09-02 02:30:30.279	2025-09-02 07:58:59.912	\N	\N	FULL_DAY	50	\N
beginner-fishing	新手钓鱼体验营	专为初学者设计的钓鱼体验活动，包含基础教学和装备提供	\N	\N	PUBLISHED	120.00	88.00	2025-09-02 02:30:30.278	2025-09-02 07:58:59.912	\N	\N	FULL_DAY	60	\N
cmf3qdee30002btdkxv3y6vkf	员工端测试活动	这是一个通过员工端创建的测试活动，用于验证员工端活动管理功能的完整性。		\N	PUBLISHED	100.00	80.00	2025-09-03 08:43:58.844	2025-09-03 08:46:33.608	3	\N	FULL_DAY	0	0.00
\.


--
-- TOC entry 4107 (class 0 OID 27226)
-- Dependencies: 223
-- Data for Name: ActivitySession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ActivitySession" (id, "activityId", "startAt", "endAt", capacity) FROM stdin;
cmf1xl9570009btlt69eofs3e	beginner-fishing	2025-09-09 02:30:30.28	2025-09-09 06:30:30.28	20
cmf1xl960000bbtlt5sj8vi4g	beginner-fishing	2025-09-16 02:30:30.28	2025-09-16 06:30:30.28	20
cmf1xl961000dbtlt26kx6yho	weekend-fishing	2025-09-05 02:30:30.28	2025-09-05 08:30:30.28	15
cmf1xl962000fbtltt0qdqrv5	weekend-fishing	2025-09-12 02:30:30.28	2025-09-12 08:30:30.28	15
cmf1xl963000hbtltki7uhcu2	pro-competition	2025-09-23 02:30:30.28	2025-09-23 10:30:30.28	30
cmf27pyqe0001bt15sptny8o9	lure-fishing	2025-09-03 07:14:06.228	2025-09-03 11:14:06.228	15
cmf27pyqv0003bt15a7umag6j	lure-fishing	2025-09-10 07:14:06.228	2025-09-10 11:14:06.228	15
cmf27pyqx0005bt15vf4wsos8	family-fishing	2025-09-05 07:14:06.228	2025-09-05 15:14:06.228	10
cmf27pyqy0007bt15ohte09gf	family-fishing	2025-09-12 07:14:06.228	2025-09-12 15:14:06.228	10
cmf27pyr00009bt15aj5i4ftg	forest-yoga	2025-09-04 07:14:06.228	2025-09-04 09:14:06.228	20
cmf27pyr1000bbt15hz77qz9e	forest-yoga	2025-09-11 07:14:06.228	2025-09-11 09:14:06.228	20
cmf27pyr2000dbt15rphcxm7j	pro-competition	2025-09-23 07:14:06.228	2025-09-23 15:14:06.228	30
cmf28iz3v0001bt0atind2cim	lure-fishing	2025-09-03 07:36:39.738	2025-09-03 10:36:39.738	15
cmf28iz4c0003bt0aubk7yy2l	lure-fishing	2025-09-10 07:36:39.738	2025-09-10 10:36:39.738	15
cmf28iz4d0005bt0a3amwbcbj	family-fishing	2025-09-05 07:36:39.738	2025-09-05 15:36:39.738	10
cmf28iz4f0007bt0ay2c9a7wt	family-fishing	2025-09-12 07:36:39.738	2025-09-12 15:36:39.738	10
cmf28iz4g0009bt0agffcgi91	forest-yoga	2025-09-04 07:36:39.738	2025-09-04 09:36:39.738	20
cmf28iz4i000bbt0aq6hosu6u	forest-yoga	2025-09-11 07:36:39.738	2025-09-11 09:36:39.738	20
cmf28zi2z0001bt4wgt28pw57	lure-fishing	2025-09-03 07:49:30.826	2025-09-03 10:49:30.826	15
cmf28zi3j0003bt4wcsbvt26a	lure-fishing	2025-09-10 07:49:30.826	2025-09-10 10:49:30.826	15
cmf28zi3l0005bt4wq3znq9zd	family-fishing	2025-09-05 07:49:30.826	2025-09-05 15:49:30.826	10
cmf28zi3n0007bt4wdfzbo0yk	family-fishing	2025-09-12 07:49:30.826	2025-09-12 15:49:30.826	10
cmf28zi3p0009bt4w9epdt155	forest-yoga	2025-09-04 07:49:30.826	2025-09-04 09:49:30.826	20
cmf28zi3q000bbt4wwl2udn4p	forest-yoga	2025-09-11 07:49:30.826	2025-09-11 09:49:30.826	20
cmf2996ir0001btvcnascinln	lure-fishing	2025-09-03 07:57:02.402	2025-09-03 10:57:02.402	15
cmf2996ja0003btvc447lizs2	lure-fishing	2025-09-10 07:57:02.402	2025-09-10 10:57:02.402	15
cmf2996jc0005btvcj7d8co0g	family-fishing	2025-09-05 07:57:02.402	2025-09-05 15:57:02.402	10
cmf2996je0007btvcyjd41dlo	family-fishing	2025-09-12 07:57:02.402	2025-09-12 15:57:02.402	10
cmf2996jf0009btvc1xklnguz	forest-yoga	2025-09-04 07:57:02.402	2025-09-04 09:57:02.402	20
cmf2996jg000bbtvcuv6iajxn	forest-yoga	2025-09-11 07:57:02.402	2025-09-11 09:57:02.402	20
cmf2buurj0001bt4rp2mdyu2h	lure-fishing	2025-09-03 09:09:52.83	2025-09-03 12:09:52.83	15
cmf2buus00003bt4roavproix	lure-fishing	2025-09-10 09:09:52.83	2025-09-10 12:09:52.83	15
cmf2buus10005bt4r52qqawnh	family-fishing	2025-09-05 09:09:52.83	2025-09-05 17:09:52.83	10
cmf2buus30007bt4rrf63iy8p	family-fishing	2025-09-12 09:09:52.83	2025-09-12 17:09:52.83	10
cmf2buus40009bt4rkypnyeyp	forest-yoga	2025-09-04 09:09:52.83	2025-09-04 11:09:52.83	20
cmf2buus4000bbt4ri2bnlfas	forest-yoga	2025-09-11 09:09:52.83	2025-09-11 11:09:52.83	20
cmf2t6uuu0005bt0437dk1msg	cmf2r2all0000btcw3geyx5bu	2025-09-02 17:15:06.294	2025-09-02 20:15:06.294	10
cmf3b3ntr0001btbql9onw9qf	cmf2gbru80000bt5ejq7eigqx	2025-09-05 01:00:00	2025-09-05 09:00:00	50
\.


--
-- TOC entry 4122 (class 0 OID 32488)
-- Dependencies: 238
-- Data for Name: Article; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Article" (id, title, summary, content, "coverImage", status, "publishedAt", "viewCount", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmf2cpq2z0004btr4v6aa0cak	周末活动预告 | 亲子钓鱼营	本周末将举办亲子钓鱼活动，欢迎家长带着孩子一起参与	\n            <h2>亲子钓鱼营活动详情</h2>\n            <p>为了让更多家庭享受钓鱼的乐趣，我们特别组织了亲子钓鱼营活动。</p>\n            \n            <h3>活动时间</h3>\n            <p>本周六上午9:00-下午5:00</p>\n            \n            <h3>活动地点</h3>\n            <p>千岛湖钓鱼基地</p>\n            \n            <h3>活动内容</h3>\n            <ul>\n              <li>专业教练指导钓鱼技巧</li>\n              <li>亲子互动游戏</li>\n              <li>免费提供钓具和饵料</li>\n              <li>午餐和茶点</li>\n              <li>钓鱼比赛和奖品</li>\n            </ul>\n            \n            <h3>报名方式</h3>\n            <p>请提前电话预约，名额有限，先到先得！</p>\n          	/static/images/news2.jpg	PUBLISHED	2025-09-01 09:33:53.097	2	2	2025-09-02 09:33:53.099	2025-09-02 10:11:21.743
cmf2cpq2z0003btr441anr95v	新品路亚上市 | 春季特惠	全新设计的路亚产品，专为春季钓鱼设计，现在购买享受特别优惠	\n            <h2>春季钓鱼新装备</h2>\n            <p>随着春季的到来，鱼儿开始活跃，这是钓鱼的黄金季节。我们特别推出了一系列新品路亚装备，专为春季钓鱼而设计。</p>\n            \n            <h3>产品特色</h3>\n            <ul>\n              <li>采用最新材料，轻便耐用</li>\n              <li>专业设计，提高上鱼率</li>\n              <li>多种颜色可选，适应不同水域</li>\n              <li>价格优惠，性价比极高</li>\n            </ul>\n            \n            <h3>春季特惠活动</h3>\n            <p>即日起至4月30日，购买任意路亚产品享受8折优惠，购买套装更有额外惊喜！</p>\n            \n            <p>不要错过这个难得的机会，快来选购属于你的春季钓鱼装备吧！</p>\n          	/static/images/news1.jpg	PUBLISHED	2025-09-02 09:33:53.097	6	1	2025-09-02 09:33:53.099	2025-09-02 14:46:05.036
\.


--
-- TOC entry 4123 (class 0 OID 32499)
-- Dependencies: 239
-- Data for Name: ArticleImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ArticleImage" (id, "articleId", url, alt, "sortOrder") FROM stdin;
cmf2cpq2z0005btr4aeb7gt84	cmf2cpq2z0003btr441anr95v	/static/images/lure1.jpg	新品路亚1	0
cmf2cpq2z0006btr4yqle813r	cmf2cpq2z0003btr441anr95v	/static/images/lure2.jpg	新品路亚2	1
\.


--
-- TOC entry 4103 (class 0 OID 27190)
-- Dependencies: 219
-- Data for Name: AuthIdentity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuthIdentity" (id, "userId", provider, "externalId", "passwordHash", "passwordSalt", "createdAt") FROM stdin;
cmf1xl93d0003btlth4cvhqmk	cmf1xl93d0002btltokby4gip	WECHAT_MINI	demo_openid_001	\N	\N	2025-09-02 02:30:30.217
cmf1xl93f0005btltfgdtm6pi	cmf1xl93f0004btltry7zflf0	WECHAT_MINI	demo_openid_002	\N	\N	2025-09-02 02:30:30.219
cmf1xl94u0007btltob31ciqn	cmf1xl94u0006btltiadsro02	PASSWORD	testuser	$2b$10$KjFwGx1DZoXBAqEebyo08es6XeGSoaCSXOoI1p1vX/6v6.ckoJi5S	$2b$10$KjFwGx1DZoXBAqEebyo08e	2025-09-02 02:30:30.271
cmf1xl91s0001btltt14zdyse	cmf1xl91r0000btltnn4cxlhw	PASSWORD	admin	$2b$10$K3zW8tlgu93qgnEcSzzveuAjgE/Ty5.lWpNEm0B/D5pgOoBbYTWeq	$2b$10$IXkIc9tV7WwvT5DfRkgz7.	2025-09-02 02:30:30.16
cmf19wyi50001bt3j0kwxq58l	cmf19wyi50000bt3jpzwypggq	PASSWORD	staff1	$2b$10$sBdiIgQCOVwJ8bvE4BP1nONZhjAuCWM5SAZ9YIbdERL6FDwEvRC0S	$2b$10$8lzRGEKZi6AVEn6JZWuMkO	2025-09-01 15:27:45.581
cmf3lrvie0003btht19w9e1ln	cmf3lrvie0002bthteycpjw7a	PASSWORD	staff001	$2b$10$sBdiIgQCOVwJ8bvE4BP1nONZhjAuCWM5SAZ9YIbdERL6FDwEvRC0S	\N	2025-09-03 06:35:16.166
cmf3m673l0006bthtmel5a74t	cmf3m673l0005btht2oywhgq0	PASSWORD	teststaff	$2b$10$sBdiIgQCOVwJ8bvE4BP1nONZhjAuCWM5SAZ9YIbdERL6FDwEvRC0S	\N	2025-09-03 06:46:24.37
\.


--
-- TOC entry 4121 (class 0 OID 32477)
-- Dependencies: 237
-- Data for Name: Banner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Banner" (id, title, description, "imageUrl", "linkType", "linkValue", "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmf2cpq2e0000btr4t6w3qlou	春季钓鱼大赛	参与春季钓鱼大赛，赢取丰厚奖品！	/static/images/banner1.jpg	ACTIVITY	spring-fishing-contest	1	t	2025-09-02 09:33:53.078	2025-09-02 09:33:53.078
cmf2cpq2v0001btr4er92mg06	会员专享优惠	成为会员享受更多优惠和特权	/static/images/banner3.jpg	EXTERNAL	/pages/membership/index	3	t	2025-09-02 09:33:53.078	2025-09-02 09:33:53.078
cmf2cpq2w0002btr4fs9puoo1	新品装备上市	最新钓鱼装备，专业品质，优惠价格	/static/images/banner2.jpg	ARTICLE	cmf2cpq2z0003btr441anr95v	2	t	2025-09-02 09:33:53.078	2025-09-02 09:33:53.103
\.


--
-- TOC entry 4115 (class 0 OID 27297)
-- Dependencies: 231
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Comment" (id, "postId", "userId", content, status, "createdAt") FROM stdin;
cmf2buusv001pbt4rjgubnsn6	cmf20tbgs0001btapno1jbsnn	cmf1xl94u0006btltiadsro02	羡慕啊，我也想去试试	VISIBLE	2025-09-02 04:30:45.387
cmf2buusz001tbt4rmq15z5ub	cmf2buus6000dbt4r1mv8087m	cmf1xl94u0006btltiadsro02	请教一下用的什么饵料？	VISIBLE	2025-09-01 19:39:52.854
cmf2buut0001vbt4rebfchmce	cmf2buus6000dbt4r1mv8087m	cmf1xl93d0002btltokby4gip	收获不错呢～	VISIBLE	2025-09-01 20:09:52.854
cmf2buut2001zbt4r9c0mxgti	cmf2buusc000gbt4rghnalwsp	cmf1xl93f0004btltry7zflf0	哇，好厉害！👍	VISIBLE	2025-09-01 21:39:52.86
cmf2buut20021bt4rvntu9k88	cmf2buusc000gbt4rghnalwsp	cmf1xl93f0004btltry7zflf0	哇，好厉害！👍	VISIBLE	2025-09-01 22:09:52.86
cmf2buut60027bt4ri4ea6ufw	cmf2buusf000obt4rjcpj3jyz	cmf1xl93f0004btltry7zflf0	哇，好厉害！👍	VISIBLE	2025-09-01 23:39:52.863
cmf2buut60029bt4r47535amz	cmf2buusf000obt4rjcpj3jyz	cmf1xl93f0004btltry7zflf0	收获不错呢～	VISIBLE	2025-09-02 00:09:52.863
cmf2buuta002fbt4ralr608dg	cmf2buusg000qbt4rqkcbmt7u	cmf1xl94u0006btltiadsro02	下次一起去吧！	VISIBLE	2025-09-02 01:39:52.863
cmf2buutb002lbt4rb7gty4sz	cmf2buush000vbt4r5r2gzp5o	cmf1xl93f0004btltry7zflf0	羡慕啊，我也想去试试	VISIBLE	2025-09-02 03:39:52.865
cmf2buutb002nbt4rlf43yrnn	cmf2buush000vbt4r5r2gzp5o	cmf1xl94u0006btltiadsro02	技术真好，向你学习！	VISIBLE	2025-09-02 04:09:52.865
cmf2buutd002tbt4rhgoo6tis	cmf2buusi0012bt4rg20nq4d9	cmf1xl93f0004btltry7zflf0	哇，好厉害！👍	VISIBLE	2025-09-02 05:39:52.866
\.


--
-- TOC entry 4118 (class 0 OID 27322)
-- Dependencies: 234
-- Data for Name: EmployeeProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmployeeProfile" (id, "userId", "employeeCode", title, active) FROM stdin;
cmf3lrvie0004btht2hmcgq2u	cmf3lrvie0002bthteycpjw7a	EMP001	前台接待	t
cmf3m673l0007bthtx8skxxki	cmf3m673l0005btht2oywhgq0	TEST001	测试专员	f
\.


--
-- TOC entry 4116 (class 0 OID 27306)
-- Dependencies: 232
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Like" (id, "postId", "userId", "createdAt") FROM stdin;
cmf2buusl001hbt4r2cpc3vkn	cmf215gav0001btqn3iajn9r7	cmf1xl93d0002btltokby4gip	2025-09-02 04:26:41.319
cmf2buusq001jbt4r87c8rli7	cmf215gav0001btqn3iajn9r7	cmf1xl93f0004btltry7zflf0	2025-09-02 04:39:43.809
cmf2buusu001lbt4rcfm8yyqo	cmf20tbgs0001btapno1jbsnn	cmf1xl93d0002btltokby4gip	2025-09-02 04:39:47.648
cmf2buusu001nbt4r9249scde	cmf20tbgs0001btapno1jbsnn	cmf1xl93f0004btltry7zflf0	2025-09-02 04:52:27.493
cmf2buusz001rbt4rp5wfpjkw	cmf2buus6000dbt4r1mv8087m	cmf1xl93f0004btltry7zflf0	2025-09-01 19:34:31.272
cmf2buut1001xbt4rmj28p7ll	cmf2buusc000gbt4rghnalwsp	cmf1xl93d0002btltokby4gip	2025-09-01 21:36:43.347
cmf2buut40023bt4r6jhbm931	cmf2buusf000obt4rjcpj3jyz	cmf1xl93f0004btltry7zflf0	2025-09-01 23:22:59.715
cmf2buut50025bt4r8oyaze97	cmf2buusf000obt4rjcpj3jyz	cmf1xl94u0006btltiadsro02	2025-09-02 00:08:35.398
cmf2buut9002bbt4rrg0q6mog	cmf2buusg000qbt4rqkcbmt7u	cmf1xl93d0002btltokby4gip	2025-09-02 01:36:28.241
cmf2buut9002dbt4rnb47gc1b	cmf2buusg000qbt4rqkcbmt7u	cmf1xl94u0006btltiadsro02	2025-09-02 02:07:39.416
cmf2buutb002hbt4r9miebnd9	cmf2buush000vbt4r5r2gzp5o	cmf1xl93f0004btltry7zflf0	2025-09-02 03:38:54.009
cmf2buutb002jbt4rgm87hocu	cmf2buush000vbt4r5r2gzp5o	cmf1xl94u0006btltiadsro02	2025-09-02 03:55:19.024
cmf2buutc002pbt4r0ck66xi3	cmf2buusi0012bt4rg20nq4d9	cmf1xl93d0002btltokby4gip	2025-09-02 05:42:13.528
cmf2buutd002rbt4redndqwzh	cmf2buusi0012bt4rg20nq4d9	cmf1xl94u0006btltiadsro02	2025-09-02 05:38:58.765
cmf2buute002vbt4rzocyq4n3	cmf2buusj0016bt4rjs7chhpj	cmf1xl93f0004btltry7zflf0	2025-09-02 07:33:22.664
cmf2buute002xbt4rrohicjys	cmf2buusj0016bt4rjs7chhpj	cmf1xl94u0006btltiadsro02	2025-09-02 07:44:04.007
\.


--
-- TOC entry 4104 (class 0 OID 27198)
-- Dependencies: 220
-- Data for Name: MemberPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberPlan" (id, name, price, "durationDays", benefits, "isActive", "createdAt", "updatedAt") FROM stdin;
cmf1zsx070000btltw88uenrb	标准月卡	68.00	30	享受所有活动会员价，优先报名权	t	2025-09-02 03:32:27.031	2025-09-02 03:32:27.031
basic-monthly	基础月卡	99.00	30	享受会员专属价格，月度套餐	t	2025-09-02 02:30:30.273	2025-09-02 09:09:52.822
premium-quarterly	高级季卡	268.00	90	季度优惠套餐，更多特权	t	2025-09-02 02:30:30.277	2025-09-02 09:09:52.825
vip-yearly	VIP年卡	888.00	365	年度超值套餐，全年无忧	t	2025-09-02 02:30:30.277	2025-09-02 09:09:52.826
\.


--
-- TOC entry 4105 (class 0 OID 27207)
-- Dependencies: 221
-- Data for Name: Membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Membership" (id, "userId", "planId", status, "startAt", "endAt", "createdAt") FROM stdin;
cmf1xp3l60005btvklubxkwkh	cmf1xl94u0006btltiadsro02	basic-monthly	ACTIVE	2025-09-02 02:33:29.706	2025-10-02 02:33:29.706	2025-09-02 02:33:29.706
cmf1xq6oi0005btxnpcj0oot3	cmf1xl94u0006btltiadsro02	basic-monthly	ACTIVE	2025-09-02 02:34:20.37	2025-10-02 02:34:20.37	2025-09-02 02:34:20.37
\.


--
-- TOC entry 4124 (class 0 OID 33613)
-- Dependencies: 240
-- Data for Name: OperationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OperationLog" (id, "userId", "userType", "userName", "operationType", action, description, "targetType", "targetId", "targetName", details, "ipAddress", "userAgent", result, "errorMessage", "createdAt") FROM stdin;
cmf2o50pn0000bt9w0126kmn4	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 14:53:42.491
cmf2o6x650000bt0ucgfyp02p	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 14:55:11.202
cmf2oieem0001bt0uznycpwwv	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 15:04:06.635
cmf2ojnn40002bt0utp6lucy4	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 15:05:05.391
cmf2oue5x0003bt0ujuq6ldll	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 15:13:26.325
cmf2ouioh0004bt0ufasjddyr	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 15:13:32.178
cmf2pgk5a0005bt0u58p6e2yn	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 15:30:40.511
cmf2s1q1x0001btrkbqte4u7y	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 16:43:07.173
cmf2tdahb0000btrc0xu430n6	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-02 17:20:06.48
cmf3h6idt0000btv0nltsvd4y	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:26:40.914
cmf3h6q8x0001btv0drygn5pz	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:26:51.106
cmf3hhnhz0002btv0srla8ask	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:35:20.731
cmf3i8nlt0000bt66zjfmjeeo	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:56:20.602
cmf3i9hga0002bt66iabf7w5x	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 04:56:59.29
cmf3i9osr0003bt660tdkczsp	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:57:08.811
cmf3ib6nm0005bt663pti5cd5	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	ORDER_CANCEL	管理员取消订单	管理员取消订单: 新手钓鱼体验营 - 客户: 测试用户	Order	cmf3f63dq000dbtv74m9u1j5v	新手钓鱼体验营 - 客户: 测试用户	\N	::1	\N	SUCCESS	\N	2025-09-03 04:58:18.61
cmf3ibhh70006bt664d654636	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:58:32.636
cmf3icllw0007bt66acw3t9te	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:59:24.644
cmf3icxfx0008bt6653c2ocjd	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 04:59:39.981
cmf3j27hh0000btbebojfsh5b	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:19:19.394
cmf3j4sr40001btbexl410t13	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:21:20.272
cmf3j56yn0002btbeyshu4lbq	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:21:38.687
cmf3jm7jg0003btbez9i6f457	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:34:52.516
cmf3jmg3i0004btbea4489a5u	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:35:03.679
cmf3jr4kn0005btbejkv1wklt	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:38:42.023
cmf3jss890006btbeg65o2n0c	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:39:59.338
cmf3jsvlg0007btbem48lzycw	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:40:03.7
cmf3jsycp0008btbe7x4b3qd1	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:40:07.274
cmf3jt01z0009btbeqmvoabao	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:40:09.479
cmf3jt6q3000abtbe9jh6m1xq	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:40:18.123
cmf3jt9tj000bbtbe8qjklkd6	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 05:40:22.135
cmf3lntwn0001btxsbhx0u5j6	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	curl/8.7.1	SUCCESS	\N	2025-09-03 06:32:07.462
cmf3lom2y0001bthto8sbaowa	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 06:32:43.978
cmf3m7suq0003btxs561llrj7	cmf3m673l0005btht2oywhgq0	STAFF	测试员工	USER_LOGIN	用户登录	用户 测试员工 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 06:47:39.219
cmf3mbiyq0009btht3s8i4atn	cmf3m673l0005btht2oywhgq0	STAFF	测试员工	USER_LOGIN	用户登录	用户 测试员工 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 06:50:33.027
cmf3me2kj000bbthtqr85eq5d	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 06:52:31.747
cmf3mhev90005btxszzb4cjku	cmf3m673l0005btht2oywhgq0	STAFF	测试员工	USER_LOGIN	用户登录	用户 测试员工 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 06:55:07.653
cmf3mzq270001bt396bi3su17	cmf3m673l0005btht2oywhgq0	STAFF	测试员工	USER_LOGIN	用户登录	用户 测试员工 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 07:09:21.967
cmf3n1swk0000btccvo52f6la	\N	\N	\N	USER_LOGIN	密码登录失败	用户 teststaff 密码登录失败: Employee account has been deactivated	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	FAILURE	Employee account has been deactivated	2025-09-03 07:10:58.965
cmf3n2s6x0002btcc8k4cfi23	cmf3lrvie0002bthteycpjw7a	STAFF	张三	USER_LOGIN	用户登录	用户 张三 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 07:11:44.697
cmf3n4a030000btcdk1ihr1oh	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 07:12:54.436
cmf3n4kx00001btcdtco9hidn	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 07:13:08.581
cmf3n4s7w0002btcd3ajzlkgb	\N	ADMIN	\N	SYSTEM_CONFIG	查看操作日志	管理员查看系统操作日志	System	\N	\N	\N	::1	\N	SUCCESS	\N	2025-09-03 07:13:18.045
cmf3n5xol0004btcdgwvtollm	cmf3lrvie0002bthteycpjw7a	STAFF	张三	USER_LOGIN	用户登录	用户 张三 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 07:14:11.781
cmf3q0if10001btdkoysin7jk	cmf3lrvie0002bthteycpjw7a	STAFF	张三	USER_LOGIN	用户登录	用户 张三 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 08:33:57.565
cmf3qxjzw0005btcdaxt7i9c6	\N	\N	\N	USER_LOGIN	密码登录失败	用户 admin 密码登录失败: Invalid credentials	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	FAILURE	Invalid credentials	2025-09-03 08:59:39.261
cmf3qybat0006btcdqg9h0sa3	\N	\N	\N	USER_LOGIN	密码登录失败	用户 admin001 密码登录失败: Invalid credentials	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	FAILURE	Invalid credentials	2025-09-03 09:00:14.646
cmf3rxe2u0001bti0qir034yr	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 09:27:31.207
cmf3sz0fx0001btmdl97y17bf	cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	USER_LOGIN	用户登录	用户 系统管理员 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 09:56:46.461
cmf3t000c0001btmt81ncsgcr	cmf3lrvie0002bthteycpjw7a	STAFF	张三	USER_LOGIN	用户登录	用户 张三 登录系统	\N	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	SUCCESS	\N	2025-09-03 09:57:32.556
\.


--
-- TOC entry 4108 (class 0 OID 27233)
-- Dependencies: 224
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "userId", type, status, "totalAmount", "payAmount", currency, "createdAt", "paidAt", "updatedAt") FROM stdin;
cmf1xodfw0001bts3zk78wpkr	cmf1xl94u0006btltiadsro02	MEMBERSHIP	PAID	99.00	99.00	CNY	2025-09-02 02:32:55.821	2025-09-02 02:32:55.819	2025-09-02 02:32:55.821
cmf1xp3l40001btvk0h80nusq	cmf1xl94u0006btltiadsro02	MEMBERSHIP	PAID	99.00	99.00	CNY	2025-09-02 02:33:29.704	2025-09-02 02:33:29.703	2025-09-02 02:33:29.704
cmf1xp3l70007btvk9o2r5rx4	cmf1xl93d0002btltokby4gip	TICKET	PAID	120.00	120.00	CNY	2025-09-02 02:33:29.707	2025-09-02 02:33:29.707	2025-09-02 02:33:29.707
cmf1xq6of0001btxn4ytbhekz	cmf1xl94u0006btltiadsro02	MEMBERSHIP	PAID	99.00	99.00	CNY	2025-09-02 02:34:20.368	2025-09-02 02:34:20.366	2025-09-02 02:34:20.368
cmf1xq6oi0007btxno25u9kct	cmf1xl93d0002btltokby4gip	TICKET	PAID	120.00	120.00	CNY	2025-09-02 02:34:20.371	2025-09-02 02:34:20.37	2025-09-02 02:34:20.371
cmf1xq6om000dbtxnsb4nkwzv	cmf1xl94u0006btltiadsro02	TICKET	PENDING	176.00	176.00	CNY	2025-09-02 02:34:20.374	\N	2025-09-02 02:34:20.374
cmf1xq6on000hbtxnv7sqp5oh	cmf1xl93d0002btltokby4gip	TICKET	PAID	120.00	120.00	CNY	2025-09-02 02:34:20.375	2025-09-01 23:34:20.375	2025-09-02 02:34:20.375
cmf3f63do0009btv7lgdnklyv	cmf2snsfq0000btqxlgaxa2pm	TICKET	PENDING	120.00	120.00	CNY	2025-09-03 03:30:22.237	\N	2025-09-03 03:30:22.237
cmf3f63d90001btv7val6mqxi	cmf2snsfq0000btqxlgaxa2pm	TICKET	REFUNDED	200.00	200.00	CNY	2025-09-03 03:30:22.221	2025-09-03 03:30:22.219	2025-09-03 04:08:20.439
cmf3f63dq000dbtv74m9u1j5v	cmf2snsfq0000btqxlgaxa2pm	TICKET	CANCELLED	120.00	120.00	CNY	2025-09-03 03:30:22.238	\N	2025-09-03 04:58:18.607
\.


--
-- TOC entry 4120 (class 0 OID 30606)
-- Dependencies: 236
-- Data for Name: OrderExtension; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderExtension" (id, "timedOrderId", "extensionType", "originalPrice", "paidAmount", "addedHours", "convertedToFullDay", "paymentStatus", "createdAt") FROM stdin;
\.


--
-- TOC entry 4109 (class 0 OID 27243)
-- Dependencies: 225
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, "orderId", type, "activityId", "sessionId", quantity, "unitPrice", "planId") FROM stdin;
cmf1xodfw0003bts39f26n57v	cmf1xodfw0001bts3zk78wpkr	MEMBERSHIP	\N	\N	1	99.00	basic-monthly
cmf1xp3l40003btvkepl4ukyo	cmf1xp3l40001btvk0h80nusq	MEMBERSHIP	\N	\N	1	99.00	basic-monthly
cmf1xp3l70009btvkc9mgn9no	cmf1xp3l70007btvk9o2r5rx4	TICKET	beginner-fishing	cmf1xl9570009btlt69eofs3e	1	120.00	\N
cmf1xq6of0003btxnz3mncjhy	cmf1xq6of0001btxn4ytbhekz	MEMBERSHIP	\N	\N	1	99.00	basic-monthly
cmf1xq6oj0009btxn6tsi3yos	cmf1xq6oi0007btxno25u9kct	TICKET	beginner-fishing	cmf1xl9570009btlt69eofs3e	1	120.00	\N
cmf1xq6om000fbtxnief4em2l	cmf1xq6om000dbtxnsb4nkwzv	TICKET	beginner-fishing	cmf1xl9570009btlt69eofs3e	2	88.00	\N
cmf1xq6on000jbtxn69664dq0	cmf1xq6on000hbtxnv7sqp5oh	TICKET	beginner-fishing	cmf1xl9570009btlt69eofs3e	1	120.00	\N
cmf3f63d90003btv7ka5ry6o9	cmf3f63d90001btv7val6mqxi	TICKET	cmf2r2all0000btcw3geyx5bu	\N	1	200.00	\N
cmf3f63do000bbtv731eqggcx	cmf3f63do0009btv7lgdnklyv	TICKET	forest-yoga	\N	1	120.00	\N
cmf3f63dq000fbtv7ikbgzm6b	cmf3f63dq000dbtv74m9u1j5v	TICKET	beginner-fishing	\N	1	120.00	\N
\.


--
-- TOC entry 4110 (class 0 OID 27251)
-- Dependencies: 226
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "orderId", provider, status, amount, currency, "prepayId", "transactionId", "mchOrderNo", "codeUrl", "notifyRaw", "createdAt", "updatedAt", "verifiedAt", "verifyNote", "verifyStatus") FROM stdin;
\.


--
-- TOC entry 4113 (class 0 OID 27278)
-- Dependencies: 229
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Post" (id, "userId", content, status, "likesCount", "commentsCount", "createdAt", "updatedAt") FROM stdin;
cmf215gav0001btqn3iajn9r7	cmf1xl94u0006btltiadsro02	今天在湖边钓鱼，收获满满！天气很好，鱼儿也很活跃。分享一下今天的钓鱼心得：选择合适的饵料很重要，耐心等待是关键。希望和更多钓友交流经验！🎣	APPROVED	2	0	2025-09-02 04:10:11.524	2025-09-02 09:09:52.877
cmf20tbgs0001btapno1jbsnn	cmf1xl94u0006btltiadsro02	今天在湖边钓鱼，收获满满！天气很好，鱼儿也很活跃。分享一下今天的钓鱼心得：选择合适的饵料很重要，耐心等待是关键。希望和更多钓友交流经验！🎣	REJECTED	2	1	2025-09-02 04:00:45.387	2025-09-02 09:09:52.883
cmf2buus6000dbt4r1mv8087m	cmf1xl93d0002btltokby4gip	今天在西湖边钓到了一条大鲤鱼！🎣 重达3.5公斤，用的是玉米粒做饵料，耐心等了2个小时才上钩。这种成就感真是无法言喻！分享给大家看看我的战利品～	APPROVED	1	2	2025-09-01 19:09:52.854	2025-09-02 09:09:52.885
cmf2buusc000gbt4rghnalwsp	cmf1xl93f0004btltry7zflf0	给新手钓友们分享一下我的装备清单📋 从左到右依次是：碳素鱼竿、进口鱼线、各种浮漂、鱼钩套装、饵料盒、抄网、鱼护、还有我的幸运帽子😄 工欲善其事必先利其器，好装备确实能提高成功率！	APPROVED	1	2	2025-09-01 21:09:52.86	2025-09-02 09:09:52.888
cmf2buusf000obt4rjcpj3jyz	cmf1xl93d0002btltokby4gip	分享几个实用的钓鱼小技巧给大家：\n\n1️⃣ 选择钓位很关键，要找有水草、石头或者倒木的地方，鱼儿喜欢在这些地方觅食和栖息\n\n2️⃣ 饵料要根据目标鱼种选择，鲤鱼喜欢玉米、红薯，草鱼偏爱青草、菜叶\n\n3️⃣ 天气也很重要，阴天或小雨天鱼儿更活跃，大晴天中午鱼儿会躲在深水区\n\n4️⃣ 耐心是最重要的，不要频繁换位置，给鱼儿一些时间发现你的饵料\n\n希望对新手朋友们有帮助！有问题可以留言交流～	APPROVED	2	2	2025-09-01 23:09:52.863	2025-09-02 09:09:52.893
cmf2buusg000qbt4rqkcbmt7u	cmf1xl93f0004btltry7zflf0	强烈推荐这个钓点！📍千岛湖钓鱼基地\n\n环境：山清水秀，空气清新，远离城市喧嚣\n鱼种：鲤鱼、草鱼、鲫鱼、黑鱼应有尽有\n设施：有遮阳棚、休息区、还能租借装备\n价格：50元/天，性价比超高\n\n最重要的是鱼儿很给面子，基本不会空军！周末约上三五好友一起去，既能钓鱼又能聊天，简直不要太爽～	APPROVED	2	1	2025-09-02 01:09:52.863	2025-09-02 09:09:52.895
cmf2buush000vbt4r5r2gzp5o	cmf1xl93d0002btltokby4gip	今天的钓友聚会太棒了！🎉 来了15个钓友，从早上6点钓到下午4点，大家收获都不错。最厉害的老王钓了8条鱼，我也钓到了5条。\n\n中午大家一起野餐，分享各自的钓鱼经验和心得，学到了很多新技巧。特别是李大哥教的调漂方法，简直是神技！\n\n期待下次聚会，我们约定下个月去水库试试深水钓法～	APPROVED	2	2	2025-09-02 03:09:52.865	2025-09-02 09:09:52.897
cmf2buusi0012bt4rg20nq4d9	cmf1xl93f0004btltry7zflf0	新手vs老手的区别😂 左边是我刚开始钓鱼时的装备，右边是现在的装备。从最简单的竹竿到现在的碳素竿，从普通鱼线到进口PE线，这一路走来真是感慨万千。\n\n不过说实话，装备虽然重要，但技术和经验更重要。记得第一次钓鱼什么都不懂，现在至少知道什么时候该换饵料了😄	APPROVED	2	1	2025-09-02 05:09:52.866	2025-09-02 09:09:52.898
cmf2buusj0016bt4rjs7chhpj	cmf1xl93d0002btltokby4gip	记录今天完整的钓鱼过程📸 从准备装备到收获满满，每一个瞬间都值得纪念！\n\n早上5点起床准备，6点到达钓点，选位、打窝、调漂...一切准备就绪后开始正式垂钓。今天运气不错，陆续上了9条鱼，有鲤鱼、草鱼、还有几条鲫鱼。\n\n最后一张是今天的全部收获，准备带回家给家人尝尝鲜～	APPROVED	2	0	2025-09-02 07:09:52.867	2025-09-02 09:09:52.9
\.


--
-- TOC entry 4114 (class 0 OID 27289)
-- Dependencies: 230
-- Data for Name: PostImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PostImage" (id, "postId", url, "sortOrder") FROM stdin;
cmf2buus6000ebt4rnekawlad	cmf2buus6000dbt4r1mv8087m	https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop	0
cmf2buusc000hbt4raf99udcu	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	0
cmf2buusc000ibt4r4mqp0vpo	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop	1
cmf2buusc000jbt4rk1mu461l	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=400&fit=crop	2
cmf2buusc000kbt4rvkzi05nh	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	3
cmf2buusc000lbt4rpi2goyru	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop	4
cmf2buusc000mbt4rs41cmzeq	cmf2buusc000gbt4rghnalwsp	https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=400&fit=crop	5
cmf2buusg000rbt4rig3ngjbt	cmf2buusg000qbt4rqkcbmt7u	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop	0
cmf2buusg000sbt4rdpku8l2s	cmf2buusg000qbt4rqkcbmt7u	https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop	1
cmf2buusg000tbt4rvgc6oed1	cmf2buusg000qbt4rqkcbmt7u	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	2
cmf2buush000wbt4rj0bxrfbu	cmf2buush000vbt4r5r2gzp5o	https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop	0
cmf2buush000xbt4rz6uzf4em	cmf2buush000vbt4r5r2gzp5o	https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop	1
cmf2buush000ybt4rkp24akif	cmf2buush000vbt4r5r2gzp5o	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop	2
cmf2buush000zbt4rcmo5tm47	cmf2buush000vbt4r5r2gzp5o	https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop	3
cmf2buush0010bt4rxlrxjdeb	cmf2buush000vbt4r5r2gzp5o	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	4
cmf2buusi0013bt4r8665kmqg	cmf2buusi0012bt4rg20nq4d9	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop	0
cmf2buusi0014bt4rh0otz0jg	cmf2buusi0012bt4rg20nq4d9	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	1
cmf2buusj0017bt4r6zpnnd1m	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	0
cmf2buusj0018bt4rzzvnd5rj	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop	1
cmf2buusj0019bt4rxf1v0lep	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=400&fit=crop	2
cmf2buusj001abt4r6l4wu75o	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop	3
cmf2buusj001bbt4r0idhgmp6	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop	4
cmf2buusj001cbt4rk1ncxxre	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop	5
cmf2buusj001dbt4r5omfkhuq	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop	6
cmf2buusj001ebt4r71815bn6	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop	7
cmf2buusj001fbt4rr1cngnfu	cmf2buusj0016bt4rjs7chhpj	https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop	8
\.


--
-- TOC entry 4117 (class 0 OID 27314)
-- Dependencies: 233
-- Data for Name: ShopInfo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShopInfo" (id, name, address, phone, about, images) FROM stdin;
\.


--
-- TOC entry 4111 (class 0 OID 27261)
-- Dependencies: 227
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ticket" (id, "orderItemId", "activityId", "sessionId", code, status, "verifiedAt", "verifiedById", "createdAt") FROM stdin;
cmf1xq6oj000bbtxncm9pfg0h	cmf1xq6oj0009btxn6tsi3yos	beginner-fishing	cmf1xl9570009btlt69eofs3e	T1756780460371AB5F	UNUSED	\N	\N	2025-09-02 02:34:20.372
cmf1xq6oo000lbtxndkmpekoq	cmf1xq6on000jbtxn69664dq0	beginner-fishing	cmf1xl9570009btlt69eofs3e	T175678046137664ZO	USED	2025-09-02 00:34:20.376	cmf1xl94u0006btltiadsro02	2025-09-02 02:34:20.376
cmf3f63dc0005btv74ca3uo27	cmf3f63d90003btv7ka5ry6o9	cmf2r2all0000btcw3geyx5bu	cmf2t6uuu0005bt0437dk1msg	TEST1756870222224	USED	2025-09-03 03:30:22.224	\N	2025-09-03 03:30:22.224
\.


--
-- TOC entry 4119 (class 0 OID 30596)
-- Dependencies: 235
-- Data for Name: TimedOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimedOrder" (id, "ticketId", "activityId", "startTime", "endTime", "durationHours", status, "isExpired", "expiredAt", "notifiedAt", "createdAt", "updatedAt") FROM stdin;
cmf3f63dd0007btv7p0nm79dv	cmf3f63dc0005btv74ca3uo27	cmf2r2all0000btcw3geyx5bu	2025-09-03 03:30:22.225	\N	3	ACTIVE	f	2025-09-03 06:30:22.225	\N	2025-09-03 03:30:22.225	2025-09-03 03:30:22.225
\.


--
-- TOC entry 4102 (class 0 OID 27181)
-- Dependencies: 218
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, role, nickname, "avatarUrl", phone, "createdAt", "updatedAt") FROM stdin;
cmf19wyi50000bt3jpzwypggq	STAFF	\N	\N	\N	2025-09-01 15:27:45.581	2025-09-01 15:27:45.581
cmf1xl91r0000btltnn4cxlhw	ADMIN	系统管理员	\N	\N	2025-09-02 02:30:30.16	2025-09-02 02:30:30.16
cmf1xl93d0002btltokby4gip	CUSTOMER	钓鱼爱好者小李	\N	\N	2025-09-02 02:30:30.217	2025-09-02 02:30:30.217
cmf1xl93f0004btltry7zflf0	CUSTOMER	周末钓客老张	\N	\N	2025-09-02 02:30:30.219	2025-09-02 02:30:30.219
cmf1xl94u0006btltiadsro02	CUSTOMER	测试用户	\N	\N	2025-09-02 02:30:30.271	2025-09-02 02:30:30.271
cmf2snsfq0000btqxlgaxa2pm	CUSTOMER	测试用户	\N	13800138000	2025-09-02 17:00:16.695	2025-09-02 17:00:16.695
cmf3lrvie0002bthteycpjw7a	STAFF	张三	\N	13900139000	2025-09-03 06:35:16.166	2025-09-03 06:35:16.166
cmf3m673l0005btht2oywhgq0	STAFF	测试员工	\N	13700137000	2025-09-03 06:46:24.37	2025-09-03 06:46:24.37
\.


--
-- TOC entry 4112 (class 0 OID 27270)
-- Dependencies: 228
-- Data for Name: VerificationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationLog" (id, "ticketId", "verifiedById", result, note, "createdAt") FROM stdin;
\.


--
-- TOC entry 4101 (class 0 OID 27074)
-- Dependencies: 217
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6b82f9fa-8427-4acf-9e08-e47725f29ac2	1c7901b805190a8df090d09cb5838319003cf863d7065aa351eac2c8735559d2	2025-09-01 21:44:01.271443+08	20250901134401_init	\N	\N	2025-09-01 21:44:01.255692+08	1
219b7740-0871-4698-be3a-976c5a7d82f2	6d2cdf0d7971ed4230d07c0c70bd7c727554bf5b3a11ac9bb66acf4b9a00f093	2025-09-01 23:31:52.743999+08	20250901153152_membership_plan_in_orderitem	\N	\N	2025-09-01 23:31:52.741731+08	1
2f90df46-14c3-4d3e-84d9-946e773006ec	2dfc8ea3b8cc2fc71be8f163382b57ec4883c4a80c2b6fff3f2d44016dc1b0b0	2025-09-02 00:38:53.812428+08	20250901163853_wechat_payment_idempotency	\N	\N	2025-09-02 00:38:53.80496+08	1
03ec3eab-1342-4ced-85a1-a6c3d1bcea49	5be5c1f3683d18d9bac83e5351e5f4ec00e6ad2e602de8178099e35fe07f0b12	2025-09-02 00:57:22.829999+08	20250901165722_payment_verify_fields	\N	\N	2025-09-02 00:57:22.828921+08	1
0fb6f4d6-5f09-4ed9-b66d-8014e0edb149	24a919fc8e7964e8eeadac1e32668198d438840ee40de88e57b47ac92c1daac2	2025-09-02 15:12:24.069469+08	20250902071224_add_time_management_system	\N	\N	2025-09-02 15:12:24.06166+08	1
b105d619-2bc7-4ee2-9373-3fde2dc70fc3	fa5653d05fb85411b2a802eab961878fc1f975e09474c772531e64fbdff86724	2025-09-02 15:42:28.962499+08	20250902074228_add_activity_sort_order	\N	\N	2025-09-02 15:42:28.959822+08	1
d5d9ae9f-c37f-422a-828f-3a9cf6931387	52a9974d066cbe6ecebc0d20578705c77159675df527420854f296535329468b	2025-09-02 17:27:51.610326+08	20250902092751_add_content_management_system	\N	\N	2025-09-02 17:27:51.601936+08	1
8d2b926d-dd28-49ee-afe4-6006a2892bac	a705244b2335302d0f84845a38e82caf2a9e66b1c87f64b1708ef454ecf6a93a	2025-09-02 22:38:36.262614+08	20250902143836_add_operation_log_table	\N	\N	2025-09-02 22:38:36.255029+08	1
cdc98cd7-bd28-4b1d-bb2c-85d3540c43dd	340c92c9f61c96f03dab8d6ae20c43dcace4d7cc514b322de543ede5461e4fcc	2025-09-02 23:40:01.062614+08	20250902154001_add_news_model	\N	\N	2025-09-02 23:40:01.059714+08	1
1611a65f-dabf-4284-8e44-3346a000b85f	35f7c204df3465604a8c32c96e3d542f3ba614d7f3e84b5dbddbe983bacce1aa	2025-09-03 00:06:42.007589+08	20250902160642_add_activity_upgrade_price_and_both_time_type	\N	\N	2025-09-03 00:06:42.006188+08	1
7489c5a7-40f6-4623-889e-788e4e58ac9c	fdda53c57ddbb621111f44bdfdaf1b55ec527f7c5934de3efb470ec65a77c201	2025-09-03 12:55:18.239497+08	20250903045518_update_operation_enums	\N	\N	2025-09-03 12:55:18.238645+08	1
\.


--
-- TOC entry 4125 (class 0 OID 34841)
-- Dependencies: 241
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, title, content, author, status, "publishedAt", "createdAt", "updatedAt") FROM stdin;
cmf3rqa0s0000bt87j6emgwe4	钓鱼技巧分享：如何选择合适的钓位	<p>选择合适的钓位是钓鱼成功的关键因素之一。本文将为大家分享一些实用的钓位选择技巧。</p><h3>1. 观察水情</h3><p>首先要观察水的颜色、流速和深度。清澈的水质通常鱼儿比较警觉，而略显浑浊的水质鱼儿相对放松。</p><h3>2. 寻找鱼道</h3><p>鱼道是鱼儿经常游动的路径，通常在水草边缘、石头缝隙或者深浅交界处。</p><h3>3. 考虑天气因素</h3><p>阴天或小雨天气鱼儿更加活跃，是钓鱼的好时机。</p>	钓鱼专家老李	PUBLISHED	2025-09-03 09:21:59.355	2025-09-03 09:21:59.356	2025-09-03 09:21:59.356
cmf3rqa0t0001bt87qcjchuru	春季钓鱼装备推荐	<p>春季是钓鱼的黄金季节，合适的装备能让你事半功倍。</p><h3>必备装备清单：</h3><ul><li>轻便钓竿：3.6-4.5米碳素竿</li><li>优质鱼线：0.8-1.2号主线</li><li>精选浮漂：芦苇材质，灵敏度高</li><li>多样鱼钩：袖钩、伊豆钩各备几号</li></ul><p>春季鱼儿刚从冬眠中苏醒，食欲旺盛但警觉性高，选择合适的装备至关重要。</p>	装备达人小王	PUBLISHED	2025-09-03 09:21:59.356	2025-09-03 09:21:59.357	2025-09-03 09:21:59.357
cmf3rqa100002bt87zz8u0mb3	钓鱼比赛规则详解	<p>为了让更多钓友了解钓鱼比赛规则，特此整理详细说明。</p><h3>比赛时间</h3><p>比赛时间为上午8:00-下午16:00，共8小时。</p><h3>计分规则</h3><p>按照鱼的重量计分，每100克计1分。</p><h3>禁用物品</h3><p>禁止使用电子诱鱼器、网具等辅助工具。</p>	比赛组委会	PUBLISHED	2025-09-03 09:21:59.363	2025-09-03 09:21:59.364	2025-09-03 09:21:59.364
cmf3rqa1l0003bt872jswa8gx	新手钓鱼常见误区及解决方案	<p>很多新手钓友在刚开始钓鱼时会犯一些常见的错误，本文总结了最常见的几个误区。</p><h3>误区一：频繁换位</h3><p>很多新手没耐心，一个位置钓不到鱼就马上换地方。实际上，钓鱼需要耐心等待。</p><h3>误区二：饵料过多</h3><p>新手往往认为饵料越多越好，实际上过多的饵料会让鱼儿吃饱而不咬钩。</p><h3>误区三：忽视天气</h3><p>天气对钓鱼影响很大，选择合适的天气出钓事半功倍。</p>	钓鱼教练张师傅	PUBLISHED	2025-09-03 09:21:59.385	2025-09-03 09:21:59.385	2025-09-03 09:21:59.385
cmf3rqa1l0004bt874hs18oir	夏季钓鱼安全注意事项	<p>夏季钓鱼虽然鱼儿活跃，但也要注意安全问题。</p><h3>防暑降温</h3><p>准备充足的饮用水，穿着透气的衣物，避免中暑。</p><h3>防蚊虫叮咬</h3><p>携带驱蚊液，穿长袖长裤保护皮肤。</p><h3>注意用电安全</h3><p>雷雨天气不要使用电子设备，避免雷击。</p>	安全专员小刘	DRAFT	\N	2025-09-03 09:21:59.385	2025-09-03 09:21:59.385
\.


--
-- TOC entry 3853 (class 2606 OID 27232)
-- Name: ActivitySession ActivitySession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivitySession"
    ADD CONSTRAINT "ActivitySession_pkey" PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 27225)
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- TOC entry 3916 (class 2606 OID 32506)
-- Name: ArticleImage ArticleImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArticleImage"
    ADD CONSTRAINT "ArticleImage_pkey" PRIMARY KEY (id);


--
-- TOC entry 3911 (class 2606 OID 32498)
-- Name: Article Article_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Article"
    ADD CONSTRAINT "Article_pkey" PRIMARY KEY (id);


--
-- TOC entry 3839 (class 2606 OID 27197)
-- Name: AuthIdentity AuthIdentity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY (id);


--
-- TOC entry 3909 (class 2606 OID 32487)
-- Name: Banner Banner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Banner"
    ADD CONSTRAINT "Banner_pkey" PRIMARY KEY (id);


--
-- TOC entry 3885 (class 2606 OID 27305)
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3895 (class 2606 OID 27329)
-- Name: EmployeeProfile EmployeeProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeProfile"
    ADD CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY (id);


--
-- TOC entry 3888 (class 2606 OID 27313)
-- Name: Like Like_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY (id);


--
-- TOC entry 3843 (class 2606 OID 27206)
-- Name: MemberPlan MemberPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPlan"
    ADD CONSTRAINT "MemberPlan_pkey" PRIMARY KEY (id);


--
-- TOC entry 3845 (class 2606 OID 27216)
-- Name: Membership Membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY (id);


--
-- TOC entry 3920 (class 2606 OID 33621)
-- Name: OperationLog OperationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OperationLog"
    ADD CONSTRAINT "OperationLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 3905 (class 2606 OID 30615)
-- Name: OrderExtension OrderExtension_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderExtension"
    ADD CONSTRAINT "OrderExtension_pkey" PRIMARY KEY (id);


--
-- TOC entry 3860 (class 2606 OID 27250)
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3855 (class 2606 OID 27242)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- TOC entry 3866 (class 2606 OID 27260)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3882 (class 2606 OID 27296)
-- Name: PostImage PostImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostImage"
    ADD CONSTRAINT "PostImage_pkey" PRIMARY KEY (id);


--
-- TOC entry 3879 (class 2606 OID 27288)
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- TOC entry 3892 (class 2606 OID 27321)
-- Name: ShopInfo ShopInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShopInfo"
    ADD CONSTRAINT "ShopInfo_pkey" PRIMARY KEY (id);


--
-- TOC entry 3872 (class 2606 OID 27269)
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- TOC entry 3900 (class 2606 OID 30605)
-- Name: TimedOrder TimedOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimedOrder"
    ADD CONSTRAINT "TimedOrder_pkey" PRIMARY KEY (id);


--
-- TOC entry 3837 (class 2606 OID 27189)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3875 (class 2606 OID 27277)
-- Name: VerificationLog VerificationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationLog"
    ADD CONSTRAINT "VerificationLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 3834 (class 2606 OID 27082)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3925 (class 2606 OID 34849)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- TOC entry 3850 (class 1259 OID 27334)
-- Name: ActivitySession_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivitySession_activityId_idx" ON public."ActivitySession" USING btree ("activityId");


--
-- TOC entry 3851 (class 1259 OID 27335)
-- Name: ActivitySession_activityId_startAt_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ActivitySession_activityId_startAt_key" ON public."ActivitySession" USING btree ("activityId", "startAt");


--
-- TOC entry 3849 (class 1259 OID 31546)
-- Name: Activity_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Activity_sortOrder_idx" ON public."Activity" USING btree ("sortOrder");


--
-- TOC entry 3914 (class 1259 OID 32510)
-- Name: ArticleImage_articleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ArticleImage_articleId_idx" ON public."ArticleImage" USING btree ("articleId");


--
-- TOC entry 3912 (class 1259 OID 32508)
-- Name: Article_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Article_status_publishedAt_idx" ON public."Article" USING btree (status, "publishedAt");


--
-- TOC entry 3913 (class 1259 OID 32509)
-- Name: Article_status_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Article_status_sortOrder_idx" ON public."Article" USING btree (status, "sortOrder");


--
-- TOC entry 3840 (class 1259 OID 27332)
-- Name: AuthIdentity_provider_externalId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AuthIdentity_provider_externalId_key" ON public."AuthIdentity" USING btree (provider, "externalId");


--
-- TOC entry 3841 (class 1259 OID 27331)
-- Name: AuthIdentity_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuthIdentity_userId_idx" ON public."AuthIdentity" USING btree ("userId");


--
-- TOC entry 3907 (class 1259 OID 32507)
-- Name: Banner_isActive_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Banner_isActive_sortOrder_idx" ON public."Banner" USING btree ("isActive", "sortOrder");


--
-- TOC entry 3886 (class 1259 OID 27349)
-- Name: Comment_postId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Comment_postId_createdAt_idx" ON public."Comment" USING btree ("postId", "createdAt");


--
-- TOC entry 3893 (class 1259 OID 27353)
-- Name: EmployeeProfile_employeeCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmployeeProfile_employeeCode_key" ON public."EmployeeProfile" USING btree ("employeeCode");


--
-- TOC entry 3896 (class 1259 OID 27352)
-- Name: EmployeeProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON public."EmployeeProfile" USING btree ("userId");


--
-- TOC entry 3889 (class 1259 OID 27350)
-- Name: Like_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Like_postId_idx" ON public."Like" USING btree ("postId");


--
-- TOC entry 3890 (class 1259 OID 27351)
-- Name: Like_postId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Like_postId_userId_key" ON public."Like" USING btree ("postId", "userId");


--
-- TOC entry 3846 (class 1259 OID 27333)
-- Name: Membership_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Membership_userId_idx" ON public."Membership" USING btree ("userId");


--
-- TOC entry 3917 (class 1259 OID 33624)
-- Name: OperationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationLog_createdAt_idx" ON public."OperationLog" USING btree ("createdAt");


--
-- TOC entry 3918 (class 1259 OID 33623)
-- Name: OperationLog_operationType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationLog_operationType_idx" ON public."OperationLog" USING btree ("operationType");


--
-- TOC entry 3921 (class 1259 OID 33626)
-- Name: OperationLog_result_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationLog_result_idx" ON public."OperationLog" USING btree (result);


--
-- TOC entry 3922 (class 1259 OID 33622)
-- Name: OperationLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationLog_userId_idx" ON public."OperationLog" USING btree ("userId");


--
-- TOC entry 3923 (class 1259 OID 33625)
-- Name: OperationLog_userType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationLog_userType_idx" ON public."OperationLog" USING btree ("userType");


--
-- TOC entry 3906 (class 1259 OID 30621)
-- Name: OrderExtension_timedOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderExtension_timedOrderId_idx" ON public."OrderExtension" USING btree ("timedOrderId");


--
-- TOC entry 3857 (class 1259 OID 27338)
-- Name: OrderItem_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_activityId_idx" ON public."OrderItem" USING btree ("activityId");


--
-- TOC entry 3858 (class 1259 OID 27337)
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- TOC entry 3861 (class 1259 OID 28228)
-- Name: OrderItem_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_planId_idx" ON public."OrderItem" USING btree ("planId");


--
-- TOC entry 3862 (class 1259 OID 27339)
-- Name: OrderItem_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_sessionId_idx" ON public."OrderItem" USING btree ("sessionId");


--
-- TOC entry 3856 (class 1259 OID 27336)
-- Name: Order_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_userId_createdAt_idx" ON public."Order" USING btree ("userId", "createdAt");


--
-- TOC entry 3863 (class 1259 OID 29011)
-- Name: Payment_mchOrderNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_mchOrderNo_key" ON public."Payment" USING btree ("mchOrderNo");


--
-- TOC entry 3864 (class 1259 OID 27340)
-- Name: Payment_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_orderId_key" ON public."Payment" USING btree ("orderId");


--
-- TOC entry 3867 (class 1259 OID 29010)
-- Name: Payment_transactionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_transactionId_key" ON public."Payment" USING btree ("transactionId");


--
-- TOC entry 3883 (class 1259 OID 27348)
-- Name: PostImage_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PostImage_postId_idx" ON public."PostImage" USING btree ("postId");


--
-- TOC entry 3880 (class 1259 OID 27347)
-- Name: Post_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_status_createdAt_idx" ON public."Post" USING btree (status, "createdAt");


--
-- TOC entry 3868 (class 1259 OID 27343)
-- Name: Ticket_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ticket_activityId_idx" ON public."Ticket" USING btree ("activityId");


--
-- TOC entry 3869 (class 1259 OID 27341)
-- Name: Ticket_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Ticket_code_key" ON public."Ticket" USING btree (code);


--
-- TOC entry 3870 (class 1259 OID 27342)
-- Name: Ticket_orderItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ticket_orderItemId_idx" ON public."Ticket" USING btree ("orderItemId");


--
-- TOC entry 3873 (class 1259 OID 27344)
-- Name: Ticket_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ticket_sessionId_idx" ON public."Ticket" USING btree ("sessionId");


--
-- TOC entry 3897 (class 1259 OID 30618)
-- Name: TimedOrder_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimedOrder_activityId_idx" ON public."TimedOrder" USING btree ("activityId");


--
-- TOC entry 3898 (class 1259 OID 30620)
-- Name: TimedOrder_expiredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimedOrder_expiredAt_idx" ON public."TimedOrder" USING btree ("expiredAt");


--
-- TOC entry 3901 (class 1259 OID 30619)
-- Name: TimedOrder_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimedOrder_status_idx" ON public."TimedOrder" USING btree (status);


--
-- TOC entry 3902 (class 1259 OID 30617)
-- Name: TimedOrder_ticketId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimedOrder_ticketId_idx" ON public."TimedOrder" USING btree ("ticketId");


--
-- TOC entry 3903 (class 1259 OID 30616)
-- Name: TimedOrder_ticketId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TimedOrder_ticketId_key" ON public."TimedOrder" USING btree ("ticketId");


--
-- TOC entry 3835 (class 1259 OID 27330)
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- TOC entry 3876 (class 1259 OID 27345)
-- Name: VerificationLog_ticketId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationLog_ticketId_idx" ON public."VerificationLog" USING btree ("ticketId");


--
-- TOC entry 3877 (class 1259 OID 27346)
-- Name: VerificationLog_verifiedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationLog_verifiedById_idx" ON public."VerificationLog" USING btree ("verifiedById");


--
-- TOC entry 3926 (class 1259 OID 34851)
-- Name: news_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "news_status_createdAt_idx" ON public.news USING btree (status, "createdAt");


--
-- TOC entry 3927 (class 1259 OID 34850)
-- Name: news_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "news_status_publishedAt_idx" ON public.news USING btree (status, "publishedAt");


--
-- TOC entry 3931 (class 2606 OID 27369)
-- Name: ActivitySession ActivitySession_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivitySession"
    ADD CONSTRAINT "ActivitySession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3954 (class 2606 OID 32511)
-- Name: ArticleImage ArticleImage_articleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArticleImage"
    ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES public."Article"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3928 (class 2606 OID 27354)
-- Name: AuthIdentity AuthIdentity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3946 (class 2606 OID 27439)
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3947 (class 2606 OID 27444)
-- Name: Comment Comment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3950 (class 2606 OID 27459)
-- Name: EmployeeProfile EmployeeProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeProfile"
    ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3948 (class 2606 OID 27449)
-- Name: Like Like_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3949 (class 2606 OID 27454)
-- Name: Like Like_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3929 (class 2606 OID 27364)
-- Name: Membership Membership_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."MemberPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3930 (class 2606 OID 27359)
-- Name: Membership Membership_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3955 (class 2606 OID 33627)
-- Name: OperationLog OperationLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OperationLog"
    ADD CONSTRAINT "OperationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3953 (class 2606 OID 30632)
-- Name: OrderExtension OrderExtension_timedOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderExtension"
    ADD CONSTRAINT "OrderExtension_timedOrderId_fkey" FOREIGN KEY ("timedOrderId") REFERENCES public."TimedOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3933 (class 2606 OID 27384)
-- Name: OrderItem OrderItem_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3934 (class 2606 OID 27379)
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3935 (class 2606 OID 28229)
-- Name: OrderItem OrderItem_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."MemberPlan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3936 (class 2606 OID 27389)
-- Name: OrderItem OrderItem_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."ActivitySession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3932 (class 2606 OID 27374)
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3937 (class 2606 OID 27394)
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3945 (class 2606 OID 27434)
-- Name: PostImage PostImage_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostImage"
    ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3944 (class 2606 OID 27429)
-- Name: Post Post_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3938 (class 2606 OID 27404)
-- Name: Ticket Ticket_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3939 (class 2606 OID 27399)
-- Name: Ticket Ticket_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3940 (class 2606 OID 27409)
-- Name: Ticket Ticket_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."ActivitySession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3941 (class 2606 OID 27414)
-- Name: Ticket Ticket_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3951 (class 2606 OID 30627)
-- Name: TimedOrder TimedOrder_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimedOrder"
    ADD CONSTRAINT "TimedOrder_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3952 (class 2606 OID 30622)
-- Name: TimedOrder TimedOrder_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimedOrder"
    ADD CONSTRAINT "TimedOrder_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3942 (class 2606 OID 27419)
-- Name: VerificationLog VerificationLog_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationLog"
    ADD CONSTRAINT "VerificationLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3943 (class 2606 OID 27424)
-- Name: VerificationLog VerificationLog_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationLog"
    ADD CONSTRAINT "VerificationLog_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-09-03 18:26:37 CST

--
-- PostgreSQL database dump complete
--

\unrestrict 7gpxH8yEFhP5T7iwBxbgKTMgEbkhgX4IFocG3d7jM7I3e8lb9dpMKeNlBB2tEB3

