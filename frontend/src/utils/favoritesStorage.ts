export function getFavorites(): number[] {
  try {
    return JSON.parse(localStorage.getItem("fr2_favorites") || "[]");
  } catch {
    return [];
  }
}

export function saveFavorites(favs: number[]): void {
  localStorage.setItem("fr2_favorites", JSON.stringify(favs));
}

export function toggleFavorite(appId: number): number[] {
  let favs = getFavorites();

  if (favs.includes(appId)) {
    favs = favs.filter(id => id !== appId);
  } else {
    favs.push(appId);
  }

  saveFavorites(favs);
  
  // Dispatch event for instant re-render in other components
  window.dispatchEvent(new Event("favoritesUpdated"));
  
  return favs;
}

export function isFavorite(appId: number): boolean {
  return getFavorites().includes(appId);
}
