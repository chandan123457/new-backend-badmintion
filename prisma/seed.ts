import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCourses = [
  {
    name: 'Starter Coaching Batch',
    courseType: 'COACHING' as const,
    coachName: 'Coach Rishi',
    days: 'Mon / Wed / Fri',
    startTime: '06:00 AM',
    endTime: '07:30 AM',
    duration: 3,
    monthlyFee: 2500,
    maxCapacity: 20,
    enrolled: 0
  },
  {
    name: 'Evening Performance Coaching',
    courseType: 'COACHING' as const,
    coachName: 'Coach Anand',
    days: 'Tue / Thu / Sat',
    startTime: '06:00 PM',
    endTime: '08:00 PM',
    duration: 4,
    monthlyFee: 3200,
    maxCapacity: 16,
    enrolled: 0
  },
  {
    name: 'Monthly Court Membership',
    courseType: 'MEMBERSHIP' as const,
    coachName: 'Front Desk',
    days: 'All Days',
    startTime: '05:00 AM',
    endTime: '10:00 PM',
    duration: 1,
    monthlyFee: 1800,
    maxCapacity: 50,
    enrolled: 0
  },
  {
    name: 'Quarterly Premium Membership',
    courseType: 'MEMBERSHIP' as const,
    coachName: 'Front Desk',
    days: 'All Days',
    startTime: '05:00 AM',
    endTime: '10:00 PM',
    duration: 3,
    monthlyFee: 4500,
    maxCapacity: 50,
    enrolled: 0
  }
];

async function main() {
  for (const course of defaultCourses) {
    const existingCourse = await prisma.course.findFirst({
      where: {
        name: course.name,
        courseType: course.courseType
      }
    });

    if (!existingCourse) {
      await prisma.course.create({
        data: course
      });
    }
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
