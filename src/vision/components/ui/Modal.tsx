'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
    triggerLabel: string
    title: string
    description?: string
    children: React.ReactNode
}

export function Modal({ triggerLabel, title, description, children }: ModalProps) {
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant="secondary">{triggerLabel}</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur" />
                <Dialog.Content
                    className={cn(
                        'fixed inset-0 z-50 mx-auto my-12 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl focus:outline-none dark:border-slate-700 dark:bg-slate-900'
                    )}
                >
                    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-slate-800"
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>
                    {description ? <p className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
                    <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700 dark:text-slate-200">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
