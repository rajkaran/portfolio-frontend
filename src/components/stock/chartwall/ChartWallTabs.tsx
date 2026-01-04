import { Tabs, Tab } from '@mui/material';

export function ChartWallTabs(props: {
  count: number;
  active: number;
  onChange: (idx: number) => void;
}) {
  if (props.count <= 1) return null;

  return (
    <Tabs
      value={props.active}
      onChange={(_, v) => props.onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 1 }}
    >
      {Array.from({ length: props.count }).map((_, i) => (
        <Tab key={i} label={`Tab ${i + 1}`} />
      ))}
    </Tabs>
  );
}
