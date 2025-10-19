'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  HeadphonesIcon,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    current: false,
  },
  {
    name: 'Clientes',
    href: '/admin/users',
    icon: Users,
    current: false,
  },
  {
    name: 'Assinaturas',
    href: '/admin/subscriptions',
    icon: ShoppingBag,
    current: false,
  },
  {
    name: 'Pedidos',
    href: '/admin/orders',
    icon: Package,
    current: false,
  },
  {
    name: 'Pagamentos',
    href: '/admin/payments',
    icon: CreditCard,
    current: false,
  },
  {
    name: 'Suporte',
    href: '/admin/support',
    icon: HeadphonesIcon,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
    current: false,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        "relative z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />

        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>

            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-admin-sidebar px-6 pb-2 ring-1 ring-white/10">
              <div className="flex h-16 shrink-0 items-center">
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="SVLentes Admin"
                />
                <span className="ml-3 text-xl font-semibold text-admin-sidebar-foreground">
                  SVLentes
                </span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              pathname === item.href
                                ? 'bg-admin-sidebar-active text-admin-sidebar-foreground'
                                : 'text-admin-sidebar-foreground hover:text-admin-sidebar-foreground hover:bg-admin-sidebar-hover',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon
                              className={cn(
                                pathname === item.href ? 'text-admin-sidebar-foreground' : 'text-admin-sidebar-foreground group-hover:text-admin-sidebar-foreground',
                                'h-6 w-6 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-admin-sidebar px-6 pb-4 border-r border-border">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="SVLentes Admin"
            />
            <span className="ml-3 text-xl font-semibold text-admin-sidebar-foreground">
              Admin
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-admin-sidebar-active text-admin-sidebar-foreground'
                            : 'text-admin-sidebar-foreground hover:text-admin-sidebar-foreground hover:bg-admin-sidebar-hover',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                        )}
                      >
                        <item.icon
                          className={cn(
                            pathname === item.href ? 'text-admin-sidebar-foreground' : 'text-admin-sidebar-foreground group-hover:text-admin-sidebar-foreground',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="bg-admin-sidebar text-admin-sidebar-foreground border-admin-sidebar-hover"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>
    </>
  )
}