import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ViewportContainerProps {
  children: ReactNode;
  className?: string;
  minHeight?: 'dvh' | 'svh' | 'lvh' | 'screen';
  safeArea?: boolean;
  as?: 'div' | 'main' | 'section' | 'article';
}

export function ViewportContainer({
  children,
  className,
  minHeight = 'dvh',
  safeArea = false,
  as: Component = 'div',
}: ViewportContainerProps) {
  const heightClass = {
    dvh: 'min-h-dvh',
    svh: 'min-h-svh',
    lvh: 'min-h-lvh',
    screen: 'min-h-screen',
  }[minHeight];

  return (
    <Component
      className={cn(
        heightClass,
        'w-full flex flex-col',
        safeArea && 'pb-safe pt-safe',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface ViewportSectionProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  centered?: boolean;
}

export function ViewportSection({
  children,
  className,
  padding = true,
  centered = true,
}: ViewportSectionProps) {
  return (
    <section
      className={cn(
        'w-full',
        padding && 'px-4 sm:px-6 lg:px-8',
        centered && 'max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </section>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ResponsiveGrid({
  children,
  className,
  columns = { base: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
}: ResponsiveGridProps) {
  const colClasses = [
    `grid-cols-${columns.base}`,
    columns.sm ? `sm:grid-cols-${columns.sm}` : '',
    columns.md ? `md:grid-cols-${columns.md}` : '',
    columns.lg ? `lg:grid-cols-${columns.lg}` : '',
    columns.xl ? `xl:grid-cols-${columns.xl}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', colClasses, `gap-${gap}`, className)}>
      {children}
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
  header?: ReactNode;
}

export function AppShell({
  children,
  className,
  sidebar,
  header,
}: AppShellProps) {
  return (
    <div
      className={cn(
        'h-dvh w-screen overflow-hidden flex flex-row',
        'bg-background text-foreground',
        className
      )}
    >
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {header}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
