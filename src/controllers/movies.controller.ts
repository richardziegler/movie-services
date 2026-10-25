import { Request, Response } from "express";
import * as movieService from "../services/movies";

export const getMovies = async (req: Request, res: Response) => {
  const pageQuery = req.query.page;
  const page = Number(pageQuery ?? 1);
  const offset = (page - 1) * 50;
  if (
    (pageQuery !== undefined && typeof pageQuery !== "string") ||
    !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(offset)
  ) {
    res.status(400).json({ error: "page must be a positive integer within the supported range" });
    return;
  }

  const movies = await movieService.getAllMovies(offset);
  res.json(movies);
};

export const getMovieById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const movieId = Number(id);
    if (typeof id !== "string" || !Number.isSafeInteger(movieId) || movieId < 1) {
      res.status(400).json({ error: "id must be a positive integer" });
      return;
    }
    const movie = await movieService.getMovieById(movieId);
    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }
    res.json(movie);
  } catch (error) {
    console.error("Failed to get movie details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMoviesByYear = async (req: Request, res: Response) => {
  const pageQuery = req.query.page;
  const page = Number(pageQuery ?? 1);
  const offset = (page - 1) * 50;
  if (
    (pageQuery !== undefined && typeof pageQuery !== "string") ||
    !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(offset)
  ) {
    res.status(400).json({ error: "page must be a positive integer within the supported range" });
    return;
  }

  try {
    const { year } = req.query;
    if (typeof year !== "string" || !/^[1-9]\d{3}$/.test(year)) {
      res.status(400).json({ error: "year must be a four-digit year" });
      return;
    }
    const order = req.query.order ?? "ASC";
    if (order !== "ASC" && order !== "DESC") {
      res.status(400).json({ error: "order must be ASC or DESC" });
      return;
    }
    const movies = await movieService.getMoviesByYear(Number(year), offset, order);
    if (movies.length === 0) {
      res.status(404).json({ error: "No movies found for the specified year" });
      return;
    }
    res.json(movies);
  } catch (error) {
    console.error("Failed to get movies by year:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMoviesByGenre = async (req: Request, res: Response) => {
  const pageQuery = req.query.page;
  const page = Number(pageQuery ?? 1);
  const offset = (page - 1) * 50;
  if (
    (pageQuery !== undefined && typeof pageQuery !== "string") ||
    !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(offset)
  ) {
    res.status(400).json({ error: "page must be a positive integer within the supported range" });
    return;
  }

  try {
    const { genre } = req.query;
    if (typeof genre !== "string" || genre.trim() === "") {
      res.status(400).json({ error: "genre must be a non-empty string" });
      return;
    }
    const movies = await movieService.getMoviesByGenre(genre, offset);
    if (movies.length === 0) {
      res.status(404).json({ error: "No movies found for the specified genre" });
      return;
    }
    res.json(movies);
  } catch (error) {
    console.error("Failed to get movies by genre:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

