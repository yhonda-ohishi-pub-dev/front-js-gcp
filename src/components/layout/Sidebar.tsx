import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Organizations", href: "/organizations" },
  { name: "Users", href: "/users" },
  { name: "Cars", href: "/cars" },
  { name: "Inspections", href: "/inspections" },
  { name: "Files", href: "/files" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
