import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Titre de l’onglet par page. */
export function useTitle(title) {
  useEffect(() => { document.title = title; }, [title]);
}

/** À chaque changement d’adresse : défilement vers l’ancre (#espaces…) ou retour en haut. */
export function useScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}
