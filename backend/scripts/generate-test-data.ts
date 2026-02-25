
import { PrismaClient, Role, ResourceType, ArticleCategory, CourseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    const hashedPw = await bcrypt.hash('TestPassword123!', 10);

    // 1. Clean up existing data (optional, careful in prod)
    // await prisma.transaction([ ... ]) - Skipping for now to avoid accidental data loss if not intended

    // 2. Create Users
    console.log('Creating users...');
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@example.com' },
        update: {},
        create: {
            email: 'teacher@example.com',
            password: hashedPw,
            role: Role.TEACHER,
            teacherProfile: {
                create: {
                    bio: 'Senior Science Teacher',
                    officeHours: 'Mon-Fri 9AM-5PM'
                }
            }
        }
    });

    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            password: 'hashed_password_123',
            role: Role.STUDENT,
            studentProfile: {
                create: {
                    bio: 'Eager learner',
                    learningGoals: ['Physics', 'Math']
                }
            }
        }
    });

    // 3. Create Shared Resources (YouTube Videos)
    console.log('Creating shared resources...');
    const video1 = await prisma.externalResource.create({
        data: {
            type: ResourceType.YOUTUBE,
            url: 'https://youtube.com/watch?v=video1',
            title: 'Intro to Quantum Physics',
            description: 'Basics of Quantum Mechanics',
            teacherId: teacher.id
        }
    });

    const video2 = await prisma.externalResource.create({
        data: {
            type: ResourceType.YOUTUBE,
            url: 'https://youtube.com/watch?v=video2',
            title: 'Advanced Calculus',
            description: 'Derivatives and Integrals',
            teacherId: teacher.id
        }
    });

    // 4. Create Independent Lessons
    console.log('Creating independent lessons...');
    const indepLesson1 = await prisma.lesson.create({
        data: {
            title: 'Independent Physics Lesson',
            content: 'Content for independent lesson 1',
            description: 'A standalone lesson about Physics concepts',
            status: 'public',
            teacherId: teacher.id,
            externalResources: {
                connect: [{ id: video1.id }]
            }
        }
    });

    const indepLesson2 = await prisma.lesson.create({
        data: {
            title: 'Independent Math Lesson',
            content: 'Content for independent lesson 2',
            status: 'public',
            teacherId: teacher.id
        }
    });

    const indepLesson3 = await prisma.lesson.create({
        data: {
            title: 'Independent History Lesson',
            content: 'Content for independent lesson 3',
            status: 'private',
            teacherId: teacher.id
        }
    });


    // 5. Create Courses with Lessons
    console.log('Creating courses...');
    const course1 = await prisma.course.create({
        data: {
            title: 'Complete Physics Course',
            slug: 'complete-physics-course',
            description: 'A comprehensive guide to Physics',
            level: CourseLevel.INTERMEDIATE,
            teacherId: teacher.id,
            published: true,
            lessons: {
                create: [
                    {
                        title: 'Physics Chapter 1',
                        content: 'Chapter 1 content',
                        order: 1,
                        teacherId: teacher.id,
                        status: 'public'
                    },
                    {
                        title: 'Physics Chapter 2',
                        content: 'Chapter 2 content',
                        order: 2,
                        teacherId: teacher.id,
                        status: 'public'
                    }
                ]
            },
            externalResources: {
                connect: [{ id: video1.id }] // Shared video
            }
        },
        include: {
            lessons: true
        }
    });

    const course2 = await prisma.course.create({
        data: {
            title: 'Calculus Mastery',
            slug: 'calculus-mastery',
            description: 'Master Calculus in 30 days',
            level: CourseLevel.ADVANCED,
            teacherId: teacher.id,
            published: true,
            lessons: {
                create: [
                    {
                        title: 'Limits',
                        content: 'Introduction to Limits',
                        order: 1,
                        teacherId: teacher.id,
                        status: 'public'
                    },
                    {
                        title: 'Derivatives',
                        content: 'Introduction to Derivatives',
                        order: 2,
                        teacherId: teacher.id,
                        status: 'public'
                    },
                    {
                        title: 'Integrals',
                        content: 'Introduction to Integrals',
                        order: 3,
                        teacherId: teacher.id,
                        status: 'public'
                    }
                ]
            },
            externalResources: {
                connect: [{ id: video2.id }]
            }
        },
        include: {
            lessons: true
        }
    });

    // 6. Create Articles with Resources
    console.log('Creating articles...');
    const article1 = await prisma.article.create({
        data: {
            title: 'The Future of Physics',
            slug: 'future-of-physics',
            content: 'Article content about physics...',
            category: ArticleCategory.SCIENCE,
            authorId: teacher.id,
            published: true,
            externalResources: {
                connect: [{ id: video1.id }] // Shared video
            }
        }
    });

    const article2 = await prisma.article.create({
        data: {
            title: 'Mathematics in Nature',
            slug: 'mathematics-in-nature',
            content: 'Article content about math...',
            category: ArticleCategory.MATH,
            authorId: teacher.id,
            published: true,
            externalResources: {
                connect: [{ id: video2.id }] // Shared video
            }
        }
    });

    const article3 = await prisma.article.create({
        data: {
            title: 'History of Science',
            slug: 'history-of-science',
            content: 'Article content about history...',
            category: ArticleCategory.HISTORY,
            authorId: teacher.id,
            published: true
        }
    });


    // 7. Create Flashcards
    console.log('Creating flashcards...');
    await prisma.flashcard.create({
        data: {
            question: 'What is a photon?',
            answer: 'A particle representing a quantum of light.',
            teacherId: teacher.id,
            lessonId: indepLesson1.id // Linked to independent lesson
        }
    });

    await prisma.flashcard.create({
        data: {
            question: 'What is the derivative of x^2?',
            answer: '2x',
            teacherId: teacher.id,
            lessonId: course2.lessons[1].id // Linked to course lesson (Derivatives)
        }
    });

    await prisma.flashcard.create({
        data: {
            question: 'Independent Flashcard 1',
            answer: 'Answer 1',
            teacherId: teacher.id
        }
    });
    await prisma.flashcard.create({
        data: {
            question: 'Independent Flashcard 2',
            answer: 'Answer 2',
            teacherId: teacher.id
        }
    });
    await prisma.flashcard.create({
        data: {
            question: 'Independent Flashcard 3',
            answer: 'Answer 3',
            teacherId: teacher.id
        }
    });


    // 8. Validation Checks
    console.log('\n🔍 Running Validation Checks...');

    // Check 1: Courses must have at least 1 lesson
    const coursesWithoutLessons = await prisma.course.findMany({
        where: {
            lessons: {
                none: {}
            }
        }
    });
    if (coursesWithoutLessons.length > 0) {
        console.error('❌ Validation Failed: Found courses without lessons:', coursesWithoutLessons.map(c => c.title));
    } else {
        console.log('✅ Validation Passed: All courses have lessons.');
    }

    // Check 2: Independent lessons exist
    const independentLessonsCount = await prisma.lesson.count({
        where: {
            courseId: null
        }
    });
    if (independentLessonsCount >= 3) {
        console.log(`✅ Validation Passed: Found ${independentLessonsCount} independent lessons.`);
    } else {
        console.warn(`⚠️ Validation Warning: Expected at least 3 independent lessons, found ${independentLessonsCount}.`);
    }

    // Check 3: Many-to-Many Video Relations
    const video1WithRelations = await prisma.externalResource.findUnique({
        where: { id: video1.id },
        include: {
            courses: true,
            lessons: true,
            articles: true
        }
    });

    if (video1WithRelations?.courses.length && video1WithRelations?.lessons.length && video1WithRelations?.articles.length) {
        console.log('✅ Validation Passed: Video 1 is correctly linked to Course, Lesson, and Article.');
    } else {
        console.log('ℹ️ Info: Video 1 relations:', {
            courses: video1WithRelations?.courses.length,
            lessons: video1WithRelations?.lessons.length,
            articles: video1WithRelations?.articles.length
        });
    }

    // Check 4: Flashcards linked vs independent
    const linkedFlashcards = await prisma.flashcard.count({ where: { lessonId: { not: null } } });
    const independentFlashcards = await prisma.flashcard.count({ where: { lessonId: null } });

    console.log(`✅ Flashcard Stats: ${linkedFlashcards} linked, ${independentFlashcards} independent.`);

    console.log('\n🎉 Test Data Generation Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
