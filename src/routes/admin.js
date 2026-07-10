const express = require('express');
const bcrypt = require('bcryptjs');
const q = require('../db/queries');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { slugify } = require('../utils/slug');

const router = express.Router();

const DEFAULT_AMENITIES = 'Giường nệm,Tủ quần áo,Bàn trang điểm,Tủ lạnh,Máy lạnh,Máy giặt,WC riêng';
const DEFAULT_IMAGE_BY_TYPE = {
  balcony: '/images/placeholder-balcony.svg',
  interior: '/images/placeholder-interior.svg',
};
const TYPE_VARIANTS = {
  balcony: ['/images/placeholder-balcony.svg', '/images/placeholder-balcony-2.svg', '/images/placeholder-balcony-3.svg'],
  interior: ['/images/placeholder-interior.svg', '/images/placeholder-interior-2.svg', '/images/placeholder-interior-3.svg'],
};
const UNIVERSAL_DETAIL_IMAGES = ['/images/placeholder-detail-closet.svg', '/images/placeholder-detail-desk.svg'];

function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let n = 2;
  while (q.getRoomBySlug(slug)) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }
  return slug;
}

router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Đăng nhập quản trị', error: null, next: req.query.next || '/admin' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const nextUrl = (req.body.next && req.body.next.startsWith('/admin')) ? req.body.next : '/admin';
  const admin = q.getAdminByUsername((username || '').trim());

  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).render('admin/login', {
      title: 'Đăng nhập quản trị',
      error: 'Tên đăng nhập hoặc mật khẩu không đúng.',
      next: nextUrl,
    });
  }

  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).render('admin/login', { title: 'Đăng nhập quản trị', error: 'Có lỗi xảy ra, thử lại.', next: nextUrl });
    }
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.redirect(nextUrl);
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.use(requireAdmin);

router.use((req, res, next) => {
  res.locals.unreadCount = q.getUnreadMessageCount();
  next();
});

router.get('/', (req, res) => {
  const locations = q.getAllLocations().map((loc) => ({
    ...loc,
    rooms: q.getRoomsByLocationId(loc.id),
  }));
  const stats = q.getRoomStats();
  res.render('admin/dashboard', {
    title: 'Trang quản trị - Cozy House',
    locations,
    stats,
    unreadCount: res.locals.unreadCount,
    deleted: req.query.deleted === '1',
  });
});

// ---- Rooms ----
router.get('/phong/:id', (req, res) => {
  const room = q.getRoomById(req.params.id);
  if (!room) return res.status(404).render('404', { title: 'Không tìm thấy phòng' });
  const location = q.getLocationById(room.location_id);
  const galleryImages = q.getRoomImages(room.id);
  res.render('admin/room-edit', {
    title: `Sửa phòng: ${room.name}`,
    room,
    location,
    galleryImages,
    saved: req.query.saved === '1',
    created: req.query.created === '1',
    imageAdded: req.query.imageAdded === '1',
    imageDeleted: req.query.imageDeleted === '1',
  });
});

router.post('/phong/:id', upload.single('image'), (req, res) => {
  const room = q.getRoomById(req.params.id);
  if (!room) return res.status(404).render('404', { title: 'Không tìm thấy phòng' });

  const { name, room_type, price, status, area_m2, description, amenities } = req.body;
  const fields = {
    name: (name || room.name).trim(),
    room_type: room_type === 'balcony' ? 'balcony' : 'interior',
    price: Math.max(0, parseInt(price, 10) || 0),
    status: status === 'occupied' ? 'occupied' : 'available',
    area_m2: area_m2 ? parseFloat(area_m2) : null,
    description: (description || '').trim(),
    amenities: (amenities || '').trim(),
  };
  if (req.file) {
    fields.image = `/uploads/${req.file.filename}`;
  }

  q.updateRoom(room.id, fields);
  res.redirect(`/admin/phong/${room.id}?saved=1`);
});

router.post('/phong/:id/xoa', (req, res) => {
  const room = q.getRoomById(req.params.id);
  if (!room) return res.status(404).render('404', { title: 'Không tìm thấy phòng' });
  q.deleteRoom(room.id);
  res.redirect('/admin?deleted=1');
});

router.post('/phong/:id/anh', upload.single('image'), (req, res) => {
  const room = q.getRoomById(req.params.id);
  if (!room) return res.status(404).render('404', { title: 'Không tìm thấy phòng' });
  if (!req.file) {
    return res.redirect(`/admin/phong/${room.id}`);
  }
  q.addRoomImage(room.id, `/uploads/${req.file.filename}`);
  res.redirect(`/admin/phong/${room.id}?imageAdded=1`);
});

router.post('/phong/:id/anh/:imageId/xoa', (req, res) => {
  const room = q.getRoomById(req.params.id);
  if (!room) return res.status(404).render('404', { title: 'Không tìm thấy phòng' });
  const image = q.getRoomImageById(req.params.imageId);
  if (image && image.room_id === room.id) {
    q.deleteRoomImage(image.id);
  }
  res.redirect(`/admin/phong/${room.id}?imageDeleted=1`);
});

router.get('/co-so/:id/phong-moi', (req, res) => {
  const location = q.getLocationById(req.params.id);
  if (!location) return res.status(404).render('404', { title: 'Không tìm thấy chi nhánh' });
  res.render('admin/room-new', {
    title: `Thêm phòng mới - ${location.name}`,
    location,
    error: null,
    formData: { room_type: 'balcony', amenities: DEFAULT_AMENITIES },
  });
});

router.post('/co-so/:id/phong-moi', upload.single('image'), (req, res) => {
  const location = q.getLocationById(req.params.id);
  if (!location) return res.status(404).render('404', { title: 'Không tìm thấy chi nhánh' });

  const { name, room_type, price, status, area_m2, description, amenities } = req.body;
  const cleanName = (name || '').trim();
  const cleanRoomType = room_type === 'balcony' ? 'balcony' : 'interior';

  if (!cleanName) {
    return res.status(400).render('admin/room-new', {
      title: `Thêm phòng mới - ${location.name}`,
      location,
      error: 'Vui lòng nhập tên phòng.',
      formData: req.body,
    });
  }

  const locationPrefix = location.slug.split('-')[0];
  const baseSlug = slugify(`${locationPrefix}-${cleanName}`);
  const slug = ensureUniqueSlug(baseSlug);

  const roomId = q.createRoom({
    location_id: location.id,
    slug,
    name: cleanName,
    room_type: cleanRoomType,
    price: Math.max(0, parseInt(price, 10) || 0),
    status: status === 'occupied' ? 'occupied' : 'available',
    area_m2: area_m2 ? parseFloat(area_m2) : null,
    description: (description || '').trim(),
    amenities: (amenities || '').trim() || DEFAULT_AMENITIES,
    image: req.file ? `/uploads/${req.file.filename}` : DEFAULT_IMAGE_BY_TYPE[cleanRoomType],
    display_order: q.getMaxDisplayOrder(location.id) + 1,
  });

  const primaryImage = req.file ? `/uploads/${req.file.filename}` : DEFAULT_IMAGE_BY_TYPE[cleanRoomType];
  const otherVariants = TYPE_VARIANTS[cleanRoomType].filter((img) => img !== primaryImage);
  [...otherVariants, ...UNIVERSAL_DETAIL_IMAGES].forEach((image) => q.addRoomImage(roomId, image));

  res.redirect(`/admin/phong/${roomId}?created=1`);
});

// ---- Locations ----
router.get('/co-so/:id', (req, res) => {
  const location = q.getLocationById(req.params.id);
  if (!location) return res.status(404).render('404', { title: 'Không tìm thấy chi nhánh' });
  res.render('admin/location-edit', { title: `Sửa chi nhánh: ${location.name}`, location, saved: req.query.saved === '1' });
});

router.post('/co-so/:id', upload.single('hero_image'), (req, res) => {
  const location = q.getLocationById(req.params.id);
  if (!location) return res.status(404).render('404', { title: 'Không tìm thấy chi nhánh' });

  const { name, address, description, has_elevator, has_fire_safety } = req.body;
  const fields = {
    name: (name || location.name).trim(),
    address: (address || location.address).trim(),
    description: (description || '').trim(),
    has_elevator: has_elevator ? 1 : 0,
    has_fire_safety: has_fire_safety ? 1 : 0,
  };
  if (req.file) {
    fields.hero_image = `/uploads/${req.file.filename}`;
  }

  q.updateLocation(location.id, fields);
  res.redirect(`/admin/co-so/${location.id}?saved=1`);
});

// ---- Settings ----
router.get('/cai-dat', (req, res) => {
  const settings = q.getSettingsMap();
  res.render('admin/settings', {
    title: 'Cài đặt chung',
    settings,
    saved: req.query.saved === '1',
    pwError: null,
    pwSuccess: req.query.pw === '1',
  });
});

router.post('/cai-dat', upload.single('hero_bg_image'), (req, res) => {
  const {
    site_name, owner_name, phone, zalo, facebook_url, working_hours,
    hero_title, hero_subtitle, electricity_price, water_price, service_fee,
  } = req.body;

  const fields = {
    site_name, owner_name, phone, zalo, facebook_url, working_hours,
    hero_title, hero_subtitle, electricity_price, water_price, service_fee,
  };
  if (req.file) {
    fields.hero_bg_image = `/uploads/${req.file.filename}`;
  }

  q.updateSettings(fields);

  res.redirect('/admin/cai-dat?saved=1');
});

router.post('/doi-mat-khau', (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const admin = q.getAdminByUsername(req.session.adminUsername);
  const settings = q.getSettingsMap();

  const renderError = (error) => res.status(400).render('admin/settings', {
    title: 'Cài đặt chung', settings, saved: false, pwError: error, pwSuccess: false,
  });

  if (!admin || !bcrypt.compareSync(current_password || '', admin.password_hash)) {
    return renderError('Mật khẩu hiện tại không đúng.');
  }
  if (!new_password || new_password.length < 8) {
    return renderError('Mật khẩu mới phải có ít nhất 8 ký tự.');
  }
  if (new_password !== confirm_password) {
    return renderError('Mật khẩu xác nhận không khớp.');
  }

  const hash = bcrypt.hashSync(new_password, 10);
  q.updateAdminPassword(admin.id, hash);
  res.redirect('/admin/cai-dat?pw=1');
});

// ---- Contact messages ----
router.get('/lien-he', (req, res) => {
  const messages = q.getMessages();
  res.render('admin/messages', { title: 'Tin nhắn liên hệ', messages });
});

router.post('/lien-he/:id/da-doc', (req, res) => {
  q.markMessageRead(req.params.id);
  res.redirect('/admin/lien-he');
});

router.post('/lien-he/:id/xoa', (req, res) => {
  q.deleteMessage(req.params.id);
  res.redirect('/admin/lien-he');
});

module.exports = router;
