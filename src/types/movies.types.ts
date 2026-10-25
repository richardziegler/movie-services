export interface Movie {
  movieId: number;
  imdbId: string;
  title: string;
  overview: string | null;
  productionCompanies: string | null;
  releaseDate: string | null;
  budget: number | null;
  revenue: number | null;
  runtime: number | null;
  language: string | null;
  genres: string | null;
  status: string | null;
}

export interface MovieSummary {
  imdbId: string;
  title: string;
  genres: string | null;
  releaseDate: string | null;
  budget: string;
}

export interface MovieDetails {
  imdbId: string;
  title: string;
  description: string | null;
  releaseDate: string | null;
  budget: string;
  runtime: number | null;
  averageRating: number | null;
  genres: string | null;
  originalLanguage: string | null;
  productionCompanies: string | null;
}

export interface Rating {
  ratingId: number;
  userId: number;
  movieId: number;
  rating: number;
  timestamp: number;
}