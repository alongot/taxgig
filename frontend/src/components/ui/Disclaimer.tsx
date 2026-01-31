import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DisclaimerProps {
  variant?: 'inline' | 'block';
  className?: string;
}

const DISCLAIMER_TEXT = "This is an estimate based on the information provided. Actual tax obligations may vary.";

export function TaxDisclaimer({ variant = 'inline', className = '' }: DisclaimerProps) {
  if (variant === 'inline') {
    return (
      <span className={`text-xs text-gray-500 italic ${className}`}>
        {DISCLAIMER_TEXT}
      </span>
    );
  }

  return (
    <div className={`flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <InformationCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-500">
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}

export function TaxDisclaimerTooltip({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center cursor-help ${className}`}
      title={DISCLAIMER_TEXT}
    >
      <InformationCircleIcon className="w-4 h-4 text-gray-400" />
    </span>
  );
}

export default TaxDisclaimer;
