import { describe, expect, it } from 'vitest';
import { UserModel } from '../src/modules/users/user.model.js';
import { VALID_PASSWORD, api, authHeader, newUser, registerUser, uniqueEmail } from './helpers.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/** The `field` of every validation detail, for compact assertions. */
const fieldsOf = (body: { error?: { details?: Array<{ field: string }> } }) =>
  (body.error?.details ?? []).map((detail) => detail.field);

describe('POST /api/auth/register', () => {
  it('creates an account and starts a session', async () => {
    const body = newUser({ name: 'Ada Lovelace' });

    const res = await api().post('/api/auth/register').send(body).expect(201);

    expect(res.body).toMatchObject({ success: true, message: 'Account created' });
    expect(res.body.data.user).toEqual({
      id: expect.stringMatching(/^[a-f\d]{24}$/),
      name: 'Ada Lovelace',
      email: body.email,
      created_at: expect.any(String),
    });
    expect(res.body.data.token).toMatch(JWT_SHAPE);

    const expiresIn = new Date(res.body.data.expires_at).getTime() - Date.now();
    expect(expiresIn).toBeGreaterThan(ONE_DAY_MS - 60_000);
    expect(expiresIn).toBeLessThanOrEqual(ONE_DAY_MS);
  });

  it('returns a token that works on GET /api/auth/me right away', async () => {
    const { token, user } = await registerUser();

    const res = await api().get('/api/auth/me').set(authHeader(token)).expect(200);

    expect(res.body.data.user).toEqual(user);
  });

  it('stores only a bcrypt hash (cost 12) of the password', async () => {
    const { user } = await registerUser({ password: 'Plain-Text-1' });

    const stored = await UserModel.findById(user.id).select('+password_hash').lean();

    expect(stored?.password_hash).toMatch(/^\$2[aby]\$12\$/);
    expect(stored?.password_hash).not.toContain('Plain-Text-1');
  });

  describe('input normalisation', () => {
    it('trims the name and collapses repeated spaces', async () => {
      const { user } = await registerUser({ name: '  Shanmugam   R ' });
      expect(user.name).toBe('Shanmugam R');
    });

    it('trims and lowercases the email', async () => {
      const email = uniqueEmail();
      const { user } = await registerUser({ email: `  ${email.toUpperCase()} ` });
      expect(user.email).toBe(email);
    });

    it('removes invisible zero-width and control characters from the name', async () => {
      const { user } = await registerUser({ name: 'Sha​nmu\u0007gam' });
      expect(user.name).toBe('Shanmugam');
    });

    it.each([
      ['Tamil', 'சண்முகம்'],
      ['Hindi', 'अनन्या शर्मा'],
      ['accented Latin', 'Zoë Ångström'],
      ['an apostrophe and a hyphen', "Mary-Jane O'Neil"],
      ['initials with periods', 'J. R. R. Tolkien'],
    ])('accepts names written with %s', async (_label, name) => {
      const { user } = await registerUser({ name });
      expect(user.name).toBe(name);
    });

    it('never alters the password (spaces are significant)', async () => {
      const password = '  Spaced Out 9  ';
      const { user } = await registerUser({ password });

      await api()
        .post('/api/auth/login')
        .send({ email: user.email, password: password.trim() })
        .expect(401);
      await api().post('/api/auth/login').send({ email: user.email, password }).expect(200);
    });
  });

  describe('validation', () => {
    it('reports every invalid field at once', async () => {
      const res = await api().post('/api/auth/register').send({}).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(fieldsOf(res.body).sort()).toEqual(['email', 'name', 'password']);
    });

    it.each([
      ['markup', '<script>alert(1)</script>'],
      ['digits', 'Agent 007'],
      ['an emoji', 'Smiley 😀'],
      ['only one character', 'A'],
      ['only spaces', '      '],
      ['more than 50 characters', 'A'.repeat(51)],
      ['a leading hyphen', '-Rogue'],
    ])('rejects a name containing %s', async (_label, name) => {
      const res = await api().post('/api/auth/register').send(newUser({ name })).expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      // A value can break several rules at once; only the name is reported.
      expect(new Set(fieldsOf(res.body))).toEqual(new Set(['name']));
    });

    it.each(['not-an-email', 'missing@tld', '@example.com', 'two@@example.com', ''])(
      'rejects the email %j',
      async (email) => {
        const res = await api().post('/api/auth/register').send(newUser({ email })).expect(400);
        expect(fieldsOf(res.body)).toEqual(['email']);
      },
    );

    it.each([
      ['shorter than 8 characters', 'Ab1defg', 'at least 8 characters'],
      ['without a lowercase letter', 'ABCDEFG1', 'lowercase letter'],
      ['without an uppercase letter', 'abcdefg1', 'uppercase letter'],
      ['without a number', 'Abcdefgh', 'number'],
      ['longer than 72 bytes', `Aa1${'é'.repeat(35)}`, 'at most 72 bytes'],
    ])('rejects a password %s', async (_label, password, hint) => {
      const res = await api().post('/api/auth/register').send(newUser({ password })).expect(400);

      expect(fieldsOf(res.body)).toEqual(['password']);
      expect(res.body.error.details[0].message).toContain(hint);
    });

    it('measures the 72-byte password limit in bytes, not characters', async () => {
      // 38 characters but 73 bytes: "é" takes two bytes in UTF-8.
      const password = `Aa1${'é'.repeat(35)}`;
      expect(password.length).toBeLessThan(72);

      await api().post('/api/auth/register').send(newUser({ password })).expect(400);
      await api()
        .post('/api/auth/register')
        .send(newUser({ password: password.slice(0, -1) }))
        .expect(201);
    });

    it('rejects unknown fields instead of silently ignoring them', async () => {
      const res = await api()
        .post('/api/auth/register')
        .send({ ...newUser(), role: 'admin' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].message).toMatch(/unrecognized key.*role/i);
    });

    it('rejects values of the wrong type', async () => {
      const res = await api()
        .post('/api/auth/register')
        .send({ name: ['Test', 'User'], email: 42, password: true })
        .expect(400);

      expect(fieldsOf(res.body).sort()).toEqual(['email', 'name', 'password']);
    });
  });

  describe('duplicate accounts', () => {
    it('answers 409 when the email is already registered', async () => {
      const { user } = await registerUser();

      const res = await api()
        .post('/api/auth/register')
        .send(newUser({ email: user.email }))
        .expect(409);

      expect(res.body.error).toMatchObject({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
        details: [{ field: 'email', message: expect.any(String) }],
      });
    });

    it('treats emails that differ only in case or spacing as the same account', async () => {
      const email = uniqueEmail();
      await registerUser({ email });

      await api()
        .post('/api/auth/register')
        .send(newUser({ email: ` ${email.toUpperCase()}  ` }))
        .expect(409);
      expect(await UserModel.countDocuments({ email })).toBe(1);
    });

    it('creates exactly one account when the same email signs up twice at once', async () => {
      const body = newUser();

      const results = await Promise.all([
        api().post('/api/auth/register').send(body),
        api().post('/api/auth/register').send(body),
      ]);

      expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
      expect(await UserModel.countDocuments({ email: body.email })).toBe(1);
    });
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with the correct email and password', async () => {
    const { user, password } = await registerUser();

    const res = await api().post('/api/auth/login').send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Signed in' });
    expect(res.body.data).toEqual({
      user,
      token: expect.stringMatching(JWT_SHAPE),
      expires_at: expect.any(String),
    });
  });

  it('accepts the email in any case and with surrounding spaces', async () => {
    const { user } = await registerUser();

    await api()
      .post('/api/auth/login')
      .send({ email: `  ${user.email.toUpperCase()} `, password: VALID_PASSWORD })
      .expect(200);
  });

  it('rejects a wrong password with 401 INVALID_CREDENTIALS', async () => {
    const { user } = await registerUser();

    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Wrong-Password-1' })
      .expect(401);

    expect(res.body.error).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
    });
  });

  it('treats the password as case-sensitive', async () => {
    const { user } = await registerUser();

    await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: VALID_PASSWORD.toLowerCase() })
      .expect(401);
  });

  it('gives an unknown email the same answer as a wrong password (no account discovery)', async () => {
    const { user } = await registerUser();

    const wrongPassword = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Wrong-Password-1' })
      .expect(401);
    const unknownEmail = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong-Password-1' })
      .expect(401);

    const { requestId: _a, ...first } = wrongPassword.body.error;
    const { requestId: _b, ...second } = unknownEmail.body.error;
    expect(second).toEqual(first);
  });

  it('requires both an email and a password', async () => {
    const res = await api().post('/api/auth/login').send({}).expect(400);
    expect(fieldsOf(res.body).sort()).toEqual(['email', 'password']);
  });

  it('rejects unknown fields', async () => {
    const { user, password } = await registerUser();

    await api()
      .post('/api/auth/login')
      .send({ email: user.email, password, remember: true })
      .expect(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user and is never cached', async () => {
    const { token, user } = await registerUser({ name: 'Grace Hopper' });

    const res = await api().get('/api/auth/me').set(authHeader(token)).expect(200);

    expect(res.body).toEqual({ success: true, data: { user } });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('answers 401 UNAUTHORIZED without an Authorization header', async () => {
    const res = await api().get('/api/auth/me').expect(401);

    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Please sign in to continue',
    });
  });

  it('answers 401 INVALID_TOKEN once the account has been deleted', async () => {
    const { token, user } = await registerUser();
    await UserModel.deleteOne({ _id: user.id });

    const res = await api().get('/api/auth/me').set(authHeader(token)).expect(401);

    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});
