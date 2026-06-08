import { AlertCircle } from "lucide-react";

export default function Error({ error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-red-600">
      <div className="relative w-16 h-16 flex items-center justify-center bg-red-100 rounded-full">
        <AlertCircle className="w-10 h-10" />
      </div>
      <span className="font-medium">{error}</span>
    </div>
  );
}
