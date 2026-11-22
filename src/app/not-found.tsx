import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Editorial Serif 404 */}
        <span className="font-serif text-8xl sm:text-9xl font-normal text-text tracking-tight mb-2">
          404
        </span>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-serif font-normal text-text mb-3">
          Page not found
        </h1>

        {/* Short description */}
        <p className="text-sm text-muted max-w-sm mb-8 leading-relaxed font-sans">
          The model, lab, provider, or page you are looking for does not exist in
          the OneAtlas catalog or has moved.
        </p>

        {/* Link back to Home */}
        <Link href="/">
          <Button variant="primary-cream" size="md" className="gap-2 font-semibold shadow-xs">
            <ArrowLeft className="w-4 h-4 text-cream-text" />
            <span>Return to catalog</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
