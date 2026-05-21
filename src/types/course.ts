export type CreateCourseInput = {
  name: string;
  courseType: 'COACHING' | 'MEMBERSHIP';
  coachName: string;
  days: string;
  startTime: string;
  endTime: string;
  duration: number;
  monthlyFee: number;
  maxCapacity: number;
};
