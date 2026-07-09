function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('vi-VN')}đ`;
}

function roomTypeLabel(type) {
  return type === 'balcony' ? 'Phòng ban công' : 'Phòng trong';
}

function zaloLink(zaloNumber) {
  const digits = String(zaloNumber || '').replace(/\D/g, '');
  return `https://zalo.me/${digits}`;
}

function telLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return `tel:${digits}`;
}

module.exports = { formatCurrency, roomTypeLabel, zaloLink, telLink };
