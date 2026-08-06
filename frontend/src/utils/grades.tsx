export type GradeEntry = { id: number; name: string; score: number; max_score: number };
export type GradeComponent = { id: number; name: string; weight: string; entries: GradeEntry[] };
export type Course = { id: number; name: string; units: number; grade_components: GradeComponent[] };

export function convertPercentageToGrade(percentage: number): number {
  if (percentage >= 97) return 1.0;
  if (percentage >= 94) return 1.25;
  if (percentage >= 91) return 1.5;
  if (percentage >= 88) return 1.75;
  if (percentage >= 85) return 2.0;
  if (percentage >= 82) return 2.25;
  if (percentage >= 79) return 2.5;
  if (percentage >= 76) return 2.75;
  if (percentage >= 73) return 3.0;
  if (percentage >= 60) return 4.0;
  return 5.0;
}

export function componentPercentage(component: GradeComponent): number {
  const totalScore = component.entries.reduce((sum, e) => sum + e.score, 0);
  const totalMax = component.entries.reduce((sum, e) => sum + e.max_score, 0);
  return totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
}

export function courseFinalPercentage(course: Course): number {
  const components = course.grade_components;
  const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = components.reduce(
    (sum, c) => sum + componentPercentage(c) * parseFloat(c.weight),
    0
  );
  return weightedSum / totalWeight;
}

export function gwa(courses: Course[]): number {
  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  if (totalUnits === 0) return 0;
  const weighted = courses.reduce(
    (sum, c) => sum + convertPercentageToGrade(courseFinalPercentage(c)) * c.units,
    0
  );
  return weighted / totalUnits;
}