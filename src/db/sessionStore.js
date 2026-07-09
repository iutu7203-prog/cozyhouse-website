const session = require('express-session');
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expires INTEGER NOT NULL
  )
`);

const stmts = {
  get: db.prepare('SELECT sess, expires FROM sessions WHERE sid = @sid'),
  upsert: db.prepare(`
    INSERT INTO sessions (sid, sess, expires) VALUES (@sid, @sess, @expires)
    ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires
  `),
  destroy: db.prepare('DELETE FROM sessions WHERE sid = @sid'),
  clearExpired: db.prepare('DELETE FROM sessions WHERE expires < @now'),
};

// Don session het han moi 30 phut, tranh phinh to file sqlite theo thoi gian
setInterval(() => {
  try {
    stmts.clearExpired.run({ now: Date.now() });
  } catch (err) {
    console.error('Loi don session het han:', err.message);
  }
}, 30 * 60 * 1000).unref();

class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const row = stmts.get.get({ sid });
      if (!row || row.expires < Date.now()) return callback(null, null);
      callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie && sessionData.cookie.maxAge ? sessionData.cookie.maxAge : 1000 * 60 * 60 * 8;
      stmts.upsert.run({ sid, sess: JSON.stringify(sessionData), expires: Date.now() + maxAge });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      stmts.destroy.run({ sid });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sessionData, callback) {
    this.set(sid, sessionData, callback || (() => {}));
  }
}

module.exports = SqliteSessionStore;
