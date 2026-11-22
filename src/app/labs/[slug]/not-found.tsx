import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function LabNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="w-full max-w-md flex flex-col items-center">
        <span className="font-serif text-7xl sm:text-8xl font-normal text-text tracking-tight mb-2">
          404
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-normal text-text mb-3">
          Lab not found
        </h1>
        <p className="text-sm text-muted max-w-sm mb-8 leading-relaxed font-sans">
          The requested AI research lab does not exist in the OneAtlas directory.
        </p>
        <Link href="/labs">
          <Button variant="primary-cream" size="md" className="gap-2 font-semibold shadow-xs">
            <ArrowLeft className="w-4 h-4 text-cream-text" />
            <span>Browse all labs</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
