import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 left-0 right-0 z-[1001]">
      {/* Top info bar (like LIVE example) */}
      <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm font-medium">
            Rockfall Prediction
          </span>
        </div>
        <nav className=" backdrop-blur-sm border-b border-gray-800 px-6 py-2">
          <ul className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <li>
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/map" className="hover:text-white transition-colors">
                Map
              </Link>
            </li>
            <li>
              <Link
                href="/miner"
                className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white px-4 py-2 rounded ml-2"
              >
                Miner
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white px-4 py-2 rounded ml-2"
              >
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Navigation bar */}
    </header>
  );
}
