import { ref, onMounted } from 'vue'
import api from '../services/api'

export function usePaymentCapabilities() {
  const onlinePayments = ref(false)
  const demoPayments = ref(false)
  onMounted(async () => {
    try {
      const { data } = await api.get('/payments/capabilities')
      onlinePayments.value = data.data.online === true
      demoPayments.value = data.data.demo === true
    } catch { /* Pay-later remains available when capabilities cannot be loaded. */ }
  })
  return { onlinePayments, demoPayments }
}
