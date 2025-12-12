# Shepherd Flow - Design Guidelines

## Design Philosophy: "Ethereal Glass"

**Core Concept**: Premium spiritual aesthetic combining glassmorphism with violet-indigo gradients, creating a sense of transcendence and modern spirituality.

## Color System

### Primary Palette
- **Violet-Indigo Gradient**: Primary brand gradient (Violet 600 → Indigo 600)
- **Accent Colors**: 
  - Success: Green 500
  - Warning: Amber 500
  - Error: Red 500
  - Info: Blue 500

### Backgrounds
- **Main Background**: Slate 950 with noise texture overlay
- **Card Backgrounds**: Semi-transparent white/slate with backdrop blur
- **Gradients**: Apply violet-indigo gradients to buttons, headers, and accent elements

## Typography

- **Font Family**: Inter (primary), Pretendard (Korean fallback)
- **Hierarchy**:
  - H1: 2.5rem/3rem, font-bold
  - H2: 2rem/2.5rem, font-semibold
  - H3: 1.5rem/2rem, font-semibold
  - Body: 1rem/1.5rem, font-normal
  - Small: 0.875rem/1.25rem

## Layout System

### Spacing Scale
- Use Tailwind units: 2, 4, 8, 12, 16, 20, 24, 32
- Container padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
- Section spacing: py-8 (mobile), py-12 (desktop)

### Breakpoints
- Mobile: < 768px (base)
- Tablet: 768px - 1024px (md)
- Desktop: > 1024px (lg)

### Navigation
- **Desktop**: Fixed sidebar (w-64), glassmorphism with backdrop-blur-xl
- **Mobile**: Bottom tab navigation (h-16), floating glass style with rounded corners and shadow-lg

## Component Design

### Cards & Containers
- Background: bg-white/10 or bg-slate-800/40
- Border: border border-white/20
- Blur: backdrop-blur-xl
- Rounded: rounded-xl or rounded-2xl
- Shadow: shadow-lg or shadow-xl

### Buttons
- **Primary**: Violet-indigo gradient background, white text, shadow-lg
- **Secondary**: Transparent with violet border, violet text
- **Ghost**: No background, violet text on hover
- **Over Images**: Add backdrop-blur-md to button backgrounds when placed on images
- Padding: px-6 py-3 (default), px-4 py-2 (small)
- Rounded: rounded-lg

### Forms & Inputs
- Background: bg-slate-800/60 with backdrop-blur
- Border: border-slate-600, focus:border-violet-500
- Rounded: rounded-lg
- Focus ring: ring-2 ring-violet-500/50
- Label: text-sm font-medium text-slate-300

### Badges & Status
- **Active/Success**: bg-green-500/20, text-green-400, border-green-500/30
- **Warning/Late**: bg-amber-500/20, text-amber-400, border-amber-500/30
- **Error/Absent**: bg-red-500/20, text-red-400, border-red-500/30
- **Info**: bg-blue-500/20, text-blue-400, border-blue-500/30
- Rounded: rounded-full, px-3 py-1

### Icons
- Use Lucide React icons throughout
- Size: 20px (default), 24px (headers), 16px (inline)
- Color: Inherit from parent or text-slate-400

## Mobile-First Patterns

### Touch Targets
- Minimum 44px height for all interactive elements
- Generous padding on mobile (p-4 minimum)

### Attendance Check Interface
- Large tap areas for status toggles
- Status color coding: Green (출석) → Yellow (지각) → Red (결석) → Blue (사유결석)
- Visual feedback on tap with scale animation

### Bottom Sheet Modals
- Use for forms and details on mobile
- Swipe-down to dismiss gesture
- Max height: 90vh with overflow scroll

## Interactions & Animations

### Micro-interactions
- **Button Hover**: Scale(1.02) + glow effect (shadow-violet-500/50)
- **Card Hover**: Translate-y(-2px) + shadow increase
- **Loading**: Skeleton shimmer animation with gradient
- **Success**: Confetti animation on attendance submission

### Page Transitions
- Slide-in from right: 300ms ease-out
- Fade-in for modals: 200ms ease-in-out
- Stagger children animations: 50ms delay between items

### Loading States
- Skeleton screens with glassmorphism style
- Pulse animation on loading elements
- Spinner with violet-indigo gradient

## Special Features

### Login Page
- Full-screen aurora gradient background animation
- Centered glassmorphism login card (max-w-md)
- Floating gradient orbs with blur

### Dashboard
- Grid layout for stat cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Charts using Recharts with violet-indigo color scheme
- Ranking lists with gradient progress bars

### Charts & Data Visualization
- Use Recharts library
- Color palette: Violet 500, Indigo 500, Blue 500
- Background: bg-slate-800/40 with backdrop-blur
- Gridlines: stroke-slate-600/30

## Images

**Hero/Feature Images**: Not applicable for this admin dashboard application. Focus on data visualization, charts, and UI components rather than decorative imagery.

**User Avatars**: Use fallback gradient circles with initials when no photo available.

## Accessibility

- Maintain WCAG AA color contrast (4.5:1 for text)
- Include focus indicators on all interactive elements (ring-2 ring-violet-500)
- Ensure keyboard navigation works for all features
- Use semantic HTML throughout (nav, main, section, article)

## Performance

- Lazy load charts and heavy components
- Use Next.js Image component for any imagery
- Minimize animation on low-end devices (prefers-reduced-motion)
- Keep glassmorphism blur to backdrop-blur-xl maximum for performance