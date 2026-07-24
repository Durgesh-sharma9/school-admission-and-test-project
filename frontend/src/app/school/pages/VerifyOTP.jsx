import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import schoolApi from '../services/schoolApi';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { Mail, Clock, ArrowRight, RefreshCw } from 'lucide-react';

const VerifyOTP = () => {
  const { updateSchoolState } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailParam = searchParams.get('email');
  const emailFromState = location.state?.email;
  const [email, setEmail] = useState(emailFromState || emailParam || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const data = await schoolApi.post('/otp/verify-otp', {
        email,
        otp: otpValue,
        purpose: 'EMAIL_VERIFICATION'
      });

      if (data.success) {
        toast.success('Email verified successfully!');

        if (data.token && data.school) {
          localStorage.setItem('token', data.token);
          if (updateSchoolState) {
            updateSchoolState(data.school);
          }
          const target = data.school.institutionType === 'college' ? '/college/dashboard' : '/dashboard';
          navigate(target, { replace: true });
        } else {
          toast.success('Email verified successfully. Please login.');
          navigate('/login', { state: { email } });
        }
      } else {
        toast.error(data.message || 'OTP verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      setResending(true);
      const data = await schoolApi.post('/otp/resend-otp', {
        email,
        purpose: 'EMAIL_VERIFICATION'
      });

      if (data.success) {
        toast.success('New OTP sent successfully');
        setTimeLeft(600);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Verify Your Email</h1>
            <p className="text-sm text-slate-500">
              Enter the 6-digit OTP sent to <span className="font-semibold text-slate-700">{maskEmail(email)}</span>
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 bg-slate-50 rounded-xl p-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-700">
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP expired'}
            </span>
          </div>

          {/* OTP Input */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          {/* Resend Button */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={!canResend || resending}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend OTP'}</span>
            </button>
            <p className="text-xs text-slate-400 mt-2">
              {canResend ? 'You can request a new OTP now' : 'Wait for the timer to expire'}
            </p>
          </div>

          {/* Back to Signup */}
          <div className="text-center pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
