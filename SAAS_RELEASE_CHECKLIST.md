# SaaS Release Checklist

## Identity
- [ ] Production Supabase URL configured
- [ ] Publishable key configured
- [ ] No service-role key in frontend

## Authentication
- [ ] Email/password sign-in
- [ ] Sign-up
- [ ] Session persistence
- [ ] Logout
- [ ] Protected routes
- [ ] Password recovery

## Projects
- [ ] Create/update/delete project
- [ ] Project ownership
- [ ] Project members and roles
- [ ] Active project context

## Drive
- [ ] Private project-files bucket
- [ ] Upload / drag-drop
- [ ] Download
- [ ] Delete
- [ ] Search/filter
- [ ] Folder categories
- [ ] File metadata
- [ ] RLS isolation

## Inspection
- [ ] Inspection linked to project
- [ ] Source image stored privately
- [ ] AI result linked to inspection
- [ ] Report linked to project

## Security
- [ ] RLS policies verified with two test users
- [ ] FastAPI API-key auth retained
- [ ] Rate limiting retained
- [ ] Image validation retained
- [ ] Security headers retained
- [ ] Production docs disabled unless explicitly enabled

## Quality
- [ ] npm run build
- [ ] TypeScript check
- [ ] ESLint
- [ ] Backend tests
- [ ] E2E auth/project/storage test
