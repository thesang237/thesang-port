// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TaskType = 'build' | 'learn' | 'study';

export type Task = {
    type: TaskType;
    text: string;
};

export type Week = {
    week: number;
    phase: string;
    phaseColor: string;
    title: string;
    goal: string;
    tasks: Task[];
    deliverable: string;
    resources: string[];
};

export type Phase = {
    name: string;
    color: string;
    weeks: string;
    desc: string;
};

export type OngoingProject = {
    name: string;
    status: string;
    desc: string;
    color: string;
};

export type KPI = {
    metric: string;
    target: string;
};

export type RoutineBlock = {
    time: string;
    emoji: string;
    activity: string;
};

export type AITool = {
    tool: string;
    use: string;
};

export type PanelKey = 'roadmap' | 'kpi' | 'routine';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

export const TASK_META: Record<TaskType, { icon: string; label: string }> = {
    build: { icon: '⚡', label: 'BUILD' },
    learn: { icon: '📘', label: 'LEARN' },
    study: { icon: '🔍', label: 'STUDY' },
};

export const PHASES: Phase[] = [
    { name: 'FOUNDATION', color: '#6ee7b7', weeks: '1–3', desc: 'Toolchain, design system, animations' },
    { name: 'PORTFOLIO BUILD', color: '#c4b5fd', weeks: '4–6', desc: '4 projects chất lượng cao' },
    { name: 'ENGINEERING DEPTH', color: '#fbbf24', weeks: '7–8', desc: 'Performance, testing, OSS' },
    { name: 'PORTFOLIO & BRAND', color: '#f472b6', weeks: '9–10', desc: 'Portfolio site, case studies, content' },
    { name: 'JOB HUNT', color: '#fb923c', weeks: '11–12', desc: 'Apply, networking, interviews' },
];

export const ONGOING_PROJECTS: OngoingProject[] = [
    {
        name: 'theme-studio',
        status: 'ongoing',
        desc: 'Color/theme tool — tiếp tục refine song song với roadmap, dùng làm case study #1',
        color: '#6ee7b7',
    },
];

export const KPIS: KPI[] = [
    { metric: 'Giờ code thực tế', target: '≥ 25h/tuần' },
    { metric: 'Commits', target: '≥ 20/tuần' },
    { metric: 'Blog posts/content', target: '≥ 1/2 tuần (từ tuần 7)' },
    { metric: 'OSS contributions', target: '≥ 1 PR/tuần (từ tuần 8)' },
    { metric: 'Twitter engagement', target: 'Daily (từ tuần 10)' },
    { metric: 'Applications', target: '15-20 total (tuần 11-12)' },
];

export const DAILY_ROUTINE: RoutineBlock[] = [
    { time: '08:00–08:30', emoji: '☀️', activity: 'Review goals, plan the day' },
    { time: '08:30–11:30', emoji: '🔨', activity: 'Deep work: Coding/Building (3h)' },
    { time: '11:30–12:00', emoji: '📖', activity: 'Study: docs, articles, source code (30m)' },
    { time: '12:00–13:00', emoji: '🍜', activity: 'Lunch break' },
    { time: '13:00–15:00', emoji: '🔨', activity: 'Deep work: Coding/Building (2h)' },
    { time: '15:00–15:30', emoji: '📱', activity: 'Twitter/Community engagement (30m)' },
    { time: '15:30–16:30', emoji: '📺', activity: 'Study: tutorials, blogs (1h)' },
    { time: '16:30–17:00', emoji: '📝', activity: 'Journal: learnings, blockers, tomorrow plan' },
];

export const AI_TOOLS: AITool[] = [
    { tool: 'Claude', use: 'Code review, refactor, technical blog posts, debug complex issues, brainstorm' },
    { tool: 'Cursor/Copilot', use: 'Code completion khi build — LUÔN đọc hiểu code generate' },
    { tool: 'Antigravity', use: 'UI prototyping nhanh, generate starting points → customize' },
    { tool: 'v0.dev', use: 'Generate UI components → study patterns → adapt vào design system riêng' },
];

export const LEVERAGE: string[] = [
    'Design eye — nhìn ra UX issues mà dev bỏ qua',
    'Figma fluency — nói chung ngôn ngữ với designers',
    'Product thinking — hiểu WHY, không chỉ HOW',
    'AI-augmented workflow — code nhanh, focus creativity',
];

export const WARNINGS: string[] = [
    'Học mà không build — tutorial hell, mỗi tuần PHẢI ship',
    'Quá nhiều tools — stick với stack, đừng nhảy qua lại',
    'Copy paste AI — PHẢI hiểu mỗi dòng code',
    'Bỏ qua accessibility — dealbreaker tại startups lớn',
    'Portfolio chỉ có screenshot — cần live demos, video',
    'Không networking — 50%+ jobs từ referrals',
];

export const DEFINITION_OF_DONE: string[] = [
    'Portfolio site live với ≥ 4 projects + 2 case studies',
    'GitHub profile active: contributions hàng ngày, OSS PRs',
    '≥ 3 blog posts published',
    '≥ 1 OSS PR merged vào repo nổi tiếng',
    'Twitter/LinkedIn presence established',
    '15-20 applications sent to target companies',
    'Sẵn sàng handle take-home challenges + technical interviews',
    "Có thể tự tin nói: 'I bridge design and engineering — I build the interfaces that designers dream of'",
];

export const WEEKS: Week[] = [
    {
        week: 1,
        phase: 'FOUNDATION',
        phaseColor: '#6ee7b7',
        title: 'Identity, Toolchain & Production React',
        goal: 'Dev environment chuẩn chỉnh + viết React/TS đạt chuẩn production',
        tasks: [
            { type: 'build', text: 'Mua domain cá nhân (ten.dev / ten.design) — Namecheap hoặc Cloudflare' },
            { type: 'build', text: "Setup GitHub profile README chuyên nghiệp — pinned repos, bio 'Design Engineer'" },
            { type: 'build', text: 'Tạo monorepo portfolio: Next.js 15 App Router + TailwindCSS + Framer Motion' },
            { type: 'build', text: 'Hoàn thiện theme-studio — fix bugs, refactor code clean, viết README đẹp' },
            { type: 'build', text: 'Viết lại 3 component trong theme-studio theo chuẩn Radix (composable, accessible)' },
            { type: 'build', text: 'Setup ESLint strict + Prettier + Husky pre-commit hooks cho tất cả repos' },
            { type: 'learn', text: 'TypeScript nâng cao cho React: generics, discriminated unions, ComponentPropsWithoutRef, polymorphic components' },
            { type: 'learn', text: 'React patterns: compound components, render props, controlled/uncontrolled, custom hooks' },
            { type: 'study', text: 'Đọc source code Radix UI — Dialog, Popover, Select — cách build accessible primitives' },
            { type: 'study', text: 'Nghiên cứu portfolio: rauno.me, paco.me, emilkowal.ski — note interaction patterns' },
        ],
        deliverable: 'Repo portfolio trên GitHub + domain DNS + theme-studio chạy không lỗi, code clean',
        resources: ['Total TypeScript — React with TypeScript', 'Radix UI source code — Dialog, Popover, Select', 'Patterns.dev — React patterns', 'Next.js App Router docs'],
    },
    {
        week: 2,
        phase: 'FOUNDATION',
        phaseColor: '#6ee7b7',
        title: 'Design Tokens + Design System Engineering',
        goal: 'Build mini design system chất lượng cao — thứ khiến nhà tuyển dụng ấn tượng',
        tasks: [
            { type: 'build', text: 'Build design tokens: colors (semantic), spacing scale, typography, radius, shadows — CSS custom properties' },
            { type: 'build', text: 'Build package @sang/ui: Button (variants, sizes, loading, icon), Input + Select (validation states)' },
            { type: 'build', text: 'Tiếp: Dialog + Popover (accessible, animated), Tooltip, Toast, Badge, Avatar' },
            { type: 'build', text: 'Mỗi component: TypeScript strict, CVA/Tailwind Variants, keyboard navigation, mọi state' },
            { type: 'build', text: 'Document bằng Storybook + publish lên npm (hoặc GitHub Packages)' },
            { type: 'learn', text: 'Design tokens: Figma Tokens → code (Style Dictionary, Token Studio)' },
            { type: 'learn', text: 'CSS architecture: CSS Modules vs CSS-in-JS vs Vanilla Extract vs Tailwind — khi nào dùng gì' },
            { type: 'learn', text: 'Theming: Radix Colors approach, color scales, dark mode implementation' },
            { type: 'study', text: "Nghiên cứu Radix Colors, Shadcn/ui source, Linear's component patterns" },
        ],
        deliverable: 'Package @sang/ui trên npm/GitHub với Storybook docs — hiểu flow Design Token → Code → Component → Docs',
        resources: ['Radix Colors docs', 'Style Dictionary docs', 'Vanilla Extract docs', 'Shadcn/ui source code', 'CVA docs (cva.style)'],
    },
    {
        week: 3,
        phase: 'FOUNDATION',
        phaseColor: '#6ee7b7',
        title: 'Animation & Micro-interactions Mastery',
        goal: 'Master animation — skill phân biệt Design Engineer với Frontend Dev thông thường',
        tasks: [
            { type: 'build', text: 'Build 5 micro-interactions: hover card 3D tilt, magnetic button, text reveal, stagger list, page transition' },
            { type: 'build', text: "Clone Linear's feature card hover effect (gradient follow cursor)" },
            { type: 'build', text: "Build animated tab component giống Vercel's dashboard tabs" },
            { type: 'build', text: 'Project: Animated Landing Page — clone chất lượng tương đương Linear/Resend' },
            { type: 'build', text: '→ Hero section text reveal, scroll-triggered features, smooth page transitions, interactive hover effects, dark mode toggle' },
            { type: 'build', text: 'Record demo video + deploy lên Vercel' },
            { type: 'learn', text: 'Framer Motion nâng cao: AnimatePresence, layout animations, shared layout, useMotionValue, useTransform' },
            { type: 'learn', text: 'GSAP: ScrollTrigger, timeline orchestration, SplitText' },
            { type: 'learn', text: 'CSS: @keyframes nâng cao, cubic-bezier custom, will-change, GPU compositing, spring physics' },
            { type: 'study', text: 'Inspect animations: linear.app, raycast.com, resend.com — note timing, easing, choreography' },
        ],
        deliverable: '5+ micro-interactions collection + Animated Landing Page deployed — Portfolio piece #1',
        resources: [
            'Framer Motion docs — Advanced section',
            'GSAP docs — ScrollTrigger plugin',
            'Motion One — lightweight alternative',
            "Josh Comeau's CSS animation guide",
            'Lenis smooth scroll library',
        ],
    },
    {
        week: 4,
        phase: 'PORTFOLIO BUILD',
        phaseColor: '#c4b5fd',
        title: 'Project #2 — Interactive Dashboard / Kanban',
        goal: 'Build UI phức tạp — dạng app-like interface mà startups cần',
        tasks: [
            { type: 'build', text: 'Build Linear-inspired Task Board (Kanban): drag-and-drop cards giữa columns (@dnd-kit)' },
            { type: 'build', text: 'Keyboard navigation (↑↓ to navigate, Enter to open), ⌘K command palette' },
            { type: 'build', text: 'Inline editing, filter/sort với smooth transitions, skeleton loading' },
            { type: 'build', text: 'Data visualization: Recharts — line, bar, area charts với animated transitions' },
            { type: 'build', text: 'State: Zustand cho global state, virtualization với @tanstack/virtual cho large lists' },
            { type: 'build', text: 'Responsive + touch support, local storage persistence, optimistic UI updates' },
            { type: 'build', text: 'Viết README chi tiết giải thích technical decisions' },
            { type: 'learn', text: 'Keyboard navigation & accessibility (WAI-ARIA patterns)' },
            { type: 'learn', text: 'TanStack Table, react-virtual cho large datasets' },
            { type: 'study', text: 'Nghiên cứu: Linear app UI, Vercel dashboard, Stripe dashboard — note mọi detail' },
        ],
        deliverable: 'Kanban board + dashboard deployed — Portfolio piece #2 + video demo trên Twitter/X',
        resources: ['WAI-ARIA Authoring Practices', '@dnd-kit docs', '@tanstack/virtual docs', 'TanStack Table docs', 'Zustand docs'],
    },
    {
        week: 5,
        phase: 'PORTFOLIO BUILD',
        phaseColor: '#c4b5fd',
        title: 'Project #3 — RideShare Booking Flow (Mobile-first)',
        goal: 'Design + prototype flow đặt xe cho app đi nhờ cùng route — showcase UX/UI + engineering',
        tasks: [
            { type: 'build', text: 'Design trong Figma: full flow — search route, match riders, confirm booking, trip tracking, rating' },
            { type: 'build', text: 'Build mobile-first responsive prototype với Next.js + Framer Motion' },
            { type: 'build', text: 'Map integration: hiển thị route matching, pickup/dropoff points (Mapbox GL hoặc Google Maps)' },
            { type: 'build', text: 'Animated transitions giữa các step: swipe gestures, bottom sheet, progress indicator' },
            { type: 'build', text: 'Real-time simulation: mock data cho rider matching, ETA calculation, trip progress' },
            { type: 'build', text: 'Micro-interactions: pull-to-refresh, haptic-style feedback, skeleton loading, empty states' },
            { type: 'build', text: 'Dark mode + accessibility: high contrast, large touch targets, screen reader support' },
            { type: 'learn', text: 'Mobile-first patterns: bottom sheets, gesture handling, safe areas, touch vs click' },
            { type: 'learn', text: 'Map libraries: Mapbox GL JS, react-map-gl — routing, markers, animations' },
            { type: 'study', text: 'Nghiên cứu UX: Grab, BlaBlaCar, Uber — flow comparison, friction points' },
        ],
        deliverable: 'RideShare booking flow prototype deployed + Figma file + case study — Portfolio piece #3',
        resources: ['Mapbox GL JS docs', 'react-map-gl docs', 'Grab/BlaBlaCar/Uber — UX teardown', 'Mobile UI patterns (mobbin.com)'],
    },
    {
        week: 6,
        phase: 'PORTFOLIO BUILD',
        phaseColor: '#c4b5fd',
        title: 'Project #4 — Creative 3D / WebGL Experiment',
        goal: 'Wow factor project — creative coding + design sensibility, nâng Three.js lên level tiếp theo',
        tasks: [
            { type: 'build', text: 'Interactive 3D Product Showcase — kiểu trang product Apple' },
            { type: 'build', text: '→ 3D model viewer với orbit controls, scroll-driven animation (model xoay/zoom theo scroll)' },
            { type: 'build', text: '→ Material/color customizer, smooth transitions giữa product views' },
            { type: 'build', text: '→ Performance optimized: lazy load, LOD, mobile fallback' },
            { type: 'build', text: 'Post-processing: bloom, chromatic aberration, depth of field' },
            { type: 'build', text: 'Deploy + record demo video cho portfolio' },
            { type: 'learn', text: 'React Three Fiber (R3F): declarative Three.js trong React' },
            { type: 'learn', text: 'Drei helpers: Environment, ContactShadows, Float, Text3D' },
            { type: 'learn', text: 'Shaders cơ bản: GLSL vertex/fragment shaders, uniforms, noise functions' },
            { type: 'study', text: 'Shadertoy — inspiration, Three.js Journey — relevant sections, Codrops demos' },
        ],
        deliverable: "3D product page deployed — Portfolio piece #4 — có thể pitch 'tôi build được interactive 3D experiences'",
        resources: ['React Three Fiber docs', 'Drei docs', 'Three.js Journey', 'Shadertoy', 'The Book of Shaders'],
    },
    {
        week: 7,
        phase: 'ENGINEERING DEPTH',
        phaseColor: '#fbbf24',
        title: 'Performance, Accessibility & Testing',
        goal: 'Nâng engineering quality — điều tách biệt designer vs design engineer',
        tasks: [
            { type: 'build', text: 'Audit tất cả projects: Lighthouse CI, axe-core — target 95+ performance, 100 accessibility' },
            { type: 'build', text: 'Implement: semantic HTML, ARIA labels, focus management, skip navigation cho mọi project' },
            { type: 'build', text: 'Optimize: next/image, next/font, dynamic imports, bundle analysis, tree shaking' },
            { type: 'build', text: 'Add unit tests cho design system: Vitest + Testing Library, cover mọi variant' },
            { type: 'build', text: 'Visual regression tests: Playwright component tests hoặc Chromatic' },
            { type: 'build', text: 'Setup GitHub Actions CI: lint → type-check → test → build → deploy preview trên mỗi PR' },
            { type: 'build', text: 'Add meta tags, OG images (@vercel/og), structured data, sitemap cho portfolio' },
            { type: 'learn', text: 'Core Web Vitals deep dive: LCP, FID, CLS — cách đo và optimize' },
            { type: 'learn', text: 'WCAG 2.1 AA: color contrast, keyboard nav, screen reader testing' },
            { type: 'learn', text: 'Vitest + Testing Library + Playwright — component & E2E testing' },
        ],
        deliverable: 'Tất cả projects: Lighthouse 95+, accessible, CI/CD green, test coverage > 70% cho design system',
        resources: ['web.dev/learn — Performance & Accessibility', 'axe-core browser extension', 'Vitest docs', 'Testing Library docs', 'GitHub Actions quickstart'],
    },
    {
        week: 8,
        phase: 'ENGINEERING DEPTH',
        phaseColor: '#fbbf24',
        title: 'Open Source Contribution + Advanced Patterns',
        goal: 'Có contribution vào OSS nổi tiếng + polish tất cả projects',
        tasks: [
            { type: 'build', text: 'Chọn 1-2 OSS projects: Radix UI, Shadcn/ui, Motion, Vercel packages (ai, next.js, swr)' },
            { type: 'build', text: "Thứ 2-3: Đọc issues labeled 'good first issue', 'help wanted' — chọn 2-3 issues" },
            { type: 'build', text: 'Thứ 4-5: Fork, branch, implement fix/feature' },
            { type: 'build', text: 'Thứ 6-7: Clean up code, write tests, submit PR với description chi tiết' },
            { type: 'build', text: 'Engage trong discussions — trả lời issues, review PRs của người khác' },
            { type: 'build', text: 'Revisit all portfolio projects: thêm responsive design, improve a11y, performance audit' },
            { type: 'learn', text: 'Git workflow: rebase, cherry-pick, squash, conventional commits' },
            { type: 'learn', text: 'How to read và navigate large codebases, writing good PR descriptions' },
            { type: 'learn', text: 'Monorepo basics: Turborepo setup' },
            { type: 'study', text: 'Code review etiquette — đọc 10 PRs trên shadcn/ui, cal.com' },
        ],
        deliverable: 'Ít nhất 1 PR được merge (hoặc đang review) + GitHub profile có activity trong repos nổi tiếng',
        resources: ['Good First Issues trên GitHub', 'How to write good PR descriptions', 'Turborepo docs'],
    },
    {
        week: 9,
        phase: 'PORTFOLIO & BRAND',
        phaseColor: '#f472b6',
        title: 'Personal Portfolio Site',
        goal: 'Portfolio site ngang level emilkowal.ski, rauno.me, leerob.io',
        tasks: [
            { type: 'build', text: 'Build portfolio site với Next.js: Home (hero ấn tượng, animation signature, brief intro)' },
            { type: 'build', text: 'Projects page: grid/list portfolio pieces với hover previews' },
            { type: 'build', text: 'Blog: MDX-powered, tái sử dụng content đã viết' },
            { type: 'build', text: 'About: background story, skills, tools — highlight UX/Design background' },
            { type: 'build', text: 'Craft page: showcase micro-interactions, experiments nhỏ' },
            { type: 'build', text: 'Polish: dark mode mặc định, custom cursor, page transitions, scroll progress, immaculate typography' },
            { type: 'build', text: 'Deploy trên Vercel + setup custom domain' },
            { type: 'learn', text: 'SEO basics cho portfolio: meta tags, OG images, structured data, sitemap' },
            { type: 'study', text: 'Nghiên cứu: Rauno Freiberg, Emil Kowalski, Lee Robinson, Paco Coursey — portfolio patterns' },
            { type: 'study', text: 'Content strategy: cách viết case study thuyết phục' },
        ],
        deliverable: 'Portfolio site live tại sangdesign.engineer (hoặc tương tự) + trang nền cho case studies',
        resources: ['Rauno.me, emilkowal.ski, leerob.io', 'MDX docs', 'Vercel deployment docs'],
    },
    {
        week: 10,
        phase: 'PORTFOLIO & BRAND',
        phaseColor: '#f472b6',
        title: 'Case Studies + Content Marketing',
        goal: '2 case studies chi tiết + visibility trong community Design Engineering',
        tasks: [
            { type: 'build', text: 'Case Study 1: Theme Studio — Problem → Process → Design decisions → Technical deep-dive → Result + interactive demos' },
            { type: 'build', text: 'Case Study 2: RideShare Booking Flow — UX research → Design process → Animation decisions → Before/after, performance' },
            { type: 'build', text: 'Thêm vào portfolio: rich media (videos, interactive embeds, code snippets), OG images, reading time' },
            { type: 'build', text: "Viết 2 blog posts: 1 tutorial ('How to Build X'), 1 opinion ('What I Learned Transitioning from Design to Code')" },
            { type: 'build', text: "Build 2-3 'craft' pieces: custom animated toggle, fancy hover effect, scroll-driven animation demo" },
            { type: 'build', text: 'Twitter/X strategy (30 min/ngày): share tidbits, code snippets, design breakdowns' },
            { type: 'build', text: 'Post từng craft piece lên Twitter với code explanation' },
            { type: 'build', text: "Social presence: update LinkedIn headline → 'Design Engineer', thêm projects, update Twitter/X bio" },
            { type: 'learn', text: 'Content strategy: engage với @emilkowalski_, @raborney, @leaborney' },
            { type: 'study', text: 'Continue OSS contributions — aim thêm 1-2 PRs' },
        ],
        deliverable: '2 case studies live + 3+ blog posts total + active Twitter presence + social profiles updated',
        resources: ["Linear's design blog", "Vercel's blog cho content style", 'OBS Studio cho screen recording'],
    },
    {
        week: 11,
        phase: 'JOB HUNT',
        phaseColor: '#fb923c',
        title: 'Job Applications + Take-home Prep',
        goal: 'Bắt đầu apply có chiến lược — 8-10 applications + networking',
        tasks: [
            { type: 'build', text: "Update resume/CV: 'Design Engineer' framing, link projects + metrics" },
            {
                type: 'build',
                text: 'Danh sách target: Tier 1 (Linear, Vercel, Lovable, Raycast, Resend), Tier 2 (Figma, Framer, Supabase, Clerk, Neon), Tier 3 (startups trên Wellfound, Remote OK, YC)',
            },
            { type: 'build', text: 'Cho mỗi company: đọc blog engineering, hiểu tech stack, dùng thử product, identify hiring manager' },
            { type: 'build', text: 'Apply 8-10 positions: custom cover letter cho mỗi company, link portfolio + GitHub + blog' },
            { type: 'build', text: 'Cold outreach (LinkedIn/Twitter): message 5-10 Design Engineers tại target companies' },
            { type: 'build', text: 'Chuẩn bị take-home challenge kit: boilerplate Next.js + design system + deploy script' },
            { type: 'build', text: "Practice 3 take-home challenges: 'Build a settings page', 'Animated pricing section', 'Notification system' — giới hạn 4h mỗi cái" },
            { type: 'learn', text: 'Networking strategy: xin advice không xin việc → builds relationship' },
            { type: 'study', text: 'Nếu có referral connection → reach out trước khi apply' },
        ],
        deliverable: '8-10 applications sent + 5-10 networking messages + 3 practice take-home challenges',
        resources: ['Linear, Vercel, Raycast careers pages', 'Wellfound cho startup jobs', "Twitter search: 'design engineer hiring'"],
    },
    {
        week: 12,
        phase: 'JOB HUNT',
        phaseColor: '#fb923c',
        title: 'Interview Prep + Iterate',
        goal: 'Sẵn sàng interview — technical + behavioral + system design',
        tasks: [
            { type: 'build', text: 'Practice: rebuild 1 component từ Linear hoặc Vercel trong 2 giờ (timed)' },
            { type: 'build', text: 'Apply thêm 5-8 positions, follow up trên applications tuần trước' },
            { type: 'build', text: 'Respond to any interview invitations, fix feedback nào nhận được' },
            { type: 'build', text: 'Continue posting on Twitter/blog, thêm projects mới nếu có idea' },
            { type: 'learn', text: 'Technical prep: React reconciliation, fiber, hooks deep-dive, concurrent features' },
            { type: 'learn', text: 'CSS: specificity, stacking context, contain, content-visibility' },
            { type: 'learn', text: "System design: 'Design a component library API', 'Real-time collaborative editor UI', 'Animation system cho Linear'" },
            { type: 'learn', text: 'Accessibility: ARIA roles, focus management, screen reader behavior' },
            { type: 'learn', text: 'Performance: critical rendering path, lazy loading, code splitting, requestAnimationFrame, compositor layer' },
            { type: 'study', text: "Behavioral: 'Khi nào bạn disagree với designer?', 'Khi nào polished enough?', 'Cách bridge design và engineering?'" },
        ],
        deliverable: 'Ready for interviews — 15-20 total applications — hopefully 2-3 interview invitations',
        resources: ['Frontend interview handbook', 'System design for frontend engineers', 'Glassdoor interview questions — Design Engineer'],
    },
];
