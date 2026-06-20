# Scripts

One-off scripts for data migration and setup.

## Exercise Migration

The `migrate-exercises.ts` script migrates exercise data from the free-exercise-db dataset into the database, uploading images to Cloudinary.

### Prerequisites

1. The `free-exercise-db` folder must exist at `api/free-exercise-db/` (already gitignored)
2. Cloudinary environment variables must be set in `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Running the Migration

```bash
# From the api/ directory
npm run migrate:exercises
```

Or directly:
```bash
npx tsx scripts/migrate-exercises.ts
```

### What It Does

1. Clears existing exercise-related data (exercises, muscles, images, alternatives, splits)
2. Creates 17 muscle records (abdominals, biceps, chest, etc.)
3. For each of the ~800 exercises:
   - Creates Exercise record with fields: name, force, level, mechanic, equipment, category, instructions
   - Creates ExerciseMuscle records for primary and secondary muscles
   - Fetches images from GitHub and uploads to Cloudinary
   - Creates ExerciseImage records with URLs
4. Creates a sample split with random exercises

### Source Data

The source data comes from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), an open public domain exercise dataset.

- JSON file: `free-exercise-db/dist/exercises.json`
- Images: Fetched from `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`

### Cleanup

After running the migration, you can safely delete the `free-exercise-db` folder:
```bash
rm -rf free-exercise-db
```

The migration is a one-time operation. The source data is not needed at runtime.
