import React from 'react';
import { Navigate } from 'react-router-dom';
import useSubscriptionAccess from '../../app/school/hooks/useSubscriptionAccess';

export const FeatureGate = ({ children, feature = 'assessment', fallbackPath = '/dashboard' }) => {
  const { assessmentEnabled } = useSubscriptionAccess();

  if (feature === 'assessment' && !assessmentEnabled) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default FeatureGate;
