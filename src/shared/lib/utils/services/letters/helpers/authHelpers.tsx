// src/shared/utils/services/helpers/authHelpers.ts
import type { QueryClient } from "@tanstack/react-query";
import { clearTokens } from "@shared/api/response";

export function isAuthPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p === "/login" || p.startsWith("/registration") || p.startsWith("/auth")
  );
}

/**
 * Полный выход пользователя: чистим токены, кэш запросов и (условно) редиректим.
 * Редирект НЕ выполняется, если мы уже на странице логина/регистрации.
 */
export async function hardLogout(
  queryClient: QueryClient,
  redirect: boolean = true
) {
  try {
    clearTokens();
  } catch {}
  try {
    await queryClient.cancelQueries();
  } catch {}
  try {
    queryClient.clear();
  } catch {}

  if (!redirect) return;

  const onAuth = isAuthPath(window.location.pathname);
  if (!onAuth) {
    window.location.assign("/login");
  }
}
