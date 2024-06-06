import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <Link href="/" className="text-xl font-bold">
          Diary
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
