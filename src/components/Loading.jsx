import { Loader2, Bed } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="relative w-16 h-16">
        <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Bed className="w-6 h-6 text-green-800" />
        </div>
      </div>
      <span className="text-gray-600 font-medium">Memuat data...</span>
    </div>
  );
}
