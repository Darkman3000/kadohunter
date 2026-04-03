import React, { useState } from 'react';
import { Icons } from './Icons';

interface AuthModalProps {
  onAuthenticated: (username?: string) => void;
}

const generateCodename = () => {
  const adjectives = [
      'Neon', 'Cyber', 'Holo', 'Void', 'Data', 'Quantum', 'Retro', 'Synth', 'Giga', 'Nano', 
      'Pixel', 'Mecha', 'Turbo', 'Hyper', 'Flux', 'Zero', 'Iron', 'Dark', 'Light', 'Star'
  ];
  const nouns = [
      'Ronin', 'Runner', 'Drifter', 'Punk', 'Slayer', 'Hunter', 'Samurai', 'Ninja', 'Jedi', 'Wizard', 
      'Saiyan', 'Pirate', 'Alchemist', 'Cowboy', 'Ranger', 'Guardian', 'Rebel', 'Phantom', 'Ghost', 'Knight'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99); // 0-99 for style
  
  return `${adj}_${noun}${num > 0 ? `_${num}` : ''}`; 
};

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(false); // Toggle between Sign Up / Login
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(generateCodename());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsError, setTermsError] = useState(false); // For red warning
  const [shakeCodename, setShakeCodename] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const triggerShake = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setter(false), 500);
  };

  const handleSocialLogin = () => {
    if (!isLogin && (!username.trim() || !termsAccepted)) {
        if (!username.trim()) triggerShake(setShakeCodename);
        if (!termsAccepted) {
            setTermsError(true);
            triggerShake(setShakeTerms);
        }
        return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Pass username only on sign up
      onAuthenticated(isLogin ? undefined : username);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;
    if (!isLogin) { // Sign up validation
      if (!username.trim()) {
        triggerShake(setShakeCodename);
        hasError = true;
      }
      if (!email.trim() || !emailRegex.test(email)) {
        triggerShake(setShakeEmail);
        hasError = true;
      }
      if (!password.trim()) {
        triggerShake(setShakePassword);
        hasError = true;
      }
      if (!termsAccepted) {
        setTermsError(true);
        triggerShake(setShakeTerms);
        hasError = true;
      }
    } else { // Login validation
      if (!email.trim() || !emailRegex.test(email)) {
        triggerShake(setShakeEmail);
        hasError = true;
      }
      if (!password.trim()) {
        triggerShake(setShakePassword);
        hasError = true;
      }
    }
    
    if (hasError) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onAuthenticated(isLogin ? undefined : username);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-xl"></div>

      {/* Modal Container - Collector's Study Aesthetic */}
      <div className="relative w-full max-w-md bg-navy/90 border border-white/10 rounded-3xl shadow-2xl p-8 animate-fade-in-up overflow-hidden">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-umber to-transparent opacity-50"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-light-slate tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Hunt'}
          </h2>
          <p className="text-slate-text text-sm">
            {isLogin 
              ? 'Access your collection and market data.' 
              : 'Join to save and access your creations anywhere.'}
          </p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
          <button 
            type="button" 
            onClick={handleSocialLogin}
            className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors active:scale-[0.98]"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <button 
            type="button" 
            onClick={handleSocialLogin}
            className="w-full bg-black text-white border border-white/10 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors active:scale-[0.98]"
          >
            {/* Apple SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-slate-text text-xs font-bold uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Codename Input (Sign Up Only) */}
          {!isLogin && (
            <div className={`animate-slide-up ${shakeCodename ? 'animate-shake' : ''}`}>
                <label className="block text-xs font-bold text-slate-text uppercase tracking-wider mb-2 ml-1">Codename</label>
                <div className="relative">
                <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (shakeCodename) setShakeCodename(false);
                    }}
                    placeholder="Hunter_One"
                    className={`w-full bg-midnight/50 border rounded-xl py-3 pl-4 pr-12 text-light-slate placeholder-slate-text/50 focus:outline-none focus:ring-1 focus:ring-umber transition-all ${shakeCodename ? 'border-rose-500' : 'border-white/10 focus:border-umber'}`}
                />
                <button
                    type="button"
                    onClick={() => setUsername(generateCodename())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-text hover:text-umber transition-colors p-1"
                    title="Generate Random Codename"
                >
                    <Icons.Shuffle size={16} />
                </button>
                </div>
            </div>
          )}

          <div className={shakeEmail ? 'animate-shake' : ''}>
            <label className="block text-xs font-bold text-slate-text uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (shakeEmail) setShakeEmail(false);
                }}
                placeholder="you@example.com"
                className={`w-full bg-midnight/50 border rounded-xl py-3 px-4 text-light-slate placeholder-slate-text/50 focus:outline-none focus:ring-1 focus:ring-umber transition-all ${shakeEmail ? 'border-rose-500' : 'border-white/10 focus:border-umber'}`}
              />
            </div>
          </div>

          <div className={shakePassword ? 'animate-shake' : ''}>
            <label className="block text-xs font-bold text-slate-text uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (shakePassword) setShakePassword(false);
                }}
                placeholder="••••••••"
                className={`w-full bg-midnight/50 border rounded-xl py-3 pl-4 pr-12 text-light-slate placeholder-slate-text/50 focus:outline-none focus:ring-1 focus:ring-umber transition-all ${shakePassword ? 'border-rose-500' : 'border-white/10 focus:border-umber'}`}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-text hover:text-light-slate transition-colors"
              >
                {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox (Only for Sign Up) */}
          {!isLogin && (
            <div className={`flex items-start justify-center gap-3 mt-2 group pt-2 ${shakeTerms ? 'animate-shake' : ''}`}>
              <div className="relative flex items-center pt-0.5">
                <input 
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  id="terms-check"
                  className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-midnight/50 checked:bg-umber checked:border-umber transition-all cursor-pointer"
                />
                <Icons.Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-midnight opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity pt-0.5" strokeWidth={4} />
              </div>
              <label 
                htmlFor="terms-check" 
                className={`text-xs text-left cursor-pointer select-none hover:text-light-slate transition-colors leading-tight ${termsError ? 'text-rose-400' : 'text-slate-text'}`}
              >
                By proceeding, you agree to our <span className="text-umber hover:underline">Terms of Service</span> and <span className="text-umber hover:underline">Privacy Policy</span>
              </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-umber text-midnight font-bold py-3.5 rounded-xl shadow-lg hover:bg-umber-dark hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Log In' : 'Join the Hunt'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-sm text-light-slate">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                  setIsLogin(!isLogin);
                  setTermsError(false); // Reset error on view switch
              }}
              className="font-bold text-umber hover:text-umber-dark hover:underline transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};