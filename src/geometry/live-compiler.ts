import { z } from 'zod';
import { compileMasu, masuCompiler, MasuTutorialSchema } from './compiler.js';
import { compileBoat, BoatTutorialSchema } from './boat-compiler.js';
import { boatRecipe } from '../recipes/boat.js';
import { LiveRecipeSchema } from '../shared/live-analysis.js';
export const LiveTutorialSchema = z.union([MasuTutorialSchema, BoatTutorialSchema]);
export const liveCompiler = {
  recipes: [...masuCompiler.recipes, LiveRecipeSchema.parse(boatRecipe)],
  compile(input: unknown) {
    if (typeof input === 'object' && input !== null && 'recipeId' in input && input.recipeId === 'basic-boat') return compileBoat(input);
    return compileMasu(input);
  },
};
