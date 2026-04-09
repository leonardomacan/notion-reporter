import { getCompletedTaskCutoffDate } from "./dateFilter";

describe("getCompletedTaskCutoffDate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-09T12:00:00.000Z").getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a date 7 days ago when env var is undefined", () => {
    const cutoff = getCompletedTaskCutoffDate(undefined);
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("returns a date N days ago when env var is a valid positive integer", () => {
    const cutoff = getCompletedTaskCutoffDate("14");
    const expected = new Date("2026-03-26T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is zero", () => {
    const cutoff = getCompletedTaskCutoffDate("0");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is negative", () => {
    const cutoff = getCompletedTaskCutoffDate("-3");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is not a number", () => {
    const cutoff = getCompletedTaskCutoffDate("abc");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it("falls back to 7 days when env var is a float", () => {
    const cutoff = getCompletedTaskCutoffDate("3.5");
    const expected = new Date("2026-04-02T12:00:00.000Z");
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });
});
