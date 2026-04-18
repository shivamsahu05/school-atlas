// src/controllers/usersController.js
const bcrypt   = require('bcryptjs')
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

const SELECT_USER = {
  id: true, name: true, email: true, role: true,
  phone: true, status: true, created_at: true,
}

/** GET /api/users  (admin) */
const getUsers = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { role, status, search } = req.query

  const where = {}
  if (role)   where.role   = role
  if (status) where.status = status
  if (search) where.OR = [
    { name:  { contains: search } },
    { email: { contains: search } },
  ]

  const [users, total] = await prisma.$transaction([
    prisma.users.findMany({ where, select: SELECT_USER, skip, take, orderBy: { created_at: 'desc' } }),
    prisma.users.count({ where }),
  ])

  return sendSuccess(res, paginated(users, total, page, limit))
}

/** GET /api/users/:id (admin) */
const getUserById = async (req, res) => {
  const user = await prisma.users.findUnique({
    where:  { id: Number(req.params.id) },
    select: SELECT_USER,
  })
  if (!user) return sendError(res, 'User not found.', 404)
  return sendSuccess(res, user)
}

/** POST /api/users (admin) */
const createUser = async (req, res) => {
  const { name, email, password, role, phone, status } = req.body

  const exists = await prisma.users.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return sendError(res, 'Email already registered.', 409)

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.users.create({
    data:   { name, email: email.toLowerCase(), password: hashed, role, phone, status },
    select: SELECT_USER,
  })
  return sendSuccess(res, user, 'User created successfully.', 201)
}

/** PUT /api/users/:id (admin) */
const updateUser = async (req, res) => {
  const id   = Number(req.params.id)
  const data = { ...req.body }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS)
  } else {
    delete data.password
  }
  if (data.email) data.email = data.email.toLowerCase()

  const user = await prisma.users.update({
    where:  { id },
    data,
    select: SELECT_USER,
  })
  return sendSuccess(res, user, 'User updated successfully.')
}

/** DELETE /api/users/:id (admin) */
const deleteUser = async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) return sendError(res, 'You cannot delete your own account.', 400)

  await prisma.users.delete({ where: { id } })
  return sendSuccess(res, null, 'User deleted successfully.')
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser }
