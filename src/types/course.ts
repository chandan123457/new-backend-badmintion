export type CreateCourseInput = {
  name: string;
  courseType: 'COACHING' | 'MEMBERSHIP';
  duration: number;
  monthlyFee: number;
  // Optional details: staff can add a course with just the essentials and fill
  // these in later via edit.
  coachName?: string;
  days?: string;
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
};

export type UpdateCourseInput = CreateCourseInput;
