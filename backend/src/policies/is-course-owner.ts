/**
 * Strapi Policy: checks if current user is Admin, Content Manager, or the owning Instructor of a course.
 */
export default async (policyContext: any, config: any, { strapi }: { strapi: any }) => {
  const user = policyContext.state.user;
  if (!user) return false;

  const role = user.role?.name;

  // Admin & Content Manager can access unconditionally
  if (role === 'Admin' || role === 'Content Manager' || role === 'Administrator') {
    return true;
  }

  // Students cannot perform restricted course actions (update/delete)
  if (role === 'Student') {
    return false;
  }

  // Instructor must own the target course
  if (role === 'Instructor') {
    const { id } = policyContext.params;
    if (!id) return true; // create route allows instructor, owner assigned in controller

    const course = await strapi.documents('api::course.course').findOne({
      documentId: id,
      populate: ['owner']
    });

    if (!course) return false;
    return course.owner?.id === user.id;
  }

  return false;
};
