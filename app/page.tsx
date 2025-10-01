'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';


export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#13120A] text-white" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#13120A #13120A'
    }}>
      {/* Navigation */}
      <nav className="w-full bg-[#13120A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              
              <span className="font-semibold text-white text-lg">[a] augmon</span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-8">
              <a href="#" className="text-white font-medium hover:text-white/80 transition-colors">
                Features
              </a>
              <a href="#" className="text-white font-medium hover:text-white/80 transition-colors">
                Enterprise
              </a>
              <a href="#" className="text-white font-medium hover:text-white/80 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-white font-medium hover:text-white/80 transition-colors">
                Resources
              </a>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton className="px-4 py-2 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors" />
                <SignUpButton className="px-4 py-2 rounded-full bg-white text-[#13120A] font-medium hover:bg-white/90 transition-colors" />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
                <a
                  href="/canvas"
                  className="px-4 py-2 rounded-full bg-white text-[#13120A] font-medium hover:bg-white/90 transition-colors"
                >
                  Canvas
                </a>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      <main className="">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="w-full">
            <h1 className="text-[26px] font-normal tracking-normal text-white mb-6" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
              Scan cards. Build decks.<br />
              Chat with your AI canvas.
            </h1>
            
            <Button className="px-6 py-3 bg-white text-[#13120A] hover:bg-white/90 font-medium mb-12">
              Get started
            </Button>
            
            {/* Image */}
            <div className="w-full overflow-hidden rounded-lg">
              <img 
                src="https://ext.same-assets.com/2614726103/458723563.jpeg" 
                alt="Hero Image"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}


