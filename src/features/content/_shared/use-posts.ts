import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  createPost,
  deletePosts,
  downloadPostExcel,
  getLegalOptions,
  getPost,
  getPosts,
  publishPosts,
  updatePost,
  updatePostStatus,
} from '@/api/contents/post-api';
import type { LegalOptions, Post, PostDetail, PostSearch, YesNo } from '@/api/contents/post-api';
import type { PageResponse } from '@/api/common/api-utils';
import type { BoardConfig } from './board-config';

// Data hooks of the generic content board (PostBoard / PostModal) — the screens never call the API themselves.

/** A menu (config.id) is the cache scope; several menus can share one API board. */
type BoardRef = Pick<BoardConfig, 'id' | 'board'>;

const POST_KEYS = {
  all: (boardId: string) => ['contents', 'posts', boardId] as const,
  list: (boardId: string, search: PostSearch, page: number, size: number) =>
    ['contents', 'posts', boardId, 'list', search, page, size] as const,
  detail: (boardId: string, pstNo: string | null) => ['contents', 'posts', boardId, 'detail', pstNo] as const,
  legalOptions: ['contents', 'legal-options'] as const,
};

/** Dropdown options of the legal-documents board; skipped for the other boards. */
export function useLegalOptions(enabled: boolean) {
  return useApiQuery<LegalOptions>(POST_KEYS.legalOptions, getLegalOptions, {
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Paged post list of one board. */
export function usePosts(config: BoardRef, search: PostSearch, page: number, size: number) {
  return useApiQuery<PageResponse<Post>>(
    POST_KEYS.list(config.id, search, page, size),
    () => getPosts(config.board, search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One post; skipped while `pstNo` is null (register mode). */
export function usePost(config: BoardRef, pstNo: string | null) {
  return useApiQuery<PostDetail>(POST_KEYS.detail(config.id, pstNo), () => getPost(config.board, pstNo as string), {
    enabled: pstNo !== null,
    gcTime: 0,
  });
}

export interface PublishPostsVariables {
  pstNos: string[];
  published: YesNo;
}

/** Bulk post / stop posting. */
export function usePublishPosts(config: BoardRef) {
  return useApiAction(
    ({ pstNos, published }: PublishPostsVariables) => publishPosts(config.board, pstNos, published),
    { invalidate: [POST_KEYS.all(config.id)] },
  );
}

export function useDeletePosts(config: BoardRef) {
  return useApiAction((pstNos: string[]) => deletePosts(config.board, pstNos), {
    invalidate: [POST_KEYS.all(config.id)],
  });
}

export function useDownloadPostExcel(config: BoardRef) {
  return useApiTask((search: PostSearch) => downloadPostExcel(config.board, search));
}

export interface SavePostVariables {
  /** null = register. */
  pstNo: string | null;
  /** Create / update body; omitted when the content is locked (only the status changes). */
  body?: Record<string, unknown>;
  /** Boards with a status endpoint: category / posting / top display applied after the update. */
  status?: { category: string; published: YesNo; pinned?: YesNo; pinOrder?: number };
  /** Boards without a status endpoint: posting flag applied through the bulk endpoint. */
  published?: YesNo;
}

/** Registers / edits a post, then applies its status. */
export function useSavePost(config: BoardRef) {
  return useApiTask(
    async ({ pstNo, body, status, published }: SavePostVariables) => {
      if (pstNo === null) {
        await createPost(config.board, body ?? {});
        return;
      }
      if (body) await updatePost(config.board, pstNo, body);
      if (status) await updatePostStatus(config.board, pstNo, status);
      else if (published) await publishPosts(config.board, [pstNo], published);
    },
    { invalidate: [POST_KEYS.all(config.id)] },
  );
}
