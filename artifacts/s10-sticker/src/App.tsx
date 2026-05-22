import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Stickers from "@/pages/stickers";
import StickerView from "@/pages/sticker-view";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight uppercase text-primary">S10 STICKER GEN</Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary/80">Generator</Link>
            <Link href="/stickers" className="text-sm font-medium hover:text-primary/80">Archive</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/stickers" component={Stickers} />
        <Route path="/sticker/:id" component={StickerView} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
