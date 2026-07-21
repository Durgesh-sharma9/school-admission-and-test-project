import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import schoolApi from '../services/schoolApi';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setIsGoogleUser(false);
      const result = await schoolApi.post('/otp/send-otp', { email, purpose: 'PASSWORD_RESET' });

      if (result.success) {
        toast.success('OTP sent to your email');
        setOtpSent(true);
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1500);
      } else {
        if (result.isGoogleUser) {
          setIsGoogleUser(true);
        } else {
          toast.error(result.message || 'Failed to send OTP');
        }
      }
    } catch (error) {
      if (error.isGoogleUser || error.message?.includes('Google')) {
        setIsGoogleUser(true);
      } else {
        toast.error(error.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
            <p className="text-sm text-slate-500">
              Enter your email address to receive a password reset OTP
            </p>
          </div>

          {/* Form */}
          {isGoogleUser ? (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-3">
              <p className="text-sm font-semibold text-indigo-900">
                This account uses Google Sign-In.
              </p>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Password reset is not required for Google-authenticated accounts. Please continue using Google Login.
              </p>
              <Link
                to="/login"
                className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Go to Google Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otpSent}
              >
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                {!loading && !otpSent && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-slate-100">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
