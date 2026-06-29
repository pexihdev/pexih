import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('pexih_session')?.value;
  
  if (token) {
    const user = await verifyToken(token);
    if (user) {
      context.locals.user = user;
    }
  }

  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // 1. Protect Admin Page Routes
  if (path.startsWith('/admin')) {
    // Exclude login routes from protection
    if (path === '/admin/login' || path === '/admin/desktop/login') {
      return next();
    }

    if (!context.locals.user) {
      if (path.startsWith('/admin/desktop')) {
        return context.redirect('/admin/desktop/login');
      }
      return context.redirect('/admin/login');
    }
    
    // Check role - assuming 'admin' or 'superadmin' is required for admin panel pages
    const role = context.locals.user.role?.toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      if (path.startsWith('/admin/desktop')) {
        return context.redirect('/desktop');
      }
      return context.redirect('/'); // Not an admin, redirect to homepage
    }
  }

  // 2. Protect Front-end Protected Page Routes (Desktop & Mobile)
  const isProfileRoute = path === '/profile' || path === '/desktop/profile';
  const isWriterRoute = path === '/writer' || path === '/desktop/writer';
  const isBookmarksRoute = path === '/bookmarks' || path === '/desktop/bookmarks';
  
  if (isProfileRoute || isWriterRoute || isBookmarksRoute) {
    if (!context.locals.user) {
      if (path.startsWith('/desktop')) {
        return context.redirect('/desktop/login');
      }
      return context.redirect('/login');
    }
  }

  // 3. Protect API Routes
  if (path.startsWith('/api/')) {
    // A. Users API (Admin only)
    if (path.startsWith('/api/users')) {
      if (!context.locals.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const role = context.locals.user.role?.toLowerCase();
      if (role !== 'admin' && role !== 'superadmin') {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // B. Settings API (POST/PUT/DELETE is Admin only)
    if (path.startsWith('/api/settings')) {
      const method = context.request.method;
      if (method !== 'GET') {
        if (!context.locals.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const role = context.locals.user.role?.toLowerCase();
        if (role !== 'admin' && role !== 'superadmin') {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // C. Articles API (POST/PUT/DELETE requires logged in user with role admin/superadmin/writer)
    if (path.startsWith('/api/articles')) {
      const method = context.request.method;
      if (method !== 'GET') {
        if (!context.locals.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const role = context.locals.user.role?.toLowerCase();
        if (role !== 'admin' && role !== 'superadmin' && role !== 'writer') {
          return new Response(JSON.stringify({ error: 'Forbidden: Creator permissions required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // D. Revisions API (requires logged-in creator/admin)
    if (path.startsWith('/api/revisions')) {
      if (!context.locals.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const role = context.locals.user.role?.toLowerCase();
      if (role !== 'admin' && role !== 'superadmin' && role !== 'writer') {
        return new Response(JSON.stringify({ error: 'Forbidden: Creator/Admin permissions required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  return next();
});
