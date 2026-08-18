export const galleryCategories = ["upswing", "galaxy", "accessories"] as const;
export type GalleryCategory = typeof galleryCategories[number];

export type GalleryImage = {
  id: string;
  name: string;
  width?: number;
  height?: number;
  modifiedAt?: string;
  category?: GalleryCategory;
};
