import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "sqlite3";
import { getMoviesDB } from "../../src/connections";
import { getRating } from "../../src/services/ratings";
import { getAllMovies, getMovieById, getMoviesByYear, getMoviesByGenre } from "../../src/services/movies";

vi.mock("../../src/connections", () => ({ getMoviesDB: vi.fn() }));
vi.mock("../../src/services/ratings", () => ({ getRating: vi.fn() }));

const all = vi.fn();
const get = vi.fn();
const summary = {
  imdbId: "tt1234567", title: "Example", genres: "[]",
  releaseDate: "2000-01-01", budget: 1000000,
};
const movie = {
  ...summary, movieId: 1, overview: "A movie", runtime: 90,
  language: "en", productionCompanies: "[]", budget: 0,
  revenue: null, status: "Released",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getMoviesDB).mockResolvedValue({ all, get } as unknown as Database);
  vi.mocked(getRating).mockResolvedValue([]);
  all.mockImplementation((_sql, _params, callback) => callback(null, []));
  get.mockImplementation((_sql, _params, callback) => callback(null, movie));
});

describe("movie lists", () => {
  it("passes the offset and formats numeric, zero, and unknown budgets", async () => {
    all.mockImplementation((_sql, _params, callback) => callback(null, [
      summary, { ...summary, budget: 0 }, { ...summary, budget: null },
    ]));

    expect(await getAllMovies(50)).toEqual([
      { ...summary, budget: "$1,000,000" },
      { ...summary, budget: "$0" },
      { ...summary, budget: "N/A" },
    ]);
    expect(all).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT 50 OFFSET ?"), [50], expect.any(Function),
    );
  });

  it("returns an empty list when there are no matches", async () => {
    expect(await getAllMovies(0)).toEqual([]);
  });

  it.each([
    { order: undefined, expected: "ASC" },
    { order: "DESC" as const, expected: "DESC" },
  ])("filters by year with $expected date order", async ({ order, expected }) => {
    all.mockImplementation((_sql, _params, callback) => callback(null, [summary]));

    expect(await getMoviesByYear(2000, 50, order)).toEqual([{ ...summary, budget: "$1,000,000" }]);
    expect(all).toHaveBeenCalledWith(
      expect.stringContaining(`ORDER BY releaseDate ${expected}`),
      ["2000-01-01", "2000-12-31", 50], expect.any(Function),
    );
  });

  it("trims multiword genres and requests a case-insensitive match", async () => {
    all.mockImplementation((_sql, _params, callback) => callback(null, [summary]));

    expect(await getMoviesByGenre(" science fiction ", 50)).toEqual([{ ...summary, budget: "$1,000,000" }]);
    expect(all).toHaveBeenCalledWith(
      expect.stringContaining("COLLATE NOCASE"), ["science fiction", 50], expect.any(Function),
    );
  });
});

describe("movie details", () => {
  it("maps the required fields, preserves zero budget, and averages ratings", async () => {
    vi.mocked(getRating).mockResolvedValue([3, 3, 4].map((rating, index) => ({
      ratingId: index + 1, userId: index + 1, movieId: 1, rating, timestamp: 0,
    })));

    expect(await getMovieById(1)).toEqual({
      imdbId: movie.imdbId, title: movie.title, description: movie.overview,
      releaseDate: movie.releaseDate, budget: "$0", runtime: movie.runtime,
      averageRating: 3.33, genres: movie.genres, originalLanguage: movie.language,
      productionCompanies: movie.productionCompanies,
    });
    expect(get).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function));
    expect(getRating).toHaveBeenCalledWith(1);
  });

  it("returns a null average for an unrated movie", async () => {
    expect(await getMovieById(1)).toHaveProperty("averageRating", null);
  });

  it("returns null for a missing movie without fetching ratings", async () => {
    get.mockImplementation((_sql, _params, callback) => callback(null, undefined));

    expect(await getMovieById(999)).toBeNull();
    expect(getRating).not.toHaveBeenCalled();
  });

  it("propagates rating lookup errors", async () => {
    const error = new Error("Ratings unavailable");
    vi.mocked(getRating).mockRejectedValue(error);
    await expect(getMovieById(1)).rejects.toBe(error);
  });
});

it("propagates movie database query errors", async () => {
  const error = new Error("Query failed");
  all.mockImplementation((_sql, _params, callback) => callback(error));
  get.mockImplementation((_sql, _params, callback) => callback(error));

  await expect(getAllMovies(0)).rejects.toBe(error);
  await expect(getMovieById(1)).rejects.toBe(error);
});
