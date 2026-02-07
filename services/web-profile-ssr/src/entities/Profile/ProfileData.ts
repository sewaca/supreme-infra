type UserBenefit = {
  value: string;
  notifications?: number;
};

export type ProfileData = {
  name: string;
  lastName: string;
  middleName?: string;

  avatar: string;

  scholarship?: UserBenefit;
  dormitory?: UserBenefit;
};
