'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResponseStreamProps {
  textStream: string;
  mode?: 'fade' | 'typewriter';
  className?: string;
  fadeDuration?: number;
  segmentDelay?: number;
  renderMarkdown?: boolean;
}

export function ResponseStream({ 
  textStream, 
  mode = 'fade', 
  className = '', 
  fadeDuration = 1200,
  segmentDelay = 50,
  renderMarkdown = false
}: ResponseStreamProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < textStream.length) {
      const timer = setTimeout(() => {
        setDisplayedText(textStream.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, segmentDelay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, textStream, segmentDelay]);

  if (renderMarkdown) {
    return (
      <div className={className}>
        <div className="select-text prose prose-sm max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
              p: ({ children }) => <p className="mb-2">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-2 italic mb-2">{children}</blockquote>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {displayedText}
          </ReactMarkdown>
        </div>
        {currentIndex < textStream.length && <span className="animate-pulse select-none">|</span>}
      </div>
    );
  }

  if (mode === 'fade') {
    return (
      <div className={`${className} select-text`}>
        {textStream.split(' ').map((word, index) => {
          const isVisible = index < displayedText.split(' ').length;
          return (
            <span
              key={index}
              className={`transition-opacity duration-${fadeDuration} ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDuration: `${fadeDuration}ms` }}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  }

  // Typewriter mode
  return (
    <div className={`${className} select-text`}>
      {displayedText}
      <span className="animate-pulse select-none">|</span>
    </div>
  );
}
