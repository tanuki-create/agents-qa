'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content prose prose-slate max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative">
                <div className="absolute top-0 right-0 bg-gray-200 px-2 py-1 text-xs rounded-bl text-gray-700">
                  {match[1]}
                </div>
                <pre className={`${className} rounded p-4 bg-gray-50 overflow-x-auto`}>
                  <code className={`language-${match[1]}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          },
          table({ node, className, children, ...props }: any) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 my-4" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ node, className, children, ...props }: any) {
            return (
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 bg-gray-100" {...props}>
                {children}
              </th>
            );
          },
          td({ node, className, children, ...props }: any) {
            return (
              <td className="px-3 py-2 text-sm text-gray-800 border-t border-gray-200" {...props}>
                {children}
              </td>
            );
          },
          a({ node, children, href, ...props }: any) {
            if (!href) return <>{children}</>;
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline" 
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ node, src, alt, ...props }: any) {
            if (!src) return null;
            return (
              <img
                src={src}
                alt={alt || ''}
                className="rounded-md max-w-full h-auto my-4"
                {...props}
              />
            );
          },
          ul({ node, ordered, className, children, ...props }: any) {
            return (
              <ul className="list-disc pl-6 my-3" {...props}>
                {children}
              </ul>
            );
          },
          ol({ node, ordered, className, children, ...props }: any) {
            return (
              <ol className="list-decimal pl-6 my-3" {...props}>
                {children}
              </ol>
            );
          },
          h1({ node, children, ...props }: any) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-3" {...props}>
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }: any) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-3" {...props}>
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }: any) {
            return (
              <h3 className="text-lg font-bold mt-4 mb-2" {...props}>
                {children}
              </h3>
            );
          },
          blockquote({ node, className, children, ...props }: any) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 italic bg-gray-50 rounded" {...props}>
                {children}
              </blockquote>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 