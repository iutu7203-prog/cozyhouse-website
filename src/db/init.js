require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      total_rooms INTEGER NOT NULL DEFAULT 0,
      has_elevator INTEGER NOT NULL DEFAULT 0,
      has_fire_safety INTEGER NOT NULL DEFAULT 0,
      hero_image TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      room_type TEXT NOT NULL CHECK (room_type IN ('balcony','interior')),
      price INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied')),
      area_m2 REAL,
      description TEXT NOT NULL DEFAULT '',
      amenities TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location_interest TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

const DEFAULT_AMENITIES = ['Giường nệm', 'Tủ quần áo', 'Bàn trang điểm', 'Tủ lạnh', 'Máy lạnh', 'Máy giặt', 'WC riêng'].join(',');

function seedLocations() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM locations').get().c;
  if (count > 0) return;

  const insertLocation = db.prepare(`
    INSERT INTO locations (slug, name, address, description, total_rooms, has_elevator, has_fire_safety, hero_image, display_order)
    VALUES (@slug, @name, @address, @description, @total_rooms, @has_elevator, @has_fire_safety, @hero_image, @display_order)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (location_id, slug, name, room_type, price, status, area_m2, description, amenities, image, display_order)
    VALUES (@location_id, @slug, @name, @room_type, @price, 'available', @area_m2, @description, @amenities, @image, @display_order)
  `);

  const loc156 = insertLocation.run({
    slug: '156-cong-hoa',
    name: 'Cozy House 156',
    address: '156/1/17 Cộng Hòa, Phường Bảy Hiền, TP. Hồ Chí Minh',
    description: 'Cozy House 156 là căn nhà 7 phòng ngủ đầy đủ nội thất, trang bị hệ thống PCCC và an ninh hiện đại, có thang máy phục vụ di chuyển thuận tiện giữa các tầng. Vị trí nằm trên trục đường Cộng Hòa, gần khu vực Bảy Hiền, thuận tiện di chuyển đến sân bay Tân Sơn Nhất và trung tâm thành phố.',
    total_rooms: 7,
    has_elevator: 1,
    has_fire_safety: 1,
    hero_image: '/images/placeholder-156-hero.svg',
    display_order: 1,
  });

  const loc220 = insertLocation.run({
    slug: '220-cong-hoa',
    name: 'Cozy House 220',
    address: '220 Cộng Hòa, TP. Hồ Chí Minh',
    description: 'Cozy House 220 gồm 6 phòng ngủ đầy đủ nội thất, không gian ấm cúng, riêng tư. Vị trí ngay mặt tiền đường Cộng Hòa, thuận tiện di chuyển và sinh hoạt.',
    total_rooms: 6,
    has_elevator: 0,
    has_fire_safety: 0,
    hero_image: '/images/placeholder-220-hero.svg',
    display_order: 2,
  });

  const rooms156 = [
    { name: 'Phòng Ban Công 1', room_type: 'balcony', price: 9000000, image: '/images/placeholder-balcony.svg' },
    { name: 'Phòng Ban Công 2', room_type: 'balcony', price: 9000000, image: '/images/placeholder-balcony.svg' },
    { name: 'Phòng Ban Công 3', room_type: 'balcony', price: 8500000, image: '/images/placeholder-balcony.svg' },
    { name: 'Phòng Trong 1', room_type: 'interior', price: 7500000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 2', room_type: 'interior', price: 7500000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 3', room_type: 'interior', price: 7800000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 4', room_type: 'interior', price: 7800000, image: '/images/placeholder-interior.svg' },
  ];

  const rooms220 = [
    { name: 'Phòng Ban Công 1', room_type: 'balcony', price: 9000000, image: '/images/placeholder-balcony.svg' },
    { name: 'Phòng Ban Công 2', room_type: 'balcony', price: 8500000, image: '/images/placeholder-balcony.svg' },
    { name: 'Phòng Trong 1', room_type: 'interior', price: 7500000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 2', room_type: 'interior', price: 7500000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 3', room_type: 'interior', price: 7800000, image: '/images/placeholder-interior.svg' },
    { name: 'Phòng Trong 4', room_type: 'interior', price: 7800000, image: '/images/placeholder-interior.svg' },
  ];

  const seedRooms = (locationRow, prefix, rooms) => {
    rooms.forEach((room, idx) => {
      const typeSlug = room.room_type === 'balcony' ? 'ban-cong' : 'trong';
      const numberInType = rooms.slice(0, idx + 1).filter((r) => r.room_type === room.room_type).length;
      insertRoom.run({
        location_id: locationRow.lastInsertRowid,
        slug: `${prefix}-${typeSlug}-${numberInType}`,
        name: room.name,
        room_type: room.room_type,
        price: room.price,
        area_m2: null,
        description: '',
        amenities: DEFAULT_AMENITIES,
        image: room.image,
        display_order: idx + 1,
      });
    });
  };

  seedRooms(loc156, '156', rooms156);
  seedRooms(loc220, '220', rooms220);
}

const DEFAULT_SETTINGS = {
  site_name: 'Cozy House',
  owner_name: 'Mr. Tuấn',
  phone: '0879888898',
  zalo: '0879888898',
  facebook_url: '',
  working_hours: '8:00 - 20:00 hằng ngày',
  hero_title: 'Phòng trọ đầy đủ nội thất, an toàn, ngay trung tâm',
  hero_subtitle: 'Hệ thống Cozy House gồm 2 chi nhánh trên đường Cộng Hòa, Phường Bảy Hiền, TP. Hồ Chí Minh. Phòng full nội thất, an ninh - PCCC hiện đại, dọn vào ở ngay.',
  electricity_price: '4000',
  water_price: '100000',
  service_fee: '300000',
};

function seedSettings() {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO NOTHING
  `);
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    upsert.run({ key, value });
  });
}

function seedAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;
  if (count > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const hash = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Da tao tai khoan admin: ${username} (mat khau lay tu bien moi truong ADMIN_PASSWORD)`);
}

function run() {
  migrate();
  seedLocations();
  seedSettings();
  seedAdmin();
  console.log('Khoi tao database hoan tat: data/cozyhouse.sqlite');
}

if (require.main === module) {
  run();
}

module.exports = { run };
