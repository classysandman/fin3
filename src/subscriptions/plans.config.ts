export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export interface PlanConfig {
  type: PlanType;
  level: number;
  monthlyFileLimit: number;
  maxEmployees: number | null;
  fixedPrice: number;
  pricePerEmployee: number;
  overagePricePerFile: number;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    type: PlanType.FREE,
    level: 0,
    monthlyFileLimit: 10,
    maxEmployees: 0,
    fixedPrice: 0,
    pricePerEmployee: 0,
    overagePricePerFile: 0,
  },
  [PlanType.BASIC]: {
    type: PlanType.BASIC,
    level: 1,
    monthlyFileLimit: 100,
    maxEmployees: 10,
    fixedPrice: 0,
    pricePerEmployee: 5,
    overagePricePerFile: 0,
  },
  [PlanType.PREMIUM]: {
    type: PlanType.PREMIUM,
    level: 2,
    monthlyFileLimit: 1000,
    maxEmployees: null,
    fixedPrice: 300,
    pricePerEmployee: 0,
    overagePricePerFile: 0.5,
  },
};