import {
  PaginatedResponse,
  PaginationInput,
  PaginationMetadata,
} from '../models/workoutPlanModels';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export type PaginationRequestInput = {
  page?: number | string;
  pageSize?: number | string;
};

function parsePositiveInteger(value: number | string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Pagination values must be positive integers');
  }

  return parsed;
}

export function normalizePagination(input: PaginationRequestInput = {}): Required<PaginationInput> {
  const page = parsePositiveInteger(input.page) ?? DEFAULT_PAGE;
  const requestedPageSize = parsePositiveInteger(input.pageSize) ?? DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize: Math.min(requestedPageSize, MAX_PAGE_SIZE),
  };
}

export function paginateItems<T>(items: T[], input: PaginationInput = {}): PaginatedResponse<T> {
  const { page, pageSize } = normalizePagination(input);
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export function createPaginationMetadata(
  totalItems: number,
  input: PaginationInput = {}
): PaginationMetadata {
  const { page, pageSize } = normalizePagination(input);

  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}
