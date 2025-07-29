'use client';

import { useReadContract } from 'wagmi';
import { formatEther, Address } from 'viem';
import { CONTRACT_ADDRESSES, FAUCET_ABI } from '@/lib/wagmi';
import { useAccount } from 'wagmi';

export function StatsDashboard() {
  const { chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id as keyof typeof CONTRACT_ADDRESSES] : undefined;

  const { data: balance } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'getBalance',
  });

  const { data: totalTips } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'totalTipReceived',
  });

  const { data: maxBalance } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'maxBalance',
  });

  const { data: perTransactionLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'perTransactionLimit',
  });

  const { data: dailyLimit } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'dailyLimit',
  });

  const { data: coolDown } = useReadContract({
    address: contractAddress as Address,
    abi: FAUCET_ABI,
    functionName: 'coolDown',
  });

  const balancePercentage = balance && maxBalance 
    ? (Number(formatEther(balance)) / Number(formatEther(maxBalance))) * 100 
    : 0;

  const stats = [
    {
      label: 'Faucet Balance',
      value: balance ? `${Number(formatEther(balance)).toFixed(4)} ETH` : '0 ETH',
      subtext: maxBalance ? `of ${formatEther(maxBalance)} ETH max` : '',
      percentage: balancePercentage,
      color: 'from-blue-500 to-cyan-500',
      icon: '💰',
    },
    {
      label: 'Total Tips Received',
      value: totalTips ? `${Number(formatEther(totalTips)).toFixed(4)} ETH` : '0 ETH',
      subtext: 'Community contributions',
      color: 'from-green-500 to-emerald-500',
      icon: '💝',
    },
    {
      label: 'Per Transaction Limit',
      value: perTransactionLimit ? `${formatEther(perTransactionLimit)} ETH` : '0 ETH',
      subtext: 'Maximum per withdrawal',
      color: 'from-purple-500 to-pink-500',
      icon: '⚡',
    },
    {
      label: 'Daily Limit',
      value: dailyLimit ? `${formatEther(dailyLimit)} ETH` : '0 ETH',
      subtext: 'Per user per day',
      color: 'from-orange-500 to-red-500',
      icon: '📅',
    },
    {
      label: 'Cooldown Period',
      value: coolDown ? `${Number(coolDown) / 60} minutes` : '5 minutes',
      subtext: 'Between withdrawals',
      color: 'from-indigo-500 to-purple-500',
      icon: '⏰',
    },
    {
      label: 'Network',
      value: chain?.name || 'Not Connected',
      subtext: `Chain ID: ${chain?.id || 'N/A'}`,
      color: 'from-gray-500 to-slate-500',
      icon: '🌐',
    },
  ];

  return (
    <div id="stats" className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold gradient-text mb-4">Faucet Statistics</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real-time stats and configuration of the ETH faucet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="glass-morphism rounded-xl p-6 hover:scale-105 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl">{stat.icon}</div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-white font-bold text-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                {index + 1}
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              {stat.label}
            </h3>
            
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </p>
            
            {stat.subtext && (
              <p className="text-sm text-gray-500">
                {stat.subtext}
              </p>
            )}

            {stat.percentage !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-300`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.percentage.toFixed(1)}% of capacity
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health Status */}
      <div className="mt-12 glass-morphism rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏥</span>
          Faucet Health Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              balancePercentage > 10 ? 'bg-green-500' : balancePercentage > 5 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <p className="text-sm font-medium">Balance Level</p>
            <p className="text-xs text-gray-500">
              {balancePercentage > 10 ? 'Healthy' : balancePercentage > 5 ? 'Low' : 'Critical'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-2"></div>
            <p className="text-sm font-medium">Contract Status</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              chain?.id ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <p className="text-sm font-medium">Network</p>
            <p className="text-xs text-gray-500">
              {chain?.id ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}