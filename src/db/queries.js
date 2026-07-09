const db = require('./db');

// ---- Settings ----
function getSettingsMap() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

function updateSettings(entries) {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  db.exec('BEGIN');
  try {
    Object.entries(entries).forEach(([key, value]) => {
      upsert.run({ key, value: String(value ?? '') });
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---- Locations ----
function getAllLocations() {
  return db.prepare('SELECT * FROM locations ORDER BY display_order ASC').all();
}

function getLocationBySlug(slug) {
  return db.prepare('SELECT * FROM locations WHERE slug = ?').get(slug);
}

function getLocationById(id) {
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
}

function updateLocation(id, fields) {
  const allowed = ['name', 'address', 'description', 'has_elevator', 'has_fire_safety', 'hero_image'];
  const sets = [];
  const params = {};
  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = @${key}`);
      params[key] = fields[key];
    }
  });
  if (sets.length === 0) return;
  params.id = id;
  db.prepare(`UPDATE locations SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

// ---- Rooms ----
function getRoomsByLocationId(locationId) {
  return db.prepare('SELECT * FROM rooms WHERE location_id = ? ORDER BY display_order ASC').all(locationId);
}

function getRoomBySlug(slug) {
  return db.prepare(`
    SELECT rooms.*, locations.name AS location_name, locations.slug AS location_slug, locations.address AS location_address
    FROM rooms JOIN locations ON rooms.location_id = locations.id
    WHERE rooms.slug = ?
  `).get(slug);
}

function getRoomById(id) {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
}

function getAllRoomsWithLocation() {
  return db.prepare(`
    SELECT rooms.*, locations.name AS location_name, locations.slug AS location_slug
    FROM rooms JOIN locations ON rooms.location_id = locations.id
    ORDER BY locations.display_order ASC, rooms.display_order ASC
  `).all();
}

function updateRoom(id, fields) {
  const allowed = ['name', 'room_type', 'price', 'status', 'area_m2', 'description', 'amenities', 'image'];
  const sets = [];
  const params = {};
  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = @${key}`);
      params[key] = fields[key];
    }
  });
  if (sets.length === 0) return;
  params.id = id;
  db.prepare(`UPDATE rooms SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

function getRoomStats() {
  const total = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;
  const available = db.prepare("SELECT COUNT(*) AS c FROM rooms WHERE status = 'available'").get().c;
  return { total, available, occupied: total - available };
}

// ---- Admin users ----
function getAdminByUsername(username) {
  return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
}

function updateAdminPassword(id, passwordHash) {
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

// ---- Contact messages ----
function createContactMessage({ name, phone, location_interest, message }) {
  return db.prepare(`
    INSERT INTO contact_messages (name, phone, location_interest, message)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, location_interest || '', message || '');
}

function getMessages() {
  return db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
}

function getUnreadMessageCount() {
  return db.prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE is_read = 0').get().c;
}

function markMessageRead(id) {
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
}

function deleteMessage(id) {
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
}

module.exports = {
  getSettingsMap,
  updateSettings,
  getAllLocations,
  getLocationBySlug,
  getLocationById,
  updateLocation,
  getRoomsByLocationId,
  getRoomBySlug,
  getRoomById,
  getAllRoomsWithLocation,
  updateRoom,
  getRoomStats,
  getAdminByUsername,
  updateAdminPassword,
  createContactMessage,
  getMessages,
  getUnreadMessageCount,
  markMessageRead,
  deleteMessage,
};
