import type { PreparedRequest } from '../types'; import { runDirectAnalysis } from '../services/analyze'; export const handler=async(input:PreparedRequest)=>runDirectAnalysis(input);
