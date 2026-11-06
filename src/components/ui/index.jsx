import { Link } from "react-router-dom";

/* Petits composants partagés : conteneur, titres, boutons, images, champs. Toutes les classes sont Tailwind. */

export function Wrap({ className = "", children }) {
  return <div className={`mx-auto max-w-[1180px] px-5 ${className}`}>{children}</div>;
}

export function Eyebrow({ className = "", children }) {
  return <p className={`text-[12.5px] font-semibold tracking-[0.18em] uppercase text-gold ${className}`}>{children}</p>;
}

export function H2({ as: Tag = "h2", className = "", children }) {
  return <Tag className={`text-[clamp(34px,5vw,58px)] leading-[1.02] font-extrabold tracking-[-0.025em] ${className}`}>{children}</Tag>;
}

export const Hl = ({ children }) => <span className="text-gold">{children}</span>;

export function SectionHead({ eyebrow, title, lede, as, className = "" }) {
  return (
    <div className={`mb-[clamp(36px,5vw,60px)] grid gap-[18px] ${className}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H2 as={as}>{title}</H2>
      {lede ? <p className="max-w-[58ch] text-[clamp(17px,1.6vw,19px)] text-sand-soft">{lede}</p> : null}
    </div>
  );
}

const btnBase =
  "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[2px] border px-6 py-[18px] text-[15px] leading-none font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-55";
const btnVariants = {
  gold: "border-transparent bg-gold text-night hover:bg-gold-deep",
  line: "border-sand/40 bg-transparent text-sand hover:border-sand",
};

export function Button({ variant = "gold", to, href, className = "", ...props }) {
  const cls = `${btnBase} ${btnVariants[variant]} ${className}`;
  if (to) return <Link to={to} className={cls} {...props} />;
  if (href) return <a href={href} className={cls} {...props} />;
  return <button type="button" className={cls} {...props} />;
}

/** Photo WebP avec repli JPG, depuis public/img/photos. */
export function Picture({ name, alt = "", className = "contents", imgClass = "", loading = "lazy", style, width = 414, height = 414, fetchPriority }) {
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={`/img/photos/${name}.webp`} />
      <img src={`/img/photos/${name}.jpg`} alt={alt} width={width} height={height} loading={loading} className={imgClass} style={style} fetchPriority={fetchPriority} />
    </picture>
  );
}

/** Cadre photo avec zoom au survol du parent `group`. */
export function Photo({ name, alt, className = "", position }) {
  return (
    <div className={`overflow-hidden bg-card ${className}`}>
      <Picture name={name} alt={alt} imgClass="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.06]" style={position ? { objectPosition: position } : undefined} />
    </div>
  );
}

export const h3Cls = "text-[clamp(20px,2vw,24px)] leading-[1.15] font-bold tracking-[-0.01em]";
export const inputCls =
  "w-full rounded-[2px] border border-line bg-night px-[13px] py-3 text-base leading-snug font-medium text-sand placeholder:text-[#6F8783] focus:border-gold focus:outline-none";
export const labelCls = "text-xs font-semibold tracking-[0.14em] uppercase text-sand-soft";

export function Field({ id, label, hint, children }) {
  return (
    <div className="grid min-w-0 gap-[7px]">
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
      {hint ? <span className="text-[13.5px] text-sand-soft">{hint}</span> : null}
    </div>
  );
}

export function Status({ kind = "", className = "", children }) {
  const tone = kind === "ok" ? "border-palm text-palm" : kind === "err" ? "border-danger text-danger" : "border-line text-sand-soft";
  return <p role={kind === "err" ? "alert" : "status"} className={`border px-3.5 py-3 text-sm ${tone} ${className}`}>{children}</p>;
}

export function Dots({ items }) {
  return (
    <ul className="grid gap-2">
      {items.map((x) => (
        <li key={x} className="relative pl-5 text-sand-soft before:absolute before:top-[0.62em] before:left-0.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold before:content-['']">{x}</li>
      ))}
    </ul>
  );
}

export const Tag = ({ children }) => (
  <span className="inline-block border border-line px-2.5 py-1.5 text-xs font-semibold tracking-[0.06em] uppercase text-sand-soft">{children}</span>
);

export const Callout = ({ tone = "", className = "", children }) => {
  const border = tone === "ok" ? "border-palm" : tone === "err" ? "border-danger" : "border-line";
  return <div className={`grid gap-3.5 border bg-card p-[clamp(22px,3vw,34px)] ${border} ${className}`}>{children}</div>;
};
