import { Music } from "lucide-react";

export default function HeaderHomePage({ title }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <Music className="w-8 h-8 text-pink-400" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <p className="text-gray-300">Manage all customer music requests</p>
    </div>
  );
}
