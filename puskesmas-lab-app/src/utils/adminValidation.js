const normalizeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const validateCategoryForm = ({ nama_kategori }) => {
  if (!String(nama_kategori || '').trim()) {
    return 'Nama kategori wajib diisi.'
  }

  return ''
}

export const validateUserForm = ({ username, nama_lengkap, role, password, isCreate }) => {
  if (!String(username || '').trim()) {
    return 'Username wajib diisi.'
  }

  if (!String(nama_lengkap || '').trim()) {
    return 'Nama lengkap wajib diisi.'
  }

  const normalizedRole = String(role || '').trim().toLowerCase()
  if (!['admin', 'analis', 'dokter'].includes(normalizedRole)) {
    return 'Role tidak valid.'
  }

  if (isCreate && !String(password || '').trim()) {
    return 'Password wajib diisi.'
  }

  return ''
}

export const validatePasswordResetForm = ({ newPassword }) => {
  const value = String(newPassword || '').trim()
  if (!value || value.length < 6) {
    return 'Password minimal 6 karakter.'
  }

  return ''
}

export const validateParameterForm = (form) => {
  if (!form.kategori_id) {
    return 'Pilih kategori parameter terlebih dahulu.'
  }

  if (!String(form.nama_parameter || '').trim()) {
    return 'Nama parameter wajib diisi.'
  }

  const pairs = [
    { min: 'min_pria', max: 'max_pria', label: 'pria' },
    { min: 'min_wanita', max: 'max_wanita', label: 'wanita' },
  ]

  for (const { min, max, label } of pairs) {
    const minValue = normalizeNumber(form[min])
    const maxValue = normalizeNumber(form[max])

    if ((minValue === null && maxValue !== null) || (minValue !== null && maxValue === null)) {
      return `Rentang nilai ${label} harus diisi lengkap jika salah satu kolom diisi.`
    }

    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      return `Rentang nilai ${label} tidak valid: nilai minimum tidak boleh lebih besar dari maksimum.`
    }
  }

  return ''
}
