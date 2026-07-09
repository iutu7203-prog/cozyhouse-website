const FROM = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
const TO = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';

function slugify(input) {
  let s = String(input || '').toLowerCase().trim();
  for (let i = 0; i < FROM.length; i += 1) {
    s = s.split(FROM[i]).join(TO[i]);
  }
  s = s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return s || 'phong';
}

module.exports = { slugify };
