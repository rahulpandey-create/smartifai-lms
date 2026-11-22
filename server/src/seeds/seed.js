const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const { connectDB, disconnectDB } = require("../config/db");
const config = require("../config/env");
const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const LessonProgress = require("../models/LessonProgress");
const AnalyticsEvent = require("../models/AnalyticsEvent");

const now = new Date();
const ago = (days, hour = 10, minute = 0) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
};

const courseDefinitions = [
  {
    slug: "web-development-foundations",
    title: "Web Development Foundations",
    description:
      "Understand how the web works and build a strong foundation in HTML, CSS, and JavaScript.",
    category: "Web Development",
    level: "Beginner",
    estimatedMinutes: 35,
    lessons: [
      {
        title: "How the Web Works",
        estimatedMinutes: 8,
        content:
          "The web is a network of clients and servers. A browser is a client: it sends an HTTP request for a resource, and a web server returns an HTTP response. DNS translates a human-readable domain into an IP address. HTTPS protects data in transit using TLS. HTML describes document structure, CSS controls presentation, and JavaScript adds behavior. A page may request additional assets such as stylesheets, scripts, images, and fonts after the initial HTML response.",
      },
      {
        title: "HTML: Structure and Semantics",
        estimatedMinutes: 12,
        content:
          "HTML uses elements to describe the meaning and structure of a document. Headings organize content into a hierarchy, paragraphs contain text, and links connect resources. Semantic elements such as header, nav, main, article, and footer communicate the purpose of page regions. Forms use labels associated with inputs so people and assistive technology can understand each field. Use buttons for actions and links for navigation. A valid document has one clear main content region and a meaningful title.",
      },
      {
        title: "CSS and the Box Model",
        estimatedMinutes: 15,
        content:
          "CSS controls how HTML elements are displayed. Every element is laid out using the box model: content, padding, border, and margin. The box-sizing property changes how declared width and height are calculated; border-box includes padding and border in the declared size. Flexbox is useful for arranging items along one axis, while CSS Grid handles rows and columns. Responsive layouts use flexible sizing and media queries to adapt to different viewport widths. Keep text contrast readable and provide visible keyboard focus styles.",
      },
    ],
  },
  {
    slug: "react-application-basics",
    title: "React Application Basics",
    description:
      "Learn components, state, effects, and practical patterns for building interactive React interfaces.",
    category: "Frontend Engineering",
    level: "Beginner",
    estimatedMinutes: 40,
    lessons: [
      {
        title: "Components and JSX",
        estimatedMinutes: 10,
        content:
          "A React component is a reusable unit of interface. Function components receive inputs through props and return JSX, a syntax extension that describes the UI. Component names begin with a capital letter. Keep components focused on one responsibility and compose larger interfaces from smaller parts. Lists should use stable keys so React can match items between renders. JSX expressions use curly braces to include JavaScript values, while attributes use names such as className and htmlFor.",
      },
      {
        title: "State and User Interaction",
        estimatedMinutes: 15,
        content:
          "State stores values that change over time and affect what a component renders. The useState Hook returns the current value and a setter. Calling the setter requests a new render; do not mutate objects or arrays already in state. Derive values from existing state when possible rather than storing duplicate data. Event handlers are functions passed to elements such as buttons. Controlled form inputs receive their value from state and update it through onChange handlers.",
      },
      {
        title: "Effects and Data Fetching",
        estimatedMinutes: 15,
        content:
          "The useEffect Hook synchronizes a component with an external system after rendering. Its dependency array identifies reactive values used by the effect. Return a cleanup function to cancel subscriptions, timers, or requests when dependencies change or the component unmounts. For data fetching, use AbortController to avoid updating state after a request is no longer needed. Effects should not be used for values that can be calculated during render or for ordinary user actions that belong in event handlers.",
      },
    ],
  },
];

const studentDefinitions = [
  {
    name: "Maya Chen",
    email: "maya.student@example.test",
    courseSlug: courseDefinitions[0].slug,
    enrollDays: 12,
    signupDays: 18,
    source: ["google", "organic"],
    outcome: "complete",
  },
  {
    name: "Noah Reed",
    email: "noah.student@example.test",
    courseSlug: courseDefinitions[0].slug,
    enrollDays: 10,
    signupDays: 16,
    source: ["direct", "none"],
    outcome: "no-start",
  },
  {
    name: "Ava Stone",
    email: "ava.student@example.test",
    courseSlug: courseDefinitions[0].slug,
    enrollDays: 8,
    signupDays: 14,
    source: ["newsletter", "email"],
    outcome: "started",
  },
  {
    name: "Liam Patel",
    email: "liam.student@example.test",
    courseSlug: courseDefinitions[1].slug,
    enrollDays: 7,
    signupDays: 13,
    source: ["github.com", "referral"],
    outcome: "partial",
  },
  {
    name: "Zoe Kim",
    email: "zoe.student@example.test",
    courseSlug: courseDefinitions[1].slug,
    enrollDays: 9,
    signupDays: 15,
    source: ["google", "organic"],
    outcome: "complete",
  },
  {
    name: "Ethan Cole",
    email: "ethan.student@example.test",
    courseSlug: courseDefinitions[1].slug,
    enrollDays: 5,
    signupDays: 11,
    source: ["direct", "none"],
    outcome: "no-start",
  },
];

function makeEvent({
  name,
  actorId,
  sessionId,
  date,
  source = null,
  medium = null,
  courseId = null,
  lessonId = null,
  enrollmentId = null,
  pagePath = null,
}) {
  return {
    eventId: `demo-${crypto.randomUUID()}`,
    eventName: name,
    occurredAt: date,
    receivedAt: new Date(),
    actorId,
    sessionId,
    pagePath,
    source,
    medium,
    courseId,
    lessonId,
    enrollmentId,
    properties: {},
    isDemo: true,
  };
}

async function seed() {
  if (!config.admin.name || !config.admin.email || !config.admin.password) {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env before running npm run seed."
    );
  }

  await connectDB();

  // Only clear records explicitly marked synthetic. Never delete live student records.
  await Promise.all([
    AnalyticsEvent.deleteMany({ isDemo: true }),
    LessonProgress.deleteMany({ isDemo: true }),
    Enrollment.deleteMany({ isDemo: true }),
    User.deleteMany({ isDemo: true }),
  ]);

  const adminHash = await bcrypt.hash(
    config.admin.password,
    config.bcryptSaltRounds
  );
  await User.findOneAndUpdate(
    { email: config.admin.email.toLowerCase() },
    {
      $set: {
        name: config.admin.name,
        email: config.admin.email.toLowerCase(),
        passwordHash: adminHash,
        role: "admin",
        isDemo: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const courses = new Map();
  const lessonsByCourse = new Map();
  for (const definition of courseDefinitions) {
    const course = await Course.findOneAndUpdate(
      { slug: definition.slug },
      {
        $set: {
          title: definition.title,
          description: definition.description,
          category: definition.category,
          level: definition.level,
          estimatedMinutes: definition.estimatedMinutes,
          isPublished: true,
          isDemo: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    courses.set(definition.slug, course);
    const courseLessons = [];
    for (let index = 0; index < definition.lessons.length; index += 1) {
      const lessonDefinition = definition.lessons[index];
      const lesson = await Lesson.findOneAndUpdate(
        { course: course._id, order: index + 1 },
        {
          $set: {
            title: lessonDefinition.title,
            content: lessonDefinition.content,
            estimatedMinutes: lessonDefinition.estimatedMinutes,
            isDemo: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      courseLessons.push(lesson);
    }
    lessonsByCourse.set(definition.slug, courseLessons);
  }

  const demoPasswordHash = await bcrypt.hash(
    "LearnLoopDemo!2026",
    config.bcryptSaltRounds
  );
  const syntheticEvents = [];
  for (let index = 0; index < studentDefinitions.length; index += 1) {
    const definition = studentDefinitions[index];
    const signupAt = ago(definition.signupDays, 8 + (index % 3));
    const enrolledAt = ago(definition.enrollDays, 9 + (index % 3));
    const user = await User.create({
      name: definition.name,
      email: definition.email,
      passwordHash: demoPasswordHash,
      role: "student",
      isDemo: true,
      createdAt: signupAt,
      updatedAt: signupAt,
    });
    const course = courses.get(definition.courseSlug);
    const lessons = lessonsByCourse.get(definition.courseSlug);
    const sessionId = crypto.randomUUID();
    const enrollment = await Enrollment.create({
      student: user._id,
      course: course._id,
      enrolledAt,
      completedAt: null,
      isDemo: true,
      createdAt: enrolledAt,
      updatedAt: enrolledAt,
    });

    syntheticEvents.push(
      makeEvent({
        name: "user-signup",
        actorId: user._id,
        sessionId,
        date: signupAt,
      })
    );
    syntheticEvents.push(
      makeEvent({
        name: "login",
        actorId: user._id,
        sessionId,
        date: ago(definition.enrollDays, 8),
      })
    );
    syntheticEvents.push(
      makeEvent({
        name: "page_view",
        actorId: user._id,
        sessionId,
        date: ago(definition.enrollDays, 8, 5),
        pagePath: "/courses",
        source: definition.source[0],
        medium: definition.source[1],
      })
    );
    syntheticEvents.push(
      makeEvent({
        name: "course_view",
        actorId: user._id,
        sessionId,
        date: ago(definition.enrollDays, 8, 10),
        pagePath: `/courses/${course._id}`,
        source: definition.source[0],
        medium: definition.source[1],
        courseId: course._id,
      })
    );
    syntheticEvents.push(
      makeEvent({
        name: "course_enrollment",
        actorId: user._id,
        sessionId,
        date: enrolledAt,
        pagePath: `/courses/${course._id}`,
        courseId: course._id,
        enrollmentId: enrollment._id,
      })
    );

    const completionCount =
      definition.outcome === "complete"
        ? 3
        : definition.outcome === "partial"
        ? 1
        : 0;
    const startCount =
      definition.outcome === "complete"
        ? 3
        : definition.outcome === "partial"
        ? 2
        : definition.outcome === "started"
        ? 1
        : 0;
    let lastCompletion = null;
    for (let lessonIndex = 0; lessonIndex < startCount; lessonIndex += 1) {
      const startedAt = ago(
        Math.max(1, definition.enrollDays - lessonIndex - 1),
        10 + lessonIndex
      );
      const completedAt =
        lessonIndex < completionCount
          ? ago(
              Math.max(1, definition.enrollDays - lessonIndex - 2),
              9 + lessonIndex
            )
          : null;
      await LessonProgress.create({
        enrollment: enrollment._id,
        student: user._id,
        course: course._id,
        lesson: lessons[lessonIndex]._id,
        startedAt,
        completedAt,
        isDemo: true,
        createdAt: startedAt,
        updatedAt: completedAt || startedAt,
      });
      syntheticEvents.push(
        makeEvent({
          name: "lesson_start",
          actorId: user._id,
          sessionId,
          date: startedAt,
          pagePath: `/lessons/${lessons[lessonIndex]._id}`,
          courseId: course._id,
          lessonId: lessons[lessonIndex]._id,
          enrollmentId: enrollment._id,
        })
      );
      if (completedAt) {
        syntheticEvents.push(
          makeEvent({
            name: "lesson_complete",
            actorId: user._id,
            sessionId,
            date: completedAt,
            pagePath: `/lessons/${lessons[lessonIndex]._id}`,
            courseId: course._id,
            lessonId: lessons[lessonIndex]._id,
            enrollmentId: enrollment._id,
          })
        );
        lastCompletion = completedAt;
      }
    }

    if (completionCount === 3) {
      enrollment.completedAt = lastCompletion;
      await enrollment.save();
      syntheticEvents.push(
        makeEvent({
          name: "course_complete",
          actorId: user._id,
          sessionId,
          date: lastCompletion,
          pagePath: `/courses/${course._id}`,
          courseId: course._id,
          enrollmentId: enrollment._id,
        })
      );
    }
  }

  // Add independent navigation views on multiple days to provide a useful traffic/source trend.
  for (let day = 1; day <= 10; day += 1) {
    const user = await User.findOne({
      email: studentDefinitions[day % studentDefinitions.length].email,
    });
    const course = courses.get(
      courseDefinitions[day % courseDefinitions.length].slug
    );
    syntheticEvents.push(
      makeEvent({
        name: "page_view",
        actorId: user._id,
        sessionId: crypto.randomUUID(),
        date: ago(day, 14),
        pagePath: day % 2 ? "/dashboard" : "/courses",
        source:
          day % 3 === 0 ? "google" : day % 3 === 1 ? "direct" : "newsletter",
        medium: day % 3 === 0 ? "organic" : day % 3 === 1 ? "none" : "email",
      })
    );
    if (day % 2 === 0) {
      syntheticEvents.push(
        makeEvent({
          name: "course_view",
          actorId: user._id,
          sessionId: crypto.randomUUID(),
          date: ago(day, 14, 15),
          pagePath: `/courses/${course._id}`,
          source: "referral",
          medium: "referral",
          courseId: course._id,
        })
      );
    }
  }

  await AnalyticsEvent.insertMany(syntheticEvents, { ordered: true });
  const courseCount = await Course.countDocuments({ isPublished: true });
  const lessonCount = await Lesson.countDocuments({ isDemo: true });
  const userCount = await User.countDocuments({
    role: "student",
    isDemo: true,
  });
  console.log(
    `[seed] completed: ${courseCount} published courses, ${lessonCount} seeded lessons, ${userCount} demo students, ${syntheticEvents.length} synthetic events.`
  );
  console.log("[seed] Demo students use password: LearnLoopDemo!2026");
  console.log(`[seed] Admin account: ${config.admin.email}`);
}

seed()
  .catch((error) => {
    console.error("[seed] failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
