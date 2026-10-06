import type { DayAnalysis } from '../types'; import { persistDraft } from '../services/persistence'; export const handler=async(input:DayAnalysis)=>persistDraft(input);
