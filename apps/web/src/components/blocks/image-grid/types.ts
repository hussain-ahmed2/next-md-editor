export interface GridImage {
  id: string;
  url: string;
  alt: string;
}

export const DEFAULT_IMAGES: GridImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    alt: "Fluid abstract shapes",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop",
    alt: "Glossy 3D composition",
  },
];
