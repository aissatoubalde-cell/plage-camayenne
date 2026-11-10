import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import WhatsAppButton from "./components/WhatsAppButton";
import { site } from "./config";
import { useScrollToHash } from "./hooks";
import Confirmation from "./pages/Confirmation";
import Devis from "./pages/Devis";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Paiement from "./pages/Paiement";

// Chargée à part : le code de l’administration n’alourdit pas le site public.
const Admin = lazy(() => import("./pages/Admin"));

function ScrollManager() { useScrollToHash(); return null; }

/* Statistiques Plausible (sans cookies, donc sans bandeau) : actives seulement si VITE_PLAUSIBLE_DOMAIN est renseigné. */
function Analytics() {
  useEffect(() => {
    if (!site.plausibleDomain || document.querySelector("script[data-domain]")) return;
    const s = document.createElement("script");
    s.defer = true; s.dataset.domain = site.plausibleDomain; s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }, []);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  // L'administration a sa propre mise en page, sans l'en-tête ni le pied de page du site.
  if (pathname.replace(/\/$/, "") === "/admin") {
    return (
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={null}><Admin /></Suspense>
      </LazyMotion>
    );
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/paiement" element={<Paiement />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <WhatsAppButton />
        <ScrollManager />
        <Analytics />
      </MotionConfig>
    </LazyMotion>
  );
}
