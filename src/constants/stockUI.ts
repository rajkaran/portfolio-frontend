export type ThresholdKey = 'thresholdGreen' | 'thresholdCyan' | 'thresholdOrange' | 'thresholdRed';

export const THRESHOLD_COLORS: Record<ThresholdKey, string> = {
  thresholdGreen: '#2e7d32',
  thresholdCyan: '#00acc1',
  thresholdOrange: '#fb8c00',
  thresholdRed: '#e53935',
};

export function getThresholdColor(key: ThresholdKey): string {
  return THRESHOLD_COLORS[key];
}

export function isThresholdKey(k: string): k is ThresholdKey {
  return (
    k === 'thresholdGreen' ||
    k === 'thresholdCyan' ||
    k === 'thresholdOrange' ||
    k === 'thresholdRed'
  );
}

// Optional: consistent label side logic for your alternating labels
export function labelSide(key: ThresholdKey): 'left' | 'right' {
  switch (key) {
    case 'thresholdGreen':
    case 'thresholdOrange':
      return 'left';
    case 'thresholdCyan':
    case 'thresholdRed':
      return 'right';
  }
}
