/** Raw-enough shapes for Neptune Apex Local REST. */

export type ApexOutputStatus = [string, string, string, string];

export type ApexInput = {
  did: string;
  name: string;
  type: string;
  value: string;
};

export type ApexOutput = {
  did: string;
  name: string;
  type?: string;
  status: ApexOutputStatus;
};

export type ApexFeed = {
  name?: string;
  time?: number | string;
  active?: number | string;
};

export type ApexStatus = {
  system?: {
    hostname?: string;
    software?: string;
  };
  inputs?: ApexInput[];
  outputs?: ApexOutput[];
  feed?: ApexFeed;
};
