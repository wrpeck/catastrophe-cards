"use client";

import { ReactNode } from "react";

interface PageBodyProps {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  children: ReactNode;
}

export default function PageBody({
  leftSidebar,
  rightSidebar,
  children,
}: PageBodyProps) {
  return (
    <div className="flex gap-6 min-h-0 w-full">
      {/* Left Sidebar */}
      {leftSidebar && (
        <aside className="hidden lg:block lg:w-[368px] flex-shrink-0 pl-4 sm:pl-6 lg:pl-8">
          {leftSidebar}
        </aside>
      )}

      {/* Center Content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8">{children}</main>

      {/* Right Sidebar */}
      {rightSidebar && (
        <aside className="hidden md:block w-[368px] flex-shrink-0 pr-4 sm:pr-6 lg:pr-8">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
