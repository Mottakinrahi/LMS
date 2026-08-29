import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  // Custom server-side quiz submission & auto-grading
  async submit(ctx: any) {
    const { id: quizId } = ctx.params; // quiz documentId
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to submit a quiz.');
    }

    // Only Students can submit
    const role = user.role?.type || user.role?.name || '';
    if (role !== 'student') {
      return ctx.forbidden('Only students can submit quiz attempts.');
    }

    const { answers } = ctx.request.body;
    if (!answers || typeof answers !== 'object') {
      return ctx.badRequest('Missing answers payload.');
    }

    // 1. Load quiz + questions from DB (correctOptionIndex stays server-side)
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: { questions: true },
    });

    if (!quiz) {
      return ctx.notFound('Quiz not found.');
    }

    const questions: any[] = (quiz as any).questions || [];
    if (questions.length === 0) {
      return ctx.badRequest('This quiz has no questions.');
    }

    // 2. Server-side grading — never trust a score sent from the client
    let correct = 0;
    for (const question of questions) {
      const questionId = String(question.documentId || question.id);
      const studentAnswer = answers[questionId];
      if (studentAnswer !== undefined && Number(studentAnswer) === Number(question.correctOptionIndex)) {
        correct++;
      }
    }

    const score = Math.round((correct / questions.length) * 100);

    // 3. Persist the QuizAttempt
    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').create({
      data: {
        student: user.id,
        quiz: quizId,
        answers,
        score,
        submittedAt: new Date().toISOString(),
      },
    });

    return ctx.send({
      score,
      correct,
      total: questions.length,
      attemptId: attempt.documentId || attempt.id,
    });
  },
}));
