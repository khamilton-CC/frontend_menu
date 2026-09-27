'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Validation logic
  const isDomainValid = email.toLowerCase().trim().endsWith('@connorconcepts.com');
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = fullName.trim() !== '' && isDomainValid && isPasswordValid && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 relative">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Create an Account</h2>
        <p className="text-xs text-gray-500 mb-4">
          Registration is restricted to official @connorconcepts.com corporate email addresses.
        </p>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
              Account created successfully! Check your email inbox to verify your address before logging in.
            </div>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-100 text-red-700 p-2 text-xs rounded">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@connorconcepts.com"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {email && !isDomainValid && (
                <p className="text-[11px] text-red-600 mt-1">Must end with @connorconcepts.com</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-[11px] text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}