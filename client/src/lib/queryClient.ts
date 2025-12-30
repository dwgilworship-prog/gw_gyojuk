import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// 캐시 무효화 함수
async function invalidateApiCache(url: string) {
  if ("caches" in window) {
    try {
      const cache = await caches.open("api-cache");
      // URL 패턴에 맞는 모든 캐시 삭제
      const keys = await cache.keys();
      const baseUrl = url.split("?")[0]; // 쿼리 파라미터 제거
      const urlParts = baseUrl.split("/");
      const resource = urlParts.slice(0, 3).join("/"); // /api/resource 형태

      for (const request of keys) {
        if (request.url.includes(resource)) {
          await cache.delete(request);
        }
      }
    } catch (e) {
      console.warn("캐시 무효화 실패:", e);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  // 데이터 변경 요청 성공 시 캐시 무효화
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    await invalidateApiCache(url);
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // 탭 전환 시 자동 refetch
      staleTime: 5 * 60 * 1000,    // 5분 후 데이터가 "stale" 상태로 전환
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
