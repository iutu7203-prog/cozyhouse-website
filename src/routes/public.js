const express = require('express');
const q = require('../db/queries');

const router = express.Router();

function withRoomSummary(location) {
  const rooms = q.getRoomsByLocationId(location.id);
  const available = rooms.filter((r) => r.status === 'available');
  const prices = rooms.map((r) => r.price);
  return {
    ...location,
    rooms,
    total_rooms: rooms.length,
    availableCount: available.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

router.get('/', (req, res) => {
  const locations = q.getAllLocations().map(withRoomSummary);
  const allRooms = q.getAllRoomsWithLocation();
  const featuredRooms = allRooms.filter((r) => r.status === 'available').slice(0, 6);
  res.render('index', {
    title: 'Cozy House - Phòng trọ đầy đủ nội thất tại TP.HCM',
    locations,
    featuredRooms: featuredRooms.length ? featuredRooms : allRooms.slice(0, 6),
  });
});

router.get('/co-so/:slug', (req, res) => {
  const location = q.getLocationBySlug(req.params.slug);
  if (!location) {
    return res.status(404).render('404', { title: 'Không tìm thấy chi nhánh' });
  }
  const rooms = q.getRoomsByLocationId(location.id);
  const balconyRooms = rooms.filter((r) => r.room_type === 'balcony');
  const interiorRooms = rooms.filter((r) => r.room_type === 'interior');
  location.total_rooms = rooms.length;
  res.render('location', {
    title: `${location.name} - ${location.address}`,
    location,
    balconyRooms,
    interiorRooms,
  });
});

router.get('/phong/:slug', (req, res) => {
  const room = q.getRoomBySlug(req.params.slug);
  if (!room) {
    return res.status(404).render('404', { title: 'Không tìm thấy phòng' });
  }
  const galleryImages = q.getRoomImages(room.id);
  const allPhotos = [room.image, ...galleryImages.map((img) => img.image)];
  res.render('room', { title: `${room.name} - ${room.location_name}`, room, allPhotos });
});

router.get('/bang-gia', (req, res) => {
  const locations = q.getAllLocations().map(withRoomSummary);
  res.render('pricing', { title: 'Bảng giá phòng - Cozy House', locations });
});

router.get('/lien-he', (req, res) => {
  const locations = q.getAllLocations();
  res.render('contact', {
    title: 'Liên hệ đặt phòng - Cozy House',
    locations,
    success: req.query.success === '1',
    error: null,
    formData: {},
  });
});

router.post('/lien-he', (req, res) => {
  const { name, phone, location_interest, message } = req.body;
  const locations = q.getAllLocations();

  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();

  if (!cleanName || !cleanPhone) {
    return res.status(400).render('contact', {
      title: 'Liên hệ đặt phòng - Cozy House',
      locations,
      success: false,
      error: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.',
      formData: { name: cleanName, phone: cleanPhone, location_interest, message },
    });
  }

  const phoneDigits = cleanPhone.replace(/\D/g, '');
  if (phoneDigits.length < 9 || phoneDigits.length > 11) {
    return res.status(400).render('contact', {
      title: 'Liên hệ đặt phòng - Cozy House',
      locations,
      success: false,
      error: 'Số điện thoại không hợp lệ.',
      formData: { name: cleanName, phone: cleanPhone, location_interest, message },
    });
  }

  q.createContactMessage({
    name: cleanName,
    phone: cleanPhone,
    location_interest: location_interest || '',
    message: (message || '').trim(),
  });

  res.redirect('/lien-he?success=1');
});

router.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const locations = q.getAllLocations();
  const rooms = q.getAllRoomsWithLocation();

  const staticUrls = ['/', '/bang-gia', '/lien-he'];
  const locationUrls = locations.map((loc) => `/co-so/${loc.slug}`);
  const roomUrls = rooms.map((room) => `/phong/${room.slug}`);
  const urls = [...staticUrls, ...locationUrls, ...roomUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

module.exports = router;
