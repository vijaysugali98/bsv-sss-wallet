'use client'

import React from 'react'

interface Step {
  number: number
  title: string
  description: string
  icon: React.ReactElement
  details: string[]
}

interface HowItWorksStepsProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function HowItWorksSteps({ variant = 'full', className = '' }: HowItWorksStepsProps) {
  const steps: Step[] = [
    {
      number: 1,
      title: 'Split',
      description: 'Your secret is mathematically split into multiple shares using Shamir\'s Secret Sharing.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      details: [
        'Choose how many shares to create (N) and how many are needed to recover (K)',
        'Your secret is mathematically transformed into N independent shares',
        'Each share looks like random data and reveals nothing about the original secret',
        'No single share can reconstruct your secret'
      ]
    },
    {
      number: 2,
      title: 'Distribute',
      description: 'Store shares in different secure locations with trusted parties.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      details: [
        'Give shares to trusted family members, friends, or advisors',
        'Store in different physical locations (safe deposit boxes, safes)',
        'Print QR codes for easy recovery and offline storage',
        'Ensure no single location has enough shares to recover alone'
      ]
    },
    {
      number: 3,
      title: 'Recover',
      description: 'Collect the required number of shares to reconstruct your original secret.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      details: [
        'Gather K or more shares from your trusted parties',
        'Enter shares manually or scan QR codes with your camera',
        'The mathematical algorithm reconstructs your original secret',
        'Works even if some shares are lost (as long as you have K shares)'
      ]
    }
  ]

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.number}. {step.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          How Shamir&apos;s Secret Sharing Works
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          A cryptographically secure method to split your secret into multiple pieces, 
          where only a subset is needed for recovery.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200" />
            )}
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                {step.number}
              </div>
              
              <div className="ml-6 flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  {step.title}
                  <div className="ml-3 text-blue-600">
                    {step.icon}
                  </div>
                </h3>
                
                <p className="text-gray-700 mb-4 text-lg">
                  {step.description}
                </p>
                
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Example: 2-of-3 Setup
        </h3>
        <p className="text-blue-800 mb-3">
          Create 3 shares, any 2 can recover your secret. Give one to your spouse, 
          one to a trusted friend, and keep one yourself.
        </p>
        <div className="text-sm text-blue-700">
          <strong>Benefits:</strong> If you lose your share, spouse + friend can help recover. 
          If friend is unavailable, you + spouse can recover. Maximum flexibility with security.
        </div>
      </div>
    </div>
  )
}