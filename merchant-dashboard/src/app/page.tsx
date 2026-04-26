"use client";

import dynamic from 'next/dynamic';

const PerformanceClient = dynamic(
  () => import('@/components/PerformancePage'),
  {
    ssr: false,
    loading: () => (
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f5' }}>
        <div style={{ color: '#a1a1aa', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }
);

export default function Page() {
  return <PerformanceClient />;
}
