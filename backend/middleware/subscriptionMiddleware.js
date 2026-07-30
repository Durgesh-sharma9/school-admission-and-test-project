const checkSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.school;

    // Default status if missing
    const plan = subscription?.plan || 'free-trial';
    const status = subscription?.status || 'active';
    const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
    const expiryDate = subscription?.expiryDate ? new Date(subscription.expiryDate) : null;
    const now = new Date();

    if (plan === 'free-trial') {
      if (trialEnd && trialEnd < now) {
        return res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your free trial has expired. Please purchase a plan to continue using the CRM.'
        });
      }
    } else {
      if (status !== 'active' || (expiryDate && expiryDate < now)) {
        return res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your CRM subscription is inactive or expired. Please purchase or renew a plan to continue.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Subscription verification failed:', error);
    return res.status(500).json({ success: false, message: 'Internal server error checking subscription status' });
  }
};

const checkAssessmentAccess = async (req, res, next) => {
  try {
    const { subscription } = req.school;

    // Check if college - College premium always has access (only school-basic is blocked)
    if (req.school.institutionType === 'college') {
      return next();
    }

    const plan = subscription?.plan || 'free-trial';

    // Free trial users have access to premium features (including assessments) by default during trial
    if (plan === 'free-trial') {
      return next();
    }

    // Non-trial users must have assessmentEnabled set to true (e.g. School Premium)
    if (subscription?.assessmentEnabled !== true) {
      return res.status(403).json({
        success: false,
        code: 'UPGRADE_REQUIRED',
        message: 'Assessment Module is available only in School Premium. Upgrade your subscription to access this feature.'
      });
    }

    next();
  } catch (error) {
    console.error('Assessment permission check failed:', error);
    return res.status(500).json({ success: false, message: 'Internal server error verifying permissions' });
  }
};

const checkPlanAccess = (allowedPlans) => {
  return (req, res, next) => {
    const plan = req.school.subscription?.plan || 'free-trial';
    if (!allowedPlans.includes(plan)) {
      return res.status(403).json({
        success: false,
        message: 'Your current subscription plan does not allow access to this action.'
      });
    }
    next();
  };
};

module.exports = {
  checkSubscription,
  checkAssessmentAccess,
  checkPlanAccess
};
