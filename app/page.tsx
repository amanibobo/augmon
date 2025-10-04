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
    <div className="min-h-screen bg-white text-gray-900" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#e5e7eb #ffffff'
    }}>
      {/* Navigation */}
      <nav className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">

              <span className="font-semibold text-gray-900 text-lg">[a] augmon</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-8">
              <a href="#" className="text-gray-900 font-medium hover:text-gray-600 transition-colors">
                Features
              </a>
              <a href="#" className="text-gray-900 font-medium hover:text-gray-600 transition-colors">
                Enterprise
              </a>
              <a href="#" className="text-gray-900 font-medium hover:text-gray-600 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-900 font-medium hover:text-gray-600 transition-colors">
                Resources
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton className="px-4 py-2 rounded-full border border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition-colors" />
                <SignUpButton className="px-4 py-2 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors" />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
                <a
                  href="/canvas"
                  className="px-4 py-2 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
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
            <h1 className="text-[26px] font-normal tracking-normal text-gray-900 mb-6" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
              Scan cards. Build decks.<br />
              Chat with your AI canvas.
            </h1>

            <Button className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 font-medium mb-12">
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


