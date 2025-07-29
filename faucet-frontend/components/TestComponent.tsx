// src/components/TestComponent.tsx - CREATE THIS FILE TO TEST
'use client';

import React from 'react';
import { Droplets, Zap, Clock, Gift } from 'lucide-react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Test Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Test Header
          </h1>
          <p className="text-xl text-gray-600">This should be a blue gradient header</p>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-3 shadow-lg mb-4">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Test Card</h3>
            <p className="text-2xl font-bold text-gray-900">100 ETH</p>
            <p className="text-sm text-gray-500">Should have blue gradient icon</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-3 shadow-lg mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Purple Card</h3>
            <p className="text-2xl font-bold text-gray-900">0.05 ETH</p>
            <p className="text-sm text-gray-500">Should have purple gradient icon</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-3 shadow-lg mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Orange Card</h3>
            <p className="text-2xl font-bold text-gray-900">0.1 ETH</p>
            <p className="text-sm text-gray-500">Should have orange gradient icon</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-3 shadow-lg mb-4">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Green Card</h3>
            <p className="text-2xl font-bold text-gray-900">1.620 ETH</p>
            <p className="text-sm text-gray-500">Should have green gradient icon</p>
          </div>

        </div>

        {/* Test Button */}
        <div className="text-center">
          <button className="relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />
            <div className="relative z-10 flex items-center justify-center space-x-2">
              <Droplets className="w-5 h-5" />
              <span>Test Button</span>
            </div>
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>• If you see colorful gradient cards and button - Styling works! ✅</p>
          <p>• If you see plain black text - Tailwind not loading properly ❌</p>
          <p>• If icons are missing - lucide-react not installed ❌</p>
        </div>

      </div>
    </div>
  );
};

export default TestComponent;