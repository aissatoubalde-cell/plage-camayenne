import { whatsappLink } from "../config";

export default function WhatsAppButton() {
  return (
    <a href={whatsappLink("Bonjour Camayenne Plage, je souhaite des informations pour un événement.")} target="_blank" rel="noopener noreferrer" aria-label="Écrire sur WhatsApp"
      className="fixed right-[18px] bottom-[18px] z-40 inline-flex items-center gap-2.5 rounded-full bg-whatsapp p-3.5 text-sm font-bold text-[#062B16] no-underline shadow-[0_10px_28px_rgba(0,0,0,.4)] transition-transform hover:-translate-y-0.5 md:py-3 md:pr-[18px] md:pl-3.5">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className="h-6 w-6 shrink-0"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 1.67c4.55 0 8.24 3.7 8.24 8.24s-3.69 8.24-8.24 8.24c-1.5 0-2.97-.41-4.25-1.18l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.3-8.24m-3.5 4.3c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.6c.13.17 1.76 2.8 4.34 3.82 2.14.84 2.58.68 3.04.63.47-.04 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.21-.06-.1-.23-.17-.48-.29-.25-.13-1.5-.74-1.73-.82-.23-.08-.4-.13-.57.12-.17.25-.65.82-.8.99-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.02-1.25-.75-.66-1.25-1.49-1.4-1.74-.15-.25-.02-.38.11-.51.11-.11.25-.29.38-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43h-.49" /></svg>
      <span className="sr-only md:not-sr-only">WhatsApp</span>
    </a>
  );
}
