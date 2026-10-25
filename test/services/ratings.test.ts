import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "sqlite3";
import { getRatingsDB } from "../../src/connections";
import { getRating } from "../../src/services/ratings";

vi.mock("../../src/connections", () => ({ getRatingsDB: vi.fn() }));

const all = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getRatingsDB).mockResolvedValue({ all } as unknown as Database);
});

describe("getRating", () => {
  it("returns ratings for the requested movie", async () => {
    const ratings = [{ ratingId: 1, userId: 2, movieId: 3, rating: 4.5, timestamp: 0 }];
    all.mockImplementation((_sql, _params, callback) => callback(null, ratings));

    expect(await getRating(3)).toEqual(ratings);
    expect(all).toHaveBeenCalledWith(
      expect.stringContaining("WHERE movieId = ?"), [3], expect.any(Function),
    );
  });

  it("returns an empty list when the movie has no ratings", async () => {
    all.mockImplementation((_sql, _params, callback) => callback(null, []));
    expect(await getRating(3)).toEqual([]);
  });

  it("propagates database query errors", async () => {
    const error = new Error("Query failed");
    all.mockImplementation((_sql, _params, callback) => callback(error));
    await expect(getRating(3)).rejects.toBe(error);
  });
});
