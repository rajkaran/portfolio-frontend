import { Autocomplete, Chip, TextField, createFilterOptions } from '@mui/material';

const filter = createFilterOptions<string>();

export function IndustryTagsInput({
  value,
  onChange,
  allTags,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
}) {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={allTags}
      value={value}
      onChange={(_, newValue) => {
        // newValue can contain strings or "Add X" objects — normalize to strings
        const normalized = newValue.map((v) =>
          typeof v === 'string' ? v.trim() : v,
        ).filter(Boolean);
        onChange([...new Set(normalized)]);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const input = params.inputValue.trim();
        if (input && !options.includes(input)) {
          filtered.push(input);
        }
        return filtered;
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            size="small"
            label={option}
            {...getTagProps({ index })}
            key={option}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Industry Tags"
          placeholder={value.length ? '' : 'Add tags...'}
        />
      )}
    />
  );
}