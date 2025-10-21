import { cn } from '@/lib/utils'
interface SectionSkeletonProps {
    className?: string
}
export function SectionSkeleton({ className = 'min-h-[320px]' }: SectionSkeletonProps) {
    return <div className={cn('w-full rounded-3xl bg-gray-100/80 backdrop-blur-sm animate-pulse', className)} />
}