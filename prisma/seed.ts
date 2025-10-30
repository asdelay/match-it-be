import { PrismaClient, User } from '../generated/prisma/client';
const prisma = new PrismaClient();

function getRandomJobTitle() {
  const jobs = [
    'Software Engineer',
    'Product Manager',
    'UI/UX Designer',
    'Data Analyst',
    'DevOps Engineer',
    'QA Tester',
    'Project Coordinator',
    'Backend Developer',
    'Frontend Developer',
    'Marketing Specialist',
  ];
  return jobs[Math.floor(Math.random() * jobs.length)];
}

function getRandomPhoneNumber() {
  const prefix = '+32';
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000); // Belgian-like number
  return `${prefix}${randomDigits}`;
}

function getRandomName() {
  const firstNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Ethan',
    'Fiona',
    'George',
    'Hannah',
    'Ivan',
    'Julia',
    'Kevin',
    'Laura',
    'Mike',
    'Nina',
    'Oscar',
    'Paula',
    'Quentin',
    'Rachel',
    'Steve',
    'Tina',
  ];

  const lastNames = [
    'Smith',
    'Johnson',
    'Brown',
    'Taylor',
    'Anderson',
    'Thomas',
    'Jackson',
    'White',
    'Harris',
    'Martin',
    'Thompson',
    'Garcia',
    'Martinez',
    'Robinson',
    'Clark',
    'Rodriguez',
    'Lewis',
    'Lee',
    'Walker',
    'Hall',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

async function main() {
  // Optional base user (Alice)
  await prisma.user.upsert({
    where: { email: 'alice@prisma.io' },
    update: {},
    create: {
      email: 'alice@prisma.io',
      fullName: 'Alice Example',
      hashedPassword: 'testksdlfskjflsdkl',
      phoneNumber: '+32123123123',
      jobTitle: 'Software Engineer',
    },
  });

  const usersToCreate: {
    email: string;
    fullName: string;
    hashedPassword: string;
    phoneNumber: string;
    jobTitle: string;
  }[] = [];

  for (let i = 1; i <= 50; i++) {
    const fullName = getRandomName();
    const email = `${fullName.toLowerCase().replace(/\s/g, '')}${i}@example.com`;
    const jobTitle = getRandomJobTitle();
    const phoneNumber = getRandomPhoneNumber();

    usersToCreate.push({
      email,
      fullName,
      hashedPassword: 'hashedpassword123',
      phoneNumber,
      jobTitle,
    });
  }

  await prisma.user.createMany({
    data: usersToCreate,
    skipDuplicates: true,
  });

  console.log('✅ Seeded 50 random users successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
