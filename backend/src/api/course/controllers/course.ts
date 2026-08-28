import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (user && user.role?.name === 'Instructor') {
      ctx.request.body.data = {
        ...ctx.request.body.data,
        owner: user.id,
      };
    }
    return await super.create(ctx);
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (user && user.role?.name === 'Instructor') {
      ctx.query = {
        ...ctx.query,
        filters: {
          ...(ctx.query.filters as object),
          owner: { id: user.id },
        },
      };
    }
    return await super.find(ctx);
  },
}));
