'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, LayoutDashboard, FileText, Image, Users, Settings, ChevronDown, ChevronRight, PlusCircle, BarChart2, Menu, Eye, X } from 'lucide-react'
interface MenuItem {
  label: string
  href?: string
  icon: LucideIcon
  children?: { label: string; href: string }[]
}
const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    label: 'Posts',
    icon: FileText,
    children: [
      { label: 'All Posts', href: '/admin/blogs' },
      { label: 'Add New', href: '/admin/blogs/new' },

    ],
  },
  {
    label: 'Media',
    icon: Image,
    children: [
      { label: 'Library', href: '/admin/media' },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(['Posts'])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => pathname === child.href)

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-white">BlogCMS</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg hover:bg-white/10 text-gray-400"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-3 py-3 border-b border-white/10">
        <Link
          href="/blog"
          target="_blank"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
        >
          <Eye size={14} />
          View Site
        </Link>
      </div>
      <nav className="px-3 py-3 space-y-0.5">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isParentActive(item)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                  {openMenus.includes(item.label) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                {openMenus.includes(item.label) && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
    </>
  )

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e1e2d] text-white z-30 transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 h-screen bg-[#1e1e2d] text-white shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            >
              <Menu size={18} className="text-gray-500" />
            </button>
            <span className="text-sm text-gray-500 hidden sm:block">Welcome back! 👋</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/blogs/new"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <PlusCircle size={13} />
              <span className="hidden sm:block">New Post</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}