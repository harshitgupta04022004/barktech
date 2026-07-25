import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AiChatWidget } from '../public/AiChatWidget';
import { SocialFloatBar } from '../public/SocialFloatBar';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SocialFloatBar />
      <AiChatWidget />
    </div>
  );
}
