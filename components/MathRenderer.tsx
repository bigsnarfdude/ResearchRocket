import React, { useEffect, useRef, useState } from 'react';

interface MathRendererProps {
  text: string;
  className?: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isKatexLoaded, setIsKatexLoaded] = useState(false);

  // 1. Wait for KaTeX to load to prevent blank rendering
  useEffect(() => {
    if (typeof window !== 'undefined' && window.katex) {
      setIsKatexLoaded(true);
    } else {
      const interval = setInterval(() => {
        if (window.katex) {
          setIsKatexLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!text) return;

    const macros = {
      "\\R": "\\mathbb{R}",
      "\\N": "\\mathbb{N}",
      "\\Z": "\\mathbb{Z}",
      "\\Q": "\\mathbb{Q}",
      "\\C": "\\mathbb{C}"
    };

    // 2. Split by Block Math ($$...$$) first to preserve these blocks
    const blocks = text.split(/(\$\$[\s\S]*?\$\$)/g);

    blocks.forEach(block => {
      if (block.startsWith('$$') && block.endsWith('$$')) {
        // Render Block Math
        const div = document.createElement('div');
        const math = block.slice(2, -2);
        
        if (isKatexLoaded) {
          try {
            window.katex.render(math, div, { 
              displayMode: true, 
              throwOnError: false, 
              strict: false,
              macros 
            });
          } catch (e) {
            div.textContent = block;
          }
        } else {
          // Fallback if KaTeX not ready
          div.textContent = block;
          div.className = "font-mono text-xs bg-gray-50 p-2 overflow-x-auto";
        }
        container.appendChild(div);
      } else {
        // Process text block as Markdown
        processMarkdownBlock(block, container, macros, isKatexLoaded);
      }
    });

  }, [text, isKatexLoaded]);

  return <div ref={containerRef} className={`math-serif text-gray-800 leading-relaxed ${className}`} />;
};

function processMarkdownBlock(text: string, container: HTMLElement, macros: any, isKatexLoaded: boolean) {
  const lines = text.split('\n');
  let textBuffer: string[] = [];

  const flushBuffer = () => {
    if (textBuffer.length > 0) {
      const p = document.createElement('p');
      p.className = "mb-4 leading-7 text-gray-800"; // Increased margin for better spacing
      processInlineContent(textBuffer.join(' '), p, macros, isKatexLoaded);
      container.appendChild(p);
      textBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but flush buffer to create paragraph breaks
    if (!trimmed) {
      flushBuffer();
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flushBuffer();
      const hr = document.createElement('hr');
      hr.className = "my-6 border-gray-200";
      container.appendChild(hr);
      continue;
    }

    // Headers
    if (trimmed.startsWith('#')) {
      flushBuffer();
      const match = trimmed.match(/^(#+)\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        
        let h;
        if (level >= 4) {
          h = document.createElement('h4');
          h.className = "font-semibold text-base mb-2 mt-4 text-gray-900";
        } else if (level === 3) {
          h = document.createElement('h3');
          h.className = "font-semibold text-lg mb-2 mt-4 text-gray-900";
        } else {
          h = document.createElement('h2');
          h.className = "font-bold text-xl mb-3 mt-6 text-gray-900 border-b border-gray-100 pb-1";
        }
        
        processInlineContent(content, h, macros, isKatexLoaded);
        container.appendChild(h);
        continue;
      }
    }

    // Bullet Lists: * or -
    const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)/);
    if (bulletMatch) {
      flushBuffer();
      const contentStr = bulletMatch[1];
      
      const wrapper = document.createElement('div');
      wrapper.className = "flex gap-3 ml-4 mb-2";
      
      const bullet = document.createElement('span');
      bullet.innerHTML = "&bull;";
      bullet.className = "text-blue-500 font-bold flex-shrink-0 mt-1.5 leading-none";
      
      const contentDiv = document.createElement('div');
      contentDiv.className = "flex-1 text-gray-800";
      processInlineContent(contentStr, contentDiv, macros, isKatexLoaded);
      
      wrapper.appendChild(bullet);
      wrapper.appendChild(contentDiv);
      container.appendChild(wrapper);
      continue;
    }

    // Numbered Lists: 1.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushBuffer();
      const numberStr = numMatch[1] + ".";
      const contentStr = numMatch[2];
      
      const wrapper = document.createElement('div');
      wrapper.className = "flex gap-3 ml-4 mb-2";
      
      const num = document.createElement('span');
      num.textContent = numberStr;
      num.className = "text-blue-600 font-bold flex-shrink-0 min-w-[1.5rem] mt-0.5";
      
      const contentDiv = document.createElement('div');
      contentDiv.className = "flex-1 text-gray-800";
      processInlineContent(contentStr, contentDiv, macros, isKatexLoaded);
      
      wrapper.appendChild(num);
      wrapper.appendChild(contentDiv);
      container.appendChild(wrapper);
      continue;
    }

    // Accumulate regular text for paragraphs
    textBuffer.push(line);
  }

  flushBuffer();
}

function processInlineContent(text: string, container: HTMLElement, macros: any, isKatexLoaded: boolean) {
  // Split by Inline Math ($...$)
  const parts = text.split(/(\$[\s\S]*?\$)/g);

  parts.forEach(part => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const span = document.createElement('span');
      const math = part.slice(1, -1);
      
      if (isKatexLoaded) {
        try {
          window.katex.render(math, span, { 
            displayMode: false, 
            throwOnError: false, 
            strict: false,
            macros 
          });
        } catch (e) {
          span.textContent = part;
        }
      } else {
        span.textContent = part;
        span.className = "font-mono text-xs bg-gray-100 rounded px-1";
      }
      container.appendChild(span);
    } else {
      processRichText(part, container);
    }
  });
}

function processRichText(text: string, container: HTMLElement) {
  // Bold (**...**) and URLs
  const tokens = text.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g);

  tokens.forEach(token => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = token.slice(2, -2);
      strong.className = "font-bold text-gray-900";
      container.appendChild(strong);
    } else if (token.match(/^https?:\/\//)) {
      const a = document.createElement('a');
      a.href = token;
      a.textContent = token;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "text-blue-600 hover:underline break-all cursor-pointer";
      container.appendChild(a);
    } else {
      if (token) {
        container.appendChild(document.createTextNode(token));
      }
    }
  });
}

export default MathRenderer;
