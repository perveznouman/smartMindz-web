/**
 * Built-in fallback content.
 *
 * The site renders fully from this data when Supabase is NOT configured (e.g.
 * local dev before keys are added). Once Supabase is connected, the data-layer
 * helpers in lib/data prefer the database and use these values only as defaults
 * for any missing `site_content` keys.
 *
 * Everything here is also the seed data mirrored in content/seed.sql.
 */
import type {
  Category,
  EventItem,
  GalleryPhoto,
  SiteContent,
  TeamMember,
} from "@/lib/types";

export const fallbackCategories: Category[] = [
  { id: "cat-1", name: "Class 1", sortOrder: 1 },
  { id: "cat-2", name: "Class 2", sortOrder: 2 },
  { id: "cat-3", name: "Class 3", sortOrder: 3 },
  { id: "cat-4", name: "Class 4", sortOrder: 4 },
  { id: "cat-5", name: "Class 5", sortOrder: 5 },
  { id: "cat-6", name: "Class 6", sortOrder: 6 },
  { id: "cat-7", name: "Class 7", sortOrder: 7 },
  { id: "cat-college", name: "College Student", sortOrder: 8 },
  { id: "cat-professional", name: "Working Professional", sortOrder: 9 },
  { id: "cat-homemaker", name: "Homemaker", sortOrder: 10 },
];

export const fallbackEvents: EventItem[] = [
  {
    id: "evt-republic-fest-2026",
    slug: "republic-fest-2026",
    title: "Republic Fest 2026",
    description:
      "Our flagship celebration of talent — 1000+ vibrant participants across speeches, debates, essays, posters, drawing and calligraphy. Compete, learn and shine with guaranteed certificates, trophies and grand felicitations.",
    eventDate: "2026-01-26",
    location: "Vaniyambadi, Tamil Nadu",
    status: "upcoming",
    coverUrl: "/gallery/sample-1.jpg",
    // Open to everyone for the flagship fest.
    categoryIds: fallbackCategories.map((c) => c.id),
  },
  {
    id: "evt-speech-junior-2026",
    slug: "junior-speech-championship-2026",
    title: "Junior Speech Championship",
    description:
      "A multilingual speech competition for our youngest stars in Tamil, Hindi, Urdu and English.",
    eventDate: "2026-02-15",
    location: "Online",
    status: "upcoming",
    coverUrl: "/gallery/sample-2.jpg",
    categoryIds: ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"],
  },
  {
    id: "evt-calligraphy-2026",
    slug: "calligraphy-masters-2026",
    title: "Calligraphy Masters",
    description:
      "Showcase the art of beautiful writing across scripts and languages.",
    eventDate: "2026-03-10",
    location: "Vaniyambadi, Tamil Nadu",
    status: "upcoming",
    coverUrl: "/gallery/sample-3.jpg",
    categoryIds: ["cat-6", "cat-7", "cat-college", "cat-professional", "cat-homemaker"],
  },
  {
    id: "evt-republic-fest-2025",
    slug: "republic-fest-2025",
    title: "Republic Fest 2025",
    description:
      "Where it all came alive last year — packed halls, fierce competition and unforgettable performances across every category.",
    eventDate: "2025-01-26",
    location: "Vaniyambadi, Tamil Nadu",
    status: "past",
    coverUrl: "/gallery/sample-4.jpg",
    categoryIds: fallbackCategories.map((c) => c.id),
  },
];

export const fallbackTeam: TeamMember[] = [
  { id: "tm-1", name: "Abdul Aleem", role: "Software Engineer", photoUrl: null, sortOrder: 1 },
  { id: "tm-2", name: "Aaqib Ameen", role: "Software Engineer", photoUrl: null, sortOrder: 2 },
  { id: "tm-3", name: "Khanita Mariam", role: "Parenting Coach", photoUrl: null, sortOrder: 3 },
  { id: "tm-4", name: "Nouman Pervez", role: "Software Engineer", photoUrl: null, sortOrder: 4 },
  { id: "tm-5", name: "Sajid Basha", role: "Software Engineer", photoUrl: null, sortOrder: 5 },
];

/** Offline sample gallery (the full set lives in Supabase via the upload script). */
export const fallbackGallery: GalleryPhoto[] = Array.from({ length: 16 }, (_, i) => ({
  id: `ph-${i + 1}`,
  url: `/gallery/sample-${i + 1}.jpg`,
  thumbUrl: `/gallery/sample-${i + 1}.jpg`,
  caption: null,
  eventId: i % 2 === 0 ? "evt-republic-fest-2025" : null,
  sortOrder: i + 1,
}));

export const fallbackSiteContent: SiteContent = {
  orgName: "SmartMindz",
  tagline: "Where Every Talent Shines",
  heroTitle: "Where Every Talent Shines",
  heroSubtitle:
    "SmartMindz celebrates hidden gems from every walk of life — school students, college students, working professionals, and homemakers alike.\n\nWe believe talent has no age limit and no single background. That's why we create opportunities for everyone to learn, perform, and shine.",
  mission:
    "SmartMindz is the ultimate talent celebration platform that truly values and rewards hidden gems across all walks of life — intelligence, innovation and creativity, recognised and rewarded.",
  aboutStory: [
    "SmartMindz celebrates hidden gems from every walk of life — school students, college students, working professionals, and homemakers alike.\n\nWe believe talent has no age limit and no single background. That's why we create opportunities for everyone to learn, perform, and shine.\n\nThrough exciting online and offline events, SmartMindz nurtures skills in English, Tamil, Urdu, Hindi, helping participants build confidence, creativity, and self-expression in the language they love.",
    "Whether it's a child taking their first step onto a stage, a student exploring their potential, a professional rediscovering a passion, or a homemaker showcasing a hidden talent — SmartMindz is a platform where every voice matters and every talent gets its moment.",
    "Our mission is to identify, encourage, and celebrate talent by creating inclusive opportunities that inspire confidence, creativity, and lifelong learning. Through engaging competitions, skill-building opportunities across multiple languages, and a welcoming platform for all age groups, we help every individual discover and share their unique gifts.",
  ],
  aboutHighlights: [
    { title: "Engaging competitions", body: "Online and offline events designed to challenge, inspire, and celebrate talent." },
    { title: "Skill-building opportunities", body: "Master skills in Tamil, Hindi, Urdu, and English with expert guidance and real-world practice." },
    { title: "Inclusive platform", body: "A welcoming space for all age groups and backgrounds — no talent left behind." },
    { title: "Learn, express, grow", body: "Develop confidence, creativity, and self-expression while connecting with a vibrant community." },
  ],
  logoUrl: "/logo.jpeg",
  location: "Vaniyambadi, Tamil Nadu, India",
  languages: ["Tamil", "Hindi", "Urdu", "English"],
  rewards: ["Certificates", "Trophies", "Grand Felicitations"],
  stats: [
    { value: "1000+", label: "Participants at Republic Fest" },
    { value: "4", label: "Languages" },
    { value: "6+", label: "Event categories" },
    { value: "2x", label: "Events every year" },
  ],
  instagram: {
    label: "Instagram",
    href: "https://instagram.com/smartmindz_vnb",
    handle: "@smartmindz_vnb",
  },
  youtube: {
    label: "YouTube",
    href: "https://www.youtube.com/@smartmindz_vnb",
    handle: "@smartmindz_vnb",
  },
  whatsappContact: "+91-9600707610",
  // Replace with your real WhatsApp group invite link (chat.whatsapp.com/...).
  // Until then we fall back to a direct chat with the contact number.
  whatsappGroupLink: "https://wa.me/919600707610",
  email: null,
};
