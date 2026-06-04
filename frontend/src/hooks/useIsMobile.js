import { useEffect, useState } from "react";

// matchMedia-backed hook. Returns true when the viewport is at or under
// `maxWidth` pixels. Defaults to the 768px breakpoint that the Navbar +
// page-shell CSS in index.css also use, so the JS and CSS stay in sync.
//
// Used by Navbar (to swap to a bottom tab bar) and Chat (to swap to a
// single-pane list/detail layout).
const useIsMobile = (maxWidth = 768) => {
  const query = `(max-width: ${maxWidth}px)`;
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [query]);
  return isMobile;
};

export default useIsMobile;
