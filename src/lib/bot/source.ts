/** Intake contract. Only UploadSource is implemented — no scraping. */

export type RawAd = {
  id?: string;
  sourceType: "paste" | "txt" | "pdf" | "image" | "csv";
  filename?: string;
  text: string;
  unreadable?: boolean;
  unreadableReason?: string;
};

export interface AdSource {
  fetch_ads(): Promise<RawAd[]>;
}

export class UploadSource implements AdSource {
  constructor(private readonly ads: RawAd[]) {}

  async fetch_ads(): Promise<RawAd[]> {
    return this.ads;
  }
}
