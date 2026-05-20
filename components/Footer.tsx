'use client';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400 py-8 text-center text-xs mt-auto w-full border-t border-neutral-800 shrink-0">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} Shanghai Yisu Information Technology Co., Ltd. All rights reserved.
        </p>
        <p className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
          Strictly for authorized personnel use only &bull; Slovenia Operations Management Portal
        </p>
      </div>
    </footer>
  );
}
