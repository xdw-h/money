import { onBeforeUnmount, onMounted, ref } from 'vue'
import { formatDate } from '../format/date'

export function useLocalToday() {
  const today = ref(formatDate(new Date()))
  let timer: ReturnType<typeof setTimeout>
  const refresh = () => {
    today.value = formatDate(new Date())
    clearTimeout(timer)
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    timer = setTimeout(refresh, next.getTime() - now.getTime() + 50)
  }
  onMounted(() => { refresh(); document.addEventListener('visibilitychange', refresh) })
  onBeforeUnmount(() => { clearTimeout(timer); document.removeEventListener('visibilitychange', refresh) })
  return today
}
