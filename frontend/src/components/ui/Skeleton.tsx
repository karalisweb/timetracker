type SkeletonVariant = 'text' | 'card' | 'avatar' | 'row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`bg-dark-700 rounded animate-pulse ${className}`} />;
}

export default function Skeleton({ variant = 'text', className = '', lines = 3 }: SkeletonProps) {
  if (variant === 'avatar') {
    return <SkeletonBar className={`h-10 w-10 rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className={`bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3 ${className}`}>
        <SkeletonBar className="h-4 w-1/3" />
        <SkeletonBar className="h-8 w-1/2" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-2/3" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <SkeletonBar className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-4 w-1/3" />
          <SkeletonBar className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
