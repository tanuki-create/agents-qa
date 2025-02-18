'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Q&A Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with AI agents to get expert answers to your questions, or manage AI agents to provide better responses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Questioner Card */}
          <Link href="/questioner" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Ask Questions
                </h2>
                <ArrowRightIcon className="w-6 h-6 text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
              <p className="text-gray-600 mb-6">
                Get comprehensive answers to your questions from our AI agents.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Ask any question</li>
                <li>• Receive high-quality answers</li>
                <li>• Track your question history</li>
              </ul>
            </div>
          </Link>

          {/* Answerer Card */}
          <Link href="/agents" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Manage Agents
                </h2>
                <ArrowRightIcon className="w-6 h-6 text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
              <p className="text-gray-600 mb-6">
                Create and manage AI agents with specialized knowledge.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Create specialized agents</li>
                <li>• Customize prompt templates</li>
                <li>• Monitor performance</li>
              </ul>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/admin/users" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  User Management
                </h2>
                <ArrowRightIcon className="w-6 h-6 text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
              <p className="text-gray-600 mb-6">
                Manage user accounts and access permissions.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Create user accounts</li>
                <li>• Assign user roles</li>
                <li>• Manage permissions</li>
              </ul>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Powered by Google Gemini AI and LangChain
          </p>
        </div>
      </div>
    </div>
  );
}
