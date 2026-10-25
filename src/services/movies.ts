"use strict";

import { getMoviesDB } from "../connections";
import { getRating } from "./ratings";
import { Movie, MovieDetails, MovieSummary } from "../types/movies.types";

type MovieSummaryRow = Pick<Movie, "imdbId" | "title" | "genres" | "releaseDate" | "budget">;

export const getAllMovies = async (offset: number): Promise<MovieSummary[]> => {
  const query = "SELECT imdbId, title, genres, releaseDate, budget FROM movies ORDER BY movieId LIMIT 50 OFFSET ?;";

  const db = await getMoviesDB();

  const rows = await new Promise<MovieSummaryRow[]>((resolve, reject) => {
    db.all(query, [offset], (err: Error | null, rows: MovieSummaryRow[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });

  return rows.map(row => ({ ...row, budget: formatBudgetUSD(row.budget) }));
};

export const getMovieById = async (id: number): Promise<MovieDetails | null> => {
  const query = "SELECT * FROM movies WHERE movieId = ?;";
  const db = await getMoviesDB();
  const movieDbData = await new Promise<Movie | null>((resolve, reject) => {
    db.get(query, [id], (err: Error | null, row: Movie) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });

  if (!movieDbData) {
    return null;
  }

  const ratingsDbData = await getRating(movieDbData.movieId);
  const averageRating = ratingsDbData.length > 0 ? parseFloat((ratingsDbData.reduce((sum, rating) => sum + rating.rating, 0) / ratingsDbData.length).toFixed(2)) : null;

  return {
    imdbId: movieDbData.imdbId,
    title: movieDbData.title,
    description: movieDbData.overview,
    releaseDate: movieDbData.releaseDate,
    budget: formatBudgetUSD(movieDbData.budget),
    runtime: movieDbData.runtime,
    averageRating: averageRating,
    genres: movieDbData.genres,
    originalLanguage: movieDbData.language,
    productionCompanies: movieDbData.productionCompanies,
  };
};

export const getMoviesByYear = async (year: number, offset: number, order: "ASC" | "DESC" = "ASC"): Promise<MovieSummary[]> => {
  const query = `SELECT imdbId, title, genres, releaseDate, budget FROM movies WHERE releaseDate BETWEEN ? AND ? ORDER BY releaseDate ${order} LIMIT 50 OFFSET ?;`;
  const db = await getMoviesDB();

  const rows = await new Promise<MovieSummaryRow[]>((resolve, reject) => {
    db.all(query, [`${year}-01-01`, `${year}-12-31`, offset], (err: Error | null, rows: MovieSummaryRow[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });

  return rows.map(row => ({ ...row, budget: formatBudgetUSD(row.budget) }));
};

export const getMoviesByGenre = async (genre: string, offset: number): Promise<MovieSummary[]> => {
  const query = `SELECT imdbId, title, genres, releaseDate, budget FROM movies WHERE EXISTS (SELECT 1 FROM json_each(genres) WHERE json_extract(value, '$.name') = ? COLLATE NOCASE) LIMIT 50 OFFSET ?;`;
  const db = await getMoviesDB();

  const rows = await new Promise<MovieSummaryRow[]>((resolve, reject) => {
    db.all(query, [genre.trim(), offset], (err: Error | null, rows: MovieSummaryRow[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });

  return rows.map(row => ({ ...row, budget: formatBudgetUSD(row.budget) }));
};

function formatBudgetUSD(budget: number | null): string {
  if (budget === null) {
    return "N/A";
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(budget);
};
