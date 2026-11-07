import { afterEach, describe, expect, it } from "vitest";
import { absoluteAppUrl, getAppBaseUrl } from "@/lib/app-url";

const ORIGINAL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL;
});

describe("app-url", () => {
  it("keeps https production URLs absolute for SMS auto-link", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    expect(getAppBaseUrl()).toBe("https://kazi-check.rumptycloud.app");
    expect(absoluteAppUrl(`/checks/abc`)).toBe(
      "https://kazi-check.rumptycloud.app/checks/abc",
    );
  });

  it("adds https when the host has no scheme", () => {
    process.env.NEXT_PUBLIC_APP_URL = "kazi-check.rumptycloud.app/";
    expect(getAppBaseUrl()).toBe("https://kazi-check.rumptycloud.app");
  });

  it("keeps localhost on http", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });
});
