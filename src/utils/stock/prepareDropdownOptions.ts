import type { BrokerAccountDTO } from '../../types/stock/broker-account.types';
import type { KeyValueMap } from '../../types/stock/key-value-pairs.types';
import type { StockExchangeDTO } from '../../types/stock/stock-exchange.types';

export type DropdownItem = {
  value: string;
  label: string;
};

export function mapRecordToDropdownItems(
  record: Record<string, string> | undefined,
): DropdownItem[] {
  if (!record) return [];

  return Object.entries(record).map(([value, label]) => ({
    value,
    label,
  }));
}

export function getKeyValueDropdownItems(
  keyValuePairs: KeyValueMap | undefined,
  key: string,
): DropdownItem[] {
  return mapRecordToDropdownItems(keyValuePairs?.[key]);
}

export function getStockClassItems(keyValuePairs: KeyValueMap | undefined): DropdownItem[] {
  return getKeyValueDropdownItems(keyValuePairs, 'stockClass');
}

export function getBucketItems(keyValuePairs: KeyValueMap | undefined): DropdownItem[] {
  return getKeyValueDropdownItems(keyValuePairs, 'bucket');
}

export function formatBrokerAccountLabel(account: BrokerAccountDTO): string {
  const broker = account.broker?.trim();
  const name = account.name?.trim();

  if (broker && name) return `${broker} - ${name}`;
  return broker || name || account.id;
}

export function getBrokerItems(brokerAccounts: BrokerAccountDTO[] | undefined): DropdownItem[] {
  if (!brokerAccounts?.length) return [];

  return brokerAccounts.map((account) => ({
    value: account.id,
    label: formatBrokerAccountLabel(account),
  }));
}

export function getBrokerLabels(
  brokerAccounts: BrokerAccountDTO[] | undefined,
): Record<string, string> {
  if (!brokerAccounts?.length) return {};

  const labels: Record<string, string> = {};

  for (const account of brokerAccounts) {
    labels[account.id] = formatBrokerAccountLabel(account);
  }

  return labels;
}

export function getMarketItemsFromExchanges(
  exchanges: StockExchangeDTO[] | undefined,
): DropdownItem[] {
  if (!exchanges?.length) return [];

  const seen = new Set<string>();
  const items: DropdownItem[] = [];

  for (const exchange of exchanges) {
    const country = exchange.country?.trim();
    const value = country?.toLowerCase();

    if (!country || !value || seen.has(value)) continue;

    seen.add(value);
    items.push({
      value,
      label: country,
    });
  }

  items.sort((a, b) => a.label.localeCompare(b.label));
  return items;
}

export function getPreferredDropdownValue(items: DropdownItem[], preferredValue: string): string {
  const preferred = items.find((item) => item.value === preferredValue);
  return preferred?.value ?? items[0]?.value ?? '';
}

export function getPreferredDropdownValueByLabel(
  items: DropdownItem[],
  preferredLabel: string,
): string {
  const preferred = items.find((item) => item.label === preferredLabel);
  return preferred?.value ?? items[0]?.value ?? '';
}

export function getFirstDropdownValue(items: DropdownItem[]): string {
  return items[0]?.value ?? '';
}

export function getDefaultMarketValue(items: DropdownItem[]): string {
  return getPreferredDropdownValue(items, 'canada');
}

export function getDefaultStockClassValue(items: DropdownItem[]): string {
  return getPreferredDropdownValue(items, 'trade');
}

export function getDefaultBucketValues(items: DropdownItem[]): string[] {
  const value = getPreferredDropdownValue(items, 'core');
  return value ? [value] : [];
}

export function getDefaultBrokerAccountId(items: DropdownItem[]): string {
  return getPreferredDropdownValueByLabel(items, 'Wealthsimple - Non-registered');
}
