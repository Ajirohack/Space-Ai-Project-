"use client"

export default function Sidebar() {
    return (
        <div className="fixed right-0 top-0 h-full w-64 bg-gray-100 shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Sidebar</h2>
            <nav>
                <ul className="space-y-2">
                    <li className="hover:bg-gray-200 p-2 rounded">Menu Item 1</li>
                    <li className="hover:bg-gray-200 p-2 rounded">Menu Item 2</li>
                </ul>
            </nav>
        </div>
    );
}