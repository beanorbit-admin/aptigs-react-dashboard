import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// FormData needs its Content-Type set (with boundary) by the browser, not
// the instance's default 'application/json' header.
export const formDataConfig = (data) =>
  data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined

api.interceptors.request.use(config => {
  const token = localStorage.getItem('aptigs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

// A 401 from these means bad credentials, not an expired session, so the
// caller should handle it (no token refresh, no redirect/page reload).
const AUTH_ENDPOINTS = ['auth/login/', 'auth/token/refresh/']
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some(path => url.endsWith(path))

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint(original.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      const refresh = localStorage.getItem('aptigs_refresh')
      if (!refresh) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}auth/token/refresh/`, { refresh })
        localStorage.setItem('aptigs_token', data.access)
        api.defaults.headers.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
