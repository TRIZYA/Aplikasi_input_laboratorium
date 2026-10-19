import test from 'node:test'
import assert from 'node:assert/strict'

import {
  validateCategoryForm,
  validateParameterForm,
  validateUserForm,
  validatePasswordResetForm,
} from './adminValidation.js'

test('validateCategoryForm rejects empty category name', () => {
  assert.equal(validateCategoryForm({ nama_kategori: '   ', deskripsi: 'ok' }), 'Nama kategori wajib diisi.')
})

test('validateParameterForm rejects missing range values when provided', () => {
  const error = validateParameterForm({
    kategori_id: '1',
    nama_parameter: 'Hemoglobin',
    satuan: 'g/dL',
    nilai_rujukan: '12-15',
    min_pria: '15',
    max_pria: '10',
    min_wanita: '',
    max_wanita: '',
  })

  assert.match(error, /lebih besar|lebih kecil|rentang/i)
})

test('validateParameterForm accepts valid parameter data', () => {
  const error = validateParameterForm({
    kategori_id: '1',
    nama_parameter: 'Hemoglobin',
    satuan: 'g/dL',
    nilai_rujukan: '12-15',
    min_pria: '13',
    max_pria: '17',
    min_wanita: '12',
    max_wanita: '15.5',
  })

  assert.equal(error, '')
})

test('validateUserForm requires username and full name', () => {
  assert.equal(validateUserForm({ username: '   ', nama_lengkap: 'Dr. Andi', role: 'dokter' }), 'Username wajib diisi.')
  assert.equal(validateUserForm({ username: 'andi', nama_lengkap: '   ', role: 'admin' }), 'Nama lengkap wajib diisi.')
})

test('validatePasswordResetForm requires a strong password', () => {
  assert.equal(validatePasswordResetForm({ newPassword: '123' }), 'Password minimal 6 karakter.')
  assert.equal(validatePasswordResetForm({ newPassword: 'password123' }), '')
})

test('validateUserForm requires password when creating a new user', () => {
  assert.equal(
    validateUserForm({ username: 'newuser', nama_lengkap: 'User Baru', role: 'analis', password: '', isCreate: true }),
    'Password wajib diisi.'
  )
})
