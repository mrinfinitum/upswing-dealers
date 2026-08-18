export type GalleryCategory = {
  slug: string;
  label: string;
};

export const defaultGalleryCategories: GalleryCategory[] = [
  { slug: "upswing", label: "UpSwing" },
  { slug: "galaxy", label: "Galaxy" },
  { slug: "accessories", label: "Accessories" },
];

export type GalleryImage = {
  id: string;
  name: string;
  width?: number;
  height?: number;
  modifiedAt?: string;
  categories: string[];
};
