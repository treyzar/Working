import { atom, createStore } from "jotai";
import type { IUserProfile } from "@shared/interfaces/interfaces";

export const userStore = createStore();
export const userAtom = atom<IUserProfile | null>(null);
export const authStatusAtom = atom<"unknown" | "auth">("unknown");

export const setUser = (user: IUserProfile | null) => {
  userStore.set(userAtom, user);
  userStore.set(authStatusAtom, user ? "auth" : "unknown");
};

export const patchUser = (patch: Partial<IUserProfile>) => {
  const current = userStore.get(userAtom);
  if (!current) return;
  userStore.set(userAtom, { ...current, ...patch });
};

export const resetUser = () => setUser(null);
export const getUser = () => userStore.get(userAtom);
