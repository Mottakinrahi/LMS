/**
 * Strapi Policy: checks if current user is Admin, Content Manager, or owner of the parent Course for a Lesson.
 */
export default async (policyContext: any, config: any, { strapi }: { strapi: any }) => {
  const user = policyContext.state.user;
  if (!user) return false;

  const role = user.role?.name;

  if (role === 'Admin' || role === 'Content Manager' || role === 'Administrator') {
    return true;
  }

  if (role === 'Student') {
    return false;
  }

  if (role === 'Instructor') {
    const { id } = policyContext.params;
    if (!id) return true;

    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: id,
      populate: {
        course: {
          populate: ['owner']
        }
      }
    });

    if (!lesson || !lesson.course) return false;
    return lesson.course.owner?.id === user.id;
  }

  return false;
};
