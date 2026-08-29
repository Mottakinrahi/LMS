import { factories } from '@strapi/strapi';

export default {
  routes: [
    // Core CRUD routes
    ...factories.createCoreRouter('api::quiz.quiz').routes,

    // Custom route: POST /api/quizzes/:id/submit  — server-side auto-grading
    {
      method: 'POST',
      path: '/quizzes/:id/submit',
      handler: 'quiz.submit',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
