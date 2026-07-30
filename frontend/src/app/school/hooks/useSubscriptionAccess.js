import { useAuth } from '../contexts/AuthContext';

export const useSubscriptionAccess = () => {
  const { school } = useAuth();

  if (!school) {
    return {
      assessmentEnabled: false,
      plan: 'free-trial',
    };
  }

  // Super-admin always has access to everything
  if (school.role === 'super-admin') {
    return {
      assessmentEnabled: true,
      plan: 'premium',
    };
  }

  // College admins always have assessment features (only school plans have basic/premium distinction here)
  if (school.institutionType === 'college') {
    return {
      assessmentEnabled: true,
      plan: school.subscription?.plan || 'college-premium',
    };
  }

  const subscription = school.subscription;
  const plan = subscription?.plan || 'free-trial';

  // Free trial gets access by default. Otherwise check the plan's assessmentEnabled flag.
  const assessmentEnabled = plan === 'free-trial' ? true : !!subscription?.assessmentEnabled;

  return {
    assessmentEnabled,
    plan,
  };
};

export default useSubscriptionAccess;
