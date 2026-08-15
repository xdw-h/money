import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('./pages/HomePage.vue') },
    { path: '/record/new', component: () => import('./pages/RecordEditorPage.vue'), meta: { hideNav: true } },
    { path: '/record/:id', component: () => import('./pages/RecordEditorPage.vue'), meta: { hideNav: true } },
    { path: '/bills', component: () => import('./pages/BillsPage.vue') },
    { path: '/settings', component: () => import('./pages/SettingsPage.vue') },
  ],
})
