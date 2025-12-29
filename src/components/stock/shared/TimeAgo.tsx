import { Typography } from '@mui/material';

function formatTimeAgo(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function TimeAgo({ updatedAt }: { updatedAt: number }) {
  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        opacity: 0.7,
        fontSize: '0.65rem',
        lineHeight: '0.65rem', // match font size for tighter box
        display: 'inline-block', // key: prevents extra line box height
      }}
    >
      {formatTimeAgo(updatedAt)}
    </Typography>
  );
}
