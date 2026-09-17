import LogoMark from "./LogoMark";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={32} animated />
      <span className="font-bold text-xl">Dark Romance Promo</span>
    </div>
  );
}
