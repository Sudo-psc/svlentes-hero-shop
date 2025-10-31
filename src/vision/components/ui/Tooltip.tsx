'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

interface TooltipProps {
    label: string
    children: React.ReactNode
}

export function Tooltip({ label, children }: TooltipProps) {
    return (
        <TooltipPrimitive.Provider delayDuration={200} disableHoverableContent>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Content
                    className={cn(
                        'z-50 max-w-xs rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg data-[state=delayed-open]:animate-in data-[state=closed]:animate-out'
                    )}
                    sideOffset={8}
                >
                    {label}
                    <TooltipPrimitive.Arrow className="fill-slate-900" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}
