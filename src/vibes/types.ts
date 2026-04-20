import type {
  Category, CategoryDataByType, CategoryType, Lang,
} from '@/types/content';

/**
 * The contract for a category component. Every vibe implements (or inherits)
 * one of these per category type. The component returns an array of
 * `<Page />`-shaped nodes so a single category can span multiple physical
 * pages (e.g. the theatre gallery chunks plays into 8-per-page spreads).
 */
export type CategoryComponent<T extends CategoryType> = (props: {
  data: CategoryDataByType[T];
  cat: Category<T>;
  lang: Lang;
}) => JSX.Element;

export type CategoryComponents = {
  [T in CategoryType]: CategoryComponent<T>;
};
