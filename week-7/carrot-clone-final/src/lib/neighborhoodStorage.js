const KEY = "carrot-clone-neighborhood";

export function getSavedNeighborhood() {
  try {
    return window.localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setSavedNeighborhood(neighborhood) {
  try {
    const value = String(neighborhood || "").trim();
    if (value) window.localStorage.setItem(KEY, value);
  } catch {
    // ignore storage failures
  }
}

export function clearSavedNeighborhood() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore storage failures
  }
}
