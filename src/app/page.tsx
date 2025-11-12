import { PdfInsights } from '@/components/pdf-insights';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="container mx-auto max-w-3xl p-4">
        <PdfInsights />
      </div>
    </main>
  );
}
