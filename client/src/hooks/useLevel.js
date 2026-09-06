// useLevel — ready-to-render level info for the current user.
import { levelProgress } from '../utils/expCalculator';

export function useLevel(user) {
  if (!user) return null;
  return levelProgress(user);
}
