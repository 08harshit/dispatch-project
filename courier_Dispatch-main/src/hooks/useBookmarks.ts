import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "bookmarked-loads";

const getStoredBookmarks = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
};

const saveBookmarks = (bookmarks: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Set<string>>(getStoredBookmarks);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const toggleBookmark = useCallback((loadId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(loadId)) {
        next.delete(loadId);
      } else {
        next.add(loadId);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (loadId: string) => bookmarks.has(loadId),
    [bookmarks]
  );

  const bookmarkCount = bookmarks.size;

  return { toggleBookmark, isBookmarked, bookmarkCount, bookmarkedIds: bookmarks };
};
