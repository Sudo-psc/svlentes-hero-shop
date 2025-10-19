'use client'

import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminHeaderProps {
  session: any
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter()
  const { data: sessionData } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  const userInitials = sessionData?.user?.name
    ? sessionData.user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-admin-dashboard-card">
      <div className="flex h-16 items-center gap-x-4 px-6 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form className="relative flex flex-1" onSubmit={handleSearch}>
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <Search
              className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="search-field"
              className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-admin-sidebar-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
              placeholder="Buscar clientes, pedidos, assinaturas..."
              type="search"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
            <span className="sr-only">View notifications</span>
          </Button>

          {/* User menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full p-0"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {userInitials}
              </div>
            </Button>
            
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">{sessionData?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{sessionData?.user?.email}</p>
                      <Badge variant="secondary" className="w-fit mt-1">
                        Administrador
                      </Badge>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/settings/profile')
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/settings')
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </button>
                    <div className="border-t">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}