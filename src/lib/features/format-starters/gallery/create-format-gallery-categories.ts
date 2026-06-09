import {
  createFormatsGalleryHref,
  type CreateFormatsGalleryHref,
} from "$lib/app/app-links";
import {
  FORMAT_STARTER_INDUSTRY_TAGS,
  isFormatStarterIndustryTagId,
  type FormatStarterGalleryEntry,
  type FormatStarterIndustryTagId,
} from "$lib/features/format-starters/catalog";

export type CreateFormatGalleryCategoryId = FormatStarterIndustryTagId;

export type CreateFormatGalleryCategory = {
  id: CreateFormatGalleryCategoryId;
  label: string;
  infoBar: {
    label: string;
    text: string;
  };
};

const INDUSTRY_CATEGORY_INFO_BAR = {
  label: "Next step:",
  text: "Select a starter to create the email format your team receives",
};

const CREATE_FORMAT_GALLERY_INDUSTRY_CATEGORIES =
  FORMAT_STARTER_INDUSTRY_TAGS.map((tag) => ({
    id: tag.id,
    label: tag.label,
    infoBar: INDUSTRY_CATEGORY_INFO_BAR,
  })) satisfies readonly CreateFormatGalleryCategory[];

export const CREATE_FORMAT_GALLERY_CATEGORIES = [
  ...CREATE_FORMAT_GALLERY_INDUSTRY_CATEGORIES,
] satisfies readonly CreateFormatGalleryCategory[];

export function getCreateFormatGalleryCategoryById(
  categoryId: string | null | undefined,
): CreateFormatGalleryCategory | null {
  return (
    CREATE_FORMAT_GALLERY_CATEGORIES.find(
      (category) => category.id === categoryId,
    ) ?? null
  );
}

export function getCreateFormatGalleryDropdownCategories(
  workspaceIndustryId: string | null | undefined,
): readonly CreateFormatGalleryCategory[] {
  return [
    ...CREATE_FORMAT_GALLERY_INDUSTRY_CATEGORIES.filter(
      (category) => category.id === workspaceIndustryId,
    ),
    ...CREATE_FORMAT_GALLERY_INDUSTRY_CATEGORIES.filter(
      (category) => category.id !== workspaceIndustryId,
    ),
  ];
}

export function getCreateFormatGalleryCategoryFromSearchParams(
  searchParams: URLSearchParams,
  fallbackCategoryId?: string | null,
): CreateFormatGalleryCategory {
  const selectedIndustry = normalizeCreateFormatsIndustryFilter(
    searchParams.get("industry"),
  );

  if (selectedIndustry !== "all") {
    return (
      getCreateFormatGalleryCategoryById(selectedIndustry) ??
      getDefaultCreateFormatGalleryCategory(fallbackCategoryId)
    );
  }

  if (searchParams.has("industry")) {
    return getDefaultCreateFormatGalleryCategory(fallbackCategoryId);
  }

  return getDefaultCreateFormatGalleryCategory(fallbackCategoryId);
}

export function createFormatGalleryCategoryHref(
  category: CreateFormatGalleryCategory,
): CreateFormatsGalleryHref {
  return createFormatsGalleryHref({ industry: category.id });
}

export function matchesCreateFormatGalleryCategory(
  formatStarter: FormatStarterGalleryEntry,
  category: CreateFormatGalleryCategory,
) {
  return formatStarter.industryTags.includes(category.id);
}

function getDefaultCreateFormatGalleryCategory(
  fallbackCategoryId?: string | null,
): CreateFormatGalleryCategory {
  return (
    getCreateFormatGalleryCategoryById(fallbackCategoryId) ??
    CREATE_FORMAT_GALLERY_INDUSTRY_CATEGORIES[0]
  );
}

function normalizeCreateFormatsIndustryFilter(
  value: string | null | undefined,
): "all" | FormatStarterIndustryTagId {
  return value && isFormatStarterIndustryTagId(value) ? value : "all";
}
