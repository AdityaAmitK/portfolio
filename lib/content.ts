export type Project = {
  slug: string
  title: string
  year: number
  summary: string
  image?: string
  imageAlt?: string
  href?: string
  linkLabel?: string
  tags: string[]
  featured: boolean
}

export type Tool = { name: string; category: string; note: string }
export type ManagedContent = { projects: Project[]; tools: Tool[]; skills: string[] }

export const projects: Project[] = [
  {
    slug: 'algodesk',
    title: 'AlgoDesk',
    year: 2026,
    summary: 'A private trading control room for research, backtests, portfolio rails, scheduled execution, and live VPS health. It turns an EMA50 rotation strategy into an observable system instead of a collection of scripts.',
    image: '/images/projects/algodesk-demo.jpg',
    imageAlt: 'AlgoDesk trading overview with anonymised sample data',
    tags: ['Python', 'Next.js', 'PostgreSQL', 'Trading systems'],
    featured: true,
  },
  {
    slug: 'rupee-ledger',
    title: 'Rupee Ledger',
    year: 2026,
    summary: 'A private personal finance desk built around one useful question: how much is safe to use before the next salary window? It connects commitments, accounts, recurring expenses, investments, and recent activity.',
    image: '/images/projects/rupee-ledger-demo.jpg',
    imageAlt: 'Rupee Ledger dashboard with anonymised sample data',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Personal finance'],
    featured: true,
  },
  {
    slug: 'iphone-mac-keyboard',
    title: 'iPhone Mac Keyboard',
    year: 2026,
    summary: 'A local-first companion that turns an iPhone into a secure nearby keyboard and command pad for macOS. Built for the moments when the Mac is connected to a distant display and the keyboard is not.',
    image: '/images/projects/iphone-mac-keyboard.png',
    imageAlt: 'Mac Keyboard iPhone application connected to a MacBook Pro',
    href: 'https://github.com/AdityaAmitK/iphone-mac-keyboard',
    linkLabel: 'view source',
    tags: ['Swift', 'macOS', 'iOS', 'Local networking'],
    featured: true,
  },
  {
    slug: 'git-blocker',
    title: 'Git Blocker',
    year: 2025,
    summary: 'A small CLI guardrail that stops sensitive or important files from slipping into a Git commit. Rules live with the repository and the prompt explains exactly what was blocked and why.',
    image: '/images/projects/git-blocker-demo.png',
    imageAlt: 'Git Blocker preventing a secret file from being committed',
    href: 'https://www.npmjs.com/package/git-blocker',
    linkLabel: 'view on npm',
    tags: ['Node.js', 'CLI', 'Git'],
    featured: false,
  },
  {
    slug: 'strapi-service-navigation',
    title: 'Strapi Service Navigation',
    year: 2025,
    summary: 'A VS Code extension for jumping from Strapi route handlers directly to their controller or service implementation. It supports JavaScript and TypeScript Strapi projects.',
    image: '/images/projects/strapi-service-navigation-demo.gif',
    imageAlt: 'Command-click navigation from a Strapi route to its controller',
    href: 'https://github.com/AdityaAmitK/strapi-service-navigation',
    linkLabel: 'view source',
    tags: ['TypeScript', 'VS Code', 'Strapi'],
    featured: false,
  },
  {
    slug: 'next-sweep',
    title: 'Next Sweep',
    year: 2025,
    summary: 'A focused CLI that finds stale .next build folders across a workspace and lets you reclaim the space interactively.',
    image: '/images/projects/next-sweep-demo.png',
    imageAlt: 'Next Sweep finding and removing a Next.js build folder',
    href: 'https://www.npmjs.com/package/next-sweep',
    linkLabel: 'view on npm',
    tags: ['Node.js', 'CLI', 'Next.js'],
    featured: false,
  },
  {
    slug: 'secure-face-recognition',
    title: 'Secure Face Recognition Research',
    year: 2024,
    summary: 'Research into a client–server verification flow where facial encodings are encrypted before leaving the device, then decrypted and compared server-side.',
    image: '/images/projects/secure-face-recognition-research.png',
    imageAlt: 'Architecture diagram for encrypted face-recognition verification',
    href: 'https://github.com/AdityaAmitK/faceRecongition',
    linkLabel: 'view research code',
    tags: ['Python', 'Computer vision', 'Encryption'],
    featured: false,
  },
  {
    slug: 'cricket-player-cluster',
    title: 'Cricket Player Cluster',
    year: 2024,
    summary: 'An exploratory sports analytics project that groups cricket players by statistical profile to surface comparable roles and playing styles.',
    href: 'https://github.com/AdityaAmitK/CricketResearch',
    linkLabel: 'view source',
    tags: ['Python', 'Data science', 'Cricket'],
    featured: false,
  },
]

export const tools: Tool[] = [
  { name: 'Wispr Flow', category: 'Voice', note: 'My fastest way to get an unpolished thought out of my head and into editable text.' },
  { name: 'Codex', category: 'Engineering', note: 'A practical collaborator for tracing unfamiliar code, shipping changes, and keeping momentum.' },
  { name: 'Cursor', category: 'Editor', note: 'Where I spend most of my implementation time; fast navigation and AI tools without leaving the editor.' },
  { name: 'CleanShot X', category: 'Capture', note: 'The quickest way I know to explain a visual problem or make a clean product demo.' },
]

export const skills = ['TypeScript', 'React & Next.js', 'Node.js', 'Python', 'Strapi', 'PostgreSQL', 'Systems on Linux', 'Product engineering']
