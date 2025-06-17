import Navbar from "./navbar";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 sticky top-0 right-0 left-0 z-50">
      <div className="flex items-center">
        <span className="font-semibold">t0Chat</span>
      </div>
      <Navbar />
    </header>
  )
}