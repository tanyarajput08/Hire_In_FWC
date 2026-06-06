export function isApplicationOpen(applicationCloseAt) {
  if (!applicationCloseAt) {
    return true
  }

  return new Date() < new Date(applicationCloseAt)
}

export function formatApplicationCloseAt(applicationCloseAt) {
  if (!applicationCloseAt) {
    return null
  }

  return new Date(applicationCloseAt).toLocaleString()
}
