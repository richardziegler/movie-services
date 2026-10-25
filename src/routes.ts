import { Router } from "express";
import * as movies from "./controllers/movies.controller";

const router = Router();

router.get("/movies", (req, res) => {
  if (req.query.year !== undefined) {
    return movies.getMoviesByYear(req, res);
  }

  if (req.query.genre !== undefined) {
    return movies.getMoviesByGenre(req, res);
  }

  return movies.getMovies(req, res);
});

router.get("/movies/:id", movies.getMovieById);


export default router;
