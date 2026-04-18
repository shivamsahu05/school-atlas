import React from 'react';

const PermissionWrapper = ({ permission, children, fallback = null }) => {
  if (!permission) return fallback;

  const { enabled, expiryDate } = permission;
  const isExpired = expiryDate && new Date(expiryDate) < new Date();

  if (!enabled) return fallback;

  if (isExpired) {
    return (
      <div className="opacity-50 pointer-events-none relative inline-block" title={`Permission expired on ${new Date(expiryDate).toLocaleDateString()}`}>
        {children}
      </div>
    );
  }

  return children;
};

export default PermissionWrapper;
