'use strict';

import { Rating } from '../types/movies.types';
import { getRatingsDB } from '../connections';

export const getRating = async (movieId: number): Promise<Rating[]> => {
  const query = 'SELECT * FROM ratings WHERE movieId = ?';
  const ratingsDb = await getRatingsDB();

  return new Promise((resolve, reject) => {
    ratingsDb.all(query, [movieId], (err: Error | null, rows: Rating[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};
