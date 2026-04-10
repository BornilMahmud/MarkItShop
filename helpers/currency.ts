export const SHIPPING_CHARGE_BDT = 130;

export const formatBDT = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};
