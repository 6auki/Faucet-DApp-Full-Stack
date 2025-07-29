'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, FAUCET_ABI } from '@/lib/wagmi';
import { Address } from 'viem';

export function Navigation() {
  const { isConnected, address, chain } = useAccount();
  
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;

  // Check if current user is owner
  const { data: owner } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'owner',
  });

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⛽</span>
            </div>
            <span className="text-xl font-bold gradient-text">ETH Faucet</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#faucet" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Faucet
            </a>
            <a 
              href="#stats" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Stats
            </a>
            {isOwner && (
              <a 
                href="#admin" 
                className="text-orange-600 hover:text-orange-800 font-bold transition-colors flex items-center"
              >
                <span className="mr-1">👑</span>
                Admin
              </a>
            )}
            {isConnected && (
              <a 
                href="#history" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                History
              </a>
            )}
          </div>

          {/* Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}