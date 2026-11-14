// frontend/src/components/PinLockScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, AlertCircle, ArrowRight, ShieldCheck, Delete } from 'lucide-react';

const CORRECT_PIN = '2205';

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (candidatePin) => {
    if (candidatePin === CORRECT_PIN) {
      setIsSuccess(true);
      setError('');
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      setError('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleDelete();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pin.length === 4) {
        verifyPin(pin);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={inputRef}
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-slate-950 opacity-90 pointer-events-none" />

      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center">
        
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-sky-900/40 mb-3 border border-sky-400/20">
          SV
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-white">
          Siddhivinayak CNC
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Workshop Management Terminal
        </p>

        {/* Status Prompt */}
        <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
          {isSuccess ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Access Granted</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Enter 4-Digit Security PIN</span>
            </>
          )}
        </div>

        {/* 4 Digit Indicators */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20 scale-110'
                    : error
                    ? 'bg-rose-500 ring-4 ring-rose-500/20 animate-shake'
                    : isFilled
                    ? 'bg-sky-400 ring-4 ring-sky-400/20 scale-105'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs text-rose-400 font-medium mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-sky-600/30 text-white font-mono font-semibold text-lg border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-sky-600/30 text-white font-mono font-semibold text-lg border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-rose-400 font-medium text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard Helper */}
        <p className="text-[11px] text-slate-500 mt-5">
          Type on your keyboard or tap digits to unlock
        </p>

      </div>
    </div>
  );
}
