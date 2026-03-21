import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Test E2E per le API del Time Tracker.
 *
 * PREREQUISITI:
 * - Database PostgreSQL attivo con le migrazioni applicate
 * - File .env configurato
 * - Almeno un utente admin nel database
 *
 * Per eseguire: npm run test:e2e
 */
describe('Time Tracker API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════
  // AUTH
  // ═══════════════════════════════════

  describe('Auth', () => {
    it('POST /api/auth/login — rifiuta credenziali errate', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' })
        .expect(401);
    });

    it('POST /api/auth/login — rifiuta body vuoto', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(401);
    });

    it('GET /api/auth/me — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('GET /api/auth/me — rifiuta token invalido', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });
  });

  // ═══════════════════════════════════
  // TIME ENTRIES (senza auth)
  // ═══════════════════════════════════

  describe('Time Entries — protezione auth', () => {
    it('GET /api/time-entries — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/time-entries')
        .query({ date: '2026-03-21' })
        .expect(401);
    });

    it('POST /api/time-entries — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .post('/api/time-entries')
        .send({ projectId: 'fake', date: '2026-03-21', durationMinutes: 60 })
        .expect(401);
    });

    it('PUT /api/time-entries/fake-id — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .put('/api/time-entries/fake-id')
        .send({ durationMinutes: 120 })
        .expect(401);
    });

    it('DELETE /api/time-entries/fake-id — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .delete('/api/time-entries/fake-id')
        .expect(401);
    });
  });

  // ═══════════════════════════════════
  // DAY STATUS (senza auth)
  // ═══════════════════════════════════

  describe('Day Status — protezione auth', () => {
    it('GET /api/day-status — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/day-status')
        .query({ date: '2026-03-21' })
        .expect(401);
    });

    it('POST /api/day-status/close — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .post('/api/day-status/close')
        .expect(401);
    });
  });

  // ═══════════════════════════════════
  // WEEKLY (senza auth)
  // ═══════════════════════════════════

  describe('Weekly — protezione auth', () => {
    it('GET /api/weekly/current — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/weekly/current')
        .expect(401);
    });

    it('POST /api/weekly/submit — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .post('/api/weekly/submit')
        .expect(401);
    });
  });

  // ═══════════════════════════════════
  // ADMIN (senza auth)
  // ═══════════════════════════════════

  describe('Admin — protezione auth', () => {
    it('GET /api/admin/users — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401);
    });

    it('GET /api/admin/compliance — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/compliance')
        .expect(401);
    });

    it('GET /api/admin/projects — rifiuta senza token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/projects')
        .expect(401);
    });
  });

  // ═══════════════════════════════════
  // ROUTES INESISTENTI
  // ═══════════════════════════════════

  describe('Routes inesistenti', () => {
    it('GET /api/orchestration/projects — 404 (modulo rimosso)', () => {
      return request(app.getHttpServer())
        .get('/api/orchestration/projects')
        .expect(404);
    });

    it('GET /api/ai/status — 404 (modulo rimosso)', () => {
      return request(app.getHttpServer())
        .get('/api/ai/status')
        .expect(404);
    });
  });
});
