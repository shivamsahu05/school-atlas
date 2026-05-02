import React from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ onClick, label = 'Export Excel' }) => {
  return (
    <button onClick={onClick} className="btn-secondary flex items-center gap-2">
      <Download size={16} />
      {label}
    </button>
  );
};

export default ExportButton;
