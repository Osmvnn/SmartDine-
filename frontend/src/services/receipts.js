import api from './api'

export async function downloadReceipt(orderId) {
  const { data } = await api.get(`/receipts/${orderId}`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `receipt-${orderId}.pdf`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
