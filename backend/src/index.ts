import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Bootstrap custom roles for Users & Permissions plugin
    const requiredRoles = [
      {
        name: 'Admin',
        type: 'admin',
        description: 'System administrator with full application access',
      },
      {
        name: 'Content Manager',
        type: 'content_manager',
        description: 'Manages all LMS courses, lessons, quizzes, and blog posts',
      },
      {
        name: 'Instructor',
        type: 'instructor',
        description: 'Creates and manages own LMS courses, lessons, and quizzes',
      },
      {
        name: 'Student',
        type: 'student',
        description: 'Enrolls in courses, views lessons, tracks progress, and takes quizzes',
      },
    ];

    for (const roleData of requiredRoles) {
      const existingRole = await strapi.documents('plugin::users-permissions.role').findFirst({
        filters: { type: roleData.type },
      });

      if (!existingRole) {
        await strapi.documents('plugin::users-permissions.role').create({
          data: roleData,
        });
        strapi.log.info(`Bootstrap: Created missing role "${roleData.name}"`);
      }
    }
  },
};
