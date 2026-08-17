<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ImageUploader from '../images/ImageUploader.vue'
import { formatMoney } from '../../shared/format/money'
import AmountKeypad from './AmountKeypad.vue'
import { addCategory, categoryIcons, categoryItems, deleteCategory, loadCategories, updateCategory } from './categoryStore'
import type { ImageEntity, RecordDraft, RecordType } from './types'
import { activeLedger, activeLedgerId, loadLedgers } from '../ledgers/ledgerStore'
import EmojiPickerField from '../../shared/components/EmojiPickerField.vue'

const props = defineProps<{ busy?: boolean; error?: string; initial?: RecordDraft; initialImages?: ImageEntity[] }>()
const emit = defineEmits<{ save: [draft: RecordDraft & { files: File[] }]; cancel: [] }>()
const type = ref<RecordType>('expense')
const amountText = ref('')
const categoryId = ref('health')
const subcategoryId = ref('')
const note = ref('')
const noteSheetOpen = ref(false)
const files = ref<File[]>([])
const retainedImageIds = ref<string[]>([])
const addingCategory = ref(false)
const categoryName = ref('')
const categoryIcon = ref(categoryIcons[0])
const categoryError = ref('')
const managingCategories = ref(false)
const editingCategoryId = ref('')
const categoryParentId = ref<string>()
const managingParentId = ref<string>()
const subcategorySheetOpen = ref(false)
const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const occurredAt = ref(localDate)
const occurredAtLabel = computed(() => {
  const [date, time] = occurredAt.value.split('T')
  return date && time ? `${date.slice(5).replace('-', '/')} ${time}` : '选择时间'
})
const visibleCategories = computed(() => categoryItems.value.filter((item) => item.type === type.value && !item.parentId))
const visibleSubcategories = computed(() => categoryItems.value.filter((item) => item.parentId === categoryId.value))
const managedCategories = computed(() => managingParentId.value ? visibleSubcategories.value : visibleCategories.value)
const amount = computed(() => Math.round(Number(amountText.value || 0) * 100))
function chooseType(value: RecordType) { type.value = value; categoryId.value = categoryItems.value.find((item) => item.type === value && !item.parentId)?.id ?? ''; subcategoryId.value = '' }
function chooseCategory(id: string) { categoryId.value = id; subcategoryId.value = ''; subcategorySheetOpen.value = true }
function chooseSubcategory(id: string) { subcategoryId.value = id; subcategorySheetOpen.value = false }
loadCategories()
loadLedgers()
async function createCategory() {
  categoryError.value = ''
  try {
    const category = await addCategory(type.value, categoryName.value, categoryIcon.value, categoryParentId.value)
    if (category.parentId) subcategoryId.value = category.id
    else { categoryId.value = category.id; subcategoryId.value = '' }
    categoryName.value = ''
    addingCategory.value = false
  } catch (reason) { categoryError.value = reason instanceof Error ? reason.message : '新增分类失败' }
}
function openCreateCategory() {
  editingCategoryId.value = ''
  categoryName.value = ''
  categoryIcon.value = categoryIcons[0]
  categoryError.value = ''
  categoryParentId.value = undefined
  addingCategory.value = true
  managingCategories.value = false
}
function openCreateSubcategory() {
  editingCategoryId.value = ''
  categoryName.value = ''
  categoryIcon.value = categoryIcons[0]
  categoryError.value = ''
  categoryParentId.value = categoryId.value
  addingCategory.value = true
  managingCategories.value = false
  subcategorySheetOpen.value = false
}
function editCategory(id: string) {
  const category = categoryItems.value.find((item) => item.id === id)
  if (!category) return
  editingCategoryId.value = id
  categoryName.value = category.name
  categoryIcon.value = category.icon
  categoryParentId.value = category.parentId
  categoryError.value = ''
  addingCategory.value = true
  managingCategories.value = false
}
async function saveCategory() {
  if (!editingCategoryId.value) return createCategory()
  categoryError.value = ''
  try {
    await updateCategory(editingCategoryId.value, categoryName.value, categoryIcon.value)
    addingCategory.value = false
  } catch (reason) { categoryError.value = reason instanceof Error ? reason.message : '修改分类失败' }
}
async function removeCategory(id: string) {
  categoryError.value = ''
  try {
    await deleteCategory(id)
    if (categoryId.value === id) { categoryId.value = visibleCategories.value[0]?.id ?? ''; subcategoryId.value = '' }
    if (subcategoryId.value === id) subcategoryId.value = ''
  } catch (reason) { categoryError.value = reason instanceof Error ? reason.message : '删除分类失败' }
}
watch(() => props.initial, (value) => {
  if (!value) return
  type.value = value.type; amountText.value = String(value.amount / 100); categoryId.value = value.categoryId; subcategoryId.value = value.subcategoryId ?? ''; note.value = value.note
  retainedImageIds.value = [...value.imageIds]
  const date = new Date(value.occurredAt)
  occurredAt.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}, { immediate: true })

function enter(key: string) {
  if (key === '⌫') amountText.value = amountText.value.slice(0, -1)
  else if (key === '.' && !amountText.value.includes('.')) amountText.value = `${amountText.value || '0'}.`
  else if (/^\d$/.test(key)) {
    const decimals = amountText.value.split('.')[1]
    if (decimals?.length === 2 || amountText.value.replace('.', '').length >= 9) return
    amountText.value = amountText.value === '0' ? key : amountText.value + key
  }
}

function submit() {
  if (!amount.value || !categoryId.value) return
  emit('save', {
    ledgerId: props.initial?.ledgerId ?? activeLedgerId.value,
    type: type.value, amount: amount.value, categoryId: categoryId.value, subcategoryId: subcategoryId.value || undefined,
    occurredAt: new Date(occurredAt.value).toISOString(), note: note.value.trim(), imageIds: retainedImageIds.value, files: files.value,
  })
}
</script>

<template>
  <form class="record-editor" @submit.prevent="submit">
    <header class="editor-header"><button type="button" aria-label="取消" @click="emit('cancel')">‹</button><strong>{{ initial ? '编辑账目' : '快速记账' }}<small>{{ activeLedger?.icon }} {{ activeLedger?.name }}</small></strong></header>
    <div class="type-switch">
      <button type="button" data-type="expense" :aria-pressed="type === 'expense'" @click="chooseType('expense')">支出</button>
      <button type="button" data-type="income" :aria-pressed="type === 'income'" @click="chooseType('income')">收入</button>
    </div>
    <section class="category-panel"><div class="category-title"><strong>选择分类</strong><small>左右滑动查看更多</small><button type="button" @click="managingParentId = undefined; managingCategories = true; addingCategory = false; categoryError = ''">管理</button></div>
      <div class="category-grid">
      <button v-for="category in visibleCategories" :key="category.id" type="button" :data-category="category.id" :class="{ selected: categoryId === category.id }" @click="chooseCategory(category.id)">
        <span>{{ category.icon }}</span><small>{{ category.name }}</small>
      </button>
      <button class="add-category" type="button" aria-label="管理分类" @click="managingParentId = undefined; managingCategories = true; addingCategory = false; categoryError = ''"><span>⚙</span><small>设置</small></button>
      </div>
    </section>
    <button class="subcategory-trigger" type="button" @click="subcategorySheetOpen = true"><span><small>子分类</small><strong>{{ subcategoryId ? categoryItems.find(item => item.id === subcategoryId)?.name : '未选择' }}</strong></span><em>请选择 ›</em></button>
    <div v-if="subcategorySheetOpen" class="sheet-overlay" @click.self="subcategorySheetOpen = false">
      <section class="subcategory-sheet" role="dialog" aria-modal="true" aria-label="选择子分类">
        <header><button type="button" aria-label="关闭子分类" @click="subcategorySheetOpen = false">×</button><strong>{{ categoryItems.find(item => item.id === categoryId)?.name }}</strong><span><button type="button" @click="managingParentId = categoryId; managingCategories = true; addingCategory = false; categoryError = ''; subcategorySheetOpen = false">管理</button><button class="add" type="button" @click="openCreateSubcategory">添加</button></span></header>
        <div class="subcategory-rows"><button type="button" :class="{ selected: !subcategoryId }" @click="chooseSubcategory('')"><i>{{ categoryItems.find(item => item.id === categoryId)?.icon }}</i><span>{{ categoryItems.find(item => item.id === categoryId)?.name }}（不选子类）</span><b>✓</b></button><button v-for="category in visibleSubcategories" :key="category.id" type="button" :class="{ selected: subcategoryId === category.id }" @click="chooseSubcategory(category.id)"><i>{{ category.icon }}</i><span>{{ category.name }}</span><b>✓</b></button><p v-if="!visibleSubcategories.length">还没有子分类，点击右上角“添加”创建</p></div>
      </section>
    </div>
    <section v-if="addingCategory" class="category-dialog" role="dialog" aria-label="新增分类">
      <header><strong>{{ editingCategoryId ? '修改分类' : categoryParentId ? '新增子分类' : `新增${type === 'expense' ? '支出' : '收入'}分类` }}</strong><button type="button" aria-label="关闭新增分类" @click="addingCategory = false">×</button></header>
      <input v-model="categoryName" maxlength="8" placeholder="分类名称" aria-label="分类名称" />
      <EmojiPickerField v-model="categoryIcon" label="分类图标" />
      <p v-if="categoryError">{{ categoryError }}</p>
      <button class="category-confirm" type="button" @click="saveCategory">{{ editingCategoryId ? '保存修改' : '添加分类' }}</button>
    </section>
    <section v-if="managingCategories" class="category-dialog category-manager" role="dialog" aria-label="管理分类">
      <header><strong>管理{{ managingParentId ? '子分类' : type === 'expense' ? '支出分类' : '收入分类' }}</strong><button type="button" aria-label="关闭分类管理" @click="managingCategories = false">×</button></header>
      <div class="category-manage-list"><div v-for="category in managedCategories" :key="category.id"><i>{{ category.icon }}</i><span>{{ category.name }}</span><button type="button" @click="editCategory(category.id)">修改</button><button class="remove" type="button" @click="removeCategory(category.id)">删除</button></div></div>
      <p v-if="categoryError">{{ categoryError }}</p>
      <button class="category-confirm" type="button" @click="managingParentId ? openCreateSubcategory() : openCreateCategory()">新增{{ managingParentId ? '子分类' : '分类' }}</button>
    </section>
    <section class="entry-tools"><button class="note-trigger" type="button" @click="noteSheetOpen = true"><span>✎</span><small>{{ note || '添加备注' }}</small></button><label class="date-field"><span>◷</span><small>{{ occurredAtLabel }}</small><input v-model="occurredAt" type="datetime-local" aria-label="记账时间" /></label><ImageUploader :existing-images="initialImages" @update:files="files = $event" @update:retained-image-ids="retainedImageIds = $event" /></section>
    <div v-if="noteSheetOpen" class="note-overlay" @click.self="noteSheetOpen = false"><section class="note-sheet" role="dialog" aria-modal="true" aria-label="编辑备注"><header><strong>备注</strong><button type="button" aria-label="完成备注编辑" @click="noteSheetOpen = false">完成</button></header><textarea v-model="note" rows="6" autofocus placeholder="记录这笔账的详细信息…" aria-label="备注" /></section></div>
    <p v-if="props.error" class="field-error" role="alert">{{ props.error }}</p>
    <div class="amount-row" aria-live="polite"><small>当前金额</small><strong data-testid="amount">{{ formatMoney(amount) }}</strong></div>
    <AmountKeypad :disabled="busy" @key="enter" />
    <button class="save-button" type="submit" :disabled="!amount || busy">{{ busy ? '保存中…' : '保存' }}</button>
  </form>
</template>

<style scoped>
.record-editor { height:100dvh;min-height:560px;padding:calc(10px + env(safe-area-inset-top)) 14px calc(10px + env(safe-area-inset-bottom));display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto auto auto auto;gap:7px;overflow:hidden;background:var(--paper) }
.editor-header { display: grid;grid-template-columns:44px 1fr 44px; align-items: center;text-align:center }.editor-header::after{content:''}.editor-header button { width: 38px; height: 38px; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); font-size: 26px; }.editor-header strong{display:grid;font-size:17px}.editor-header strong small{color:var(--muted);font-size:9px;font-weight:500}
.type-switch { justify-self:stretch;display:grid;grid-template-columns:1fr 1fr;padding:3px;border-radius:13px;background:#f0e9e4 }.type-switch button { min-height:34px;border:0;border-radius:10px;background:transparent;font-size:13px }.type-switch button[aria-pressed=true] { background:var(--surface);color:var(--expense);box-shadow:0 2px 8px #6d493516 }
.amount-row { min-height:52px;padding:6px 14px;display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:16px;background:var(--surface);box-shadow:0 6px 18px rgba(87,57,39,.05)}.amount-row small{color:var(--muted);font-size:11px}.amount-row strong { max-width:78%;overflow:hidden;font-size:29px;color:var(--expense);font-variant-numeric:tabular-nums;text-overflow:ellipsis;white-space:nowrap }
.category-panel{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:4px;overflow:hidden}.category-grid{min-height:0;display:grid;grid-template-rows:repeat(2,minmax(0,1fr));grid-auto-flow:column;grid-auto-columns:calc((100% - 20px)/5);gap:5px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none}.category-grid::-webkit-scrollbar{display:none}.category-grid button{min-width:0;display:grid;align-content:center;gap:3px;justify-items:center;border:0;background:transparent}.category-grid span{width:clamp(36px,5.4vh,44px);height:clamp(36px,5.4vh,44px);display:grid;place-items:center;border:1px solid transparent;border-radius:13px;background:var(--surface);font-size:20px;box-shadow:0 3px 10px rgba(87,57,39,.05)}.category-grid .selected span{border-color:var(--expense);background:#fff0ed;box-shadow:0 0 0 2px #fff inset}.category-grid small{max-width:100%;overflow:hidden;color:var(--muted);font-size:9px;white-space:nowrap;text-overflow:ellipsis}
.category-title{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;font-size:11px}.category-title>small{color:var(--muted);font-size:8px}.category-title button{padding:3px 8px;border:0;border-radius:8px;background:#f0e9e4;color:var(--muted);font-size:10px}
.category-title>span{display:flex;gap:6px}.category-title small{margin-left:5px;color:var(--muted);font-weight:400}.subcategory-trigger{min-height:54px;padding:8px 13px;display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:15px;background:var(--surface);text-align:left}.subcategory-trigger span{display:grid;gap:3px}.subcategory-trigger small{color:var(--muted);font-size:10px}.subcategory-trigger strong{font-size:13px}.subcategory-trigger em{color:var(--muted);font-style:normal;font-size:11px}.sheet-overlay{position:fixed;z-index:100;inset:0;display:flex;align-items:flex-end;background:rgba(48,42,39,.45);backdrop-filter:blur(2px)}.subcategory-sheet{width:min(100%,430px);max-height:72vh;margin:0 auto;padding:14px 16px calc(18px + var(--safe-bottom));overflow:hidden;border-radius:28px 28px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.subcategory-sheet header{display:grid;grid-template-columns:42px 1fr auto;align-items:center;margin-bottom:10px}.subcategory-sheet header>button{width:36px;height:36px;border:0;border-radius:50%;background:#f1ebe7;font-size:22px;color:var(--muted)}.subcategory-sheet header>strong{text-align:center;font-size:17px}.subcategory-sheet header>span{display:flex;gap:6px}.subcategory-sheet header>span button{padding:7px 10px;border:0;border-radius:999px;background:#edf6ea;color:var(--income);font-size:11px}.subcategory-sheet header>span .add{background:#363449;color:white}.subcategory-rows{max-height:calc(72vh - 70px);overflow:auto}.subcategory-rows>button{width:100%;min-height:62px;padding:8px 5px;display:grid;grid-template-columns:48px 1fr 26px;align-items:center;gap:10px;border:0;border-bottom:1px solid var(--border);background:transparent;text-align:left}.subcategory-rows i{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#faf5f0;font-style:normal;font-size:22px}.subcategory-rows span{font-size:15px;font-weight:650}.subcategory-rows b{opacity:0;color:var(--expense)}.subcategory-rows button.selected b{opacity:1}.subcategory-rows p{padding:24px;text-align:center;color:var(--muted);font-size:11px}
.category-grid .add-category span{border:1px dashed #dfd1c8;color:var(--muted);box-shadow:none}.category-dialog{position:fixed;z-index:102;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,430px);max-height:75vh;padding:18px 18px calc(20px + var(--safe-bottom));display:grid;gap:12px;overflow:auto;border:0;border-radius:28px 28px 0 0;background:var(--surface);box-shadow:0 0 0 100vmax rgba(48,42,39,.45),0 -16px 45px rgba(42,31,25,.2)}.category-dialog header{display:flex;align-items:center;justify-content:space-between}.category-dialog header button{width:34px;height:34px;border:0;border-radius:50%;background:#f2ebe6}.category-dialog>input{min-height:42px;padding:0 12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-soft)}.icon-library{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}.icon-library button{aspect-ratio:1;padding:0;border:1px solid transparent;border-radius:10px;background:#faf5f0;font-size:18px}.icon-library button.selected{border-color:var(--expense);background:#fff0ed}.category-dialog p{margin:0;color:var(--expense);font-size:11px}.category-confirm{min-height:42px;border:0;border-radius:12px;background:var(--expense);color:white;font-weight:700}
.category-manage-list{display:grid;max-height:250px;overflow:auto}.category-manage-list>div{min-height:46px;display:grid;grid-template-columns:34px 1fr auto auto;align-items:center;gap:6px;border-bottom:1px solid var(--border)}.category-manage-list i{font-style:normal;font-size:20px}.category-manage-list button{padding:5px 8px;border:0;border-radius:8px;background:#f2ebe6;color:var(--muted);font-size:10px}.category-manage-list .remove{background:#fff0ed;color:var(--expense)}
.form-card{overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--surface)}.note-field,.date-field{min-height:46px;padding:0 13px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);font-size:12px}.date-field{border-bottom:0}.note-field textarea,.date-field input{max-width:70%;margin:0;padding:0;border:0;resize:none;background:transparent;text-align:right;color:var(--muted)}.receipt-card{padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}.receipt-card>div{display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px}.receipt-card small{color:var(--muted)}
.field-error { margin: 0; color: var(--expense); }.save-button { min-height: 50px; border: 0; border-radius: 15px; background: var(--expense); color: white; font-size: 16px; font-weight: 750;box-shadow:0 6px 16px rgba(240,123,112,.25) }.save-button:disabled { opacity: .45; }
.subcategory-trigger{min-height:38px;padding:5px 11px;border-radius:12px}.subcategory-trigger span{display:flex;align-items:center;gap:7px}.subcategory-trigger small{font-size:9px}.subcategory-trigger strong{font-size:11px}.subcategory-trigger em{font-size:10px}
.entry-tools{min-height:48px;padding:5px;display:grid;grid-template-columns:minmax(92px,1fr) minmax(112px,1.05fr) minmax(48px,.8fr);align-items:center;gap:5px;overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.note-trigger,.date-field{min-width:0;height:38px;padding:0 8px;display:flex;align-items:center;gap:5px;overflow:hidden;border:0;border-radius:10px;background:var(--surface-soft);text-align:left}.note-trigger>span,.date-field>span{flex:0 0 auto;color:var(--primary);font-size:15px}.note-trigger small{min-width:0;overflow:hidden;color:var(--muted);font-size:10px;white-space:nowrap;text-overflow:ellipsis}.date-field input{width:100%;min-width:0;margin:0;padding:0;border:0;outline:0;background:transparent;color:var(--muted);font-size:9px}.entry-tools :deep(.image-uploader){min-width:0;overflow:hidden}.entry-tools :deep(.preview-grid){overflow-x:auto;scrollbar-width:none}.entry-tools :deep(.preview-grid::-webkit-scrollbar){display:none}
.note-overlay{position:fixed;z-index:115;inset:0;display:flex;align-items:flex-end;background:rgba(48,42,39,.45);backdrop-filter:blur(2px)}.note-sheet{width:min(100%,430px);margin:0 auto;padding:18px 18px calc(20px + var(--safe-bottom));display:grid;gap:12px;border-radius:28px 28px 0 0;background:var(--surface);box-shadow:0 -16px 45px rgba(42,31,25,.2)}.note-sheet header{display:flex;align-items:center;justify-content:space-between}.note-sheet header button{padding:7px 13px;border:0;border-radius:999px;background:var(--primary);color:white}.note-sheet textarea{min-height:150px;padding:12px;border:1px solid var(--border);border-radius:14px;resize:none;background:var(--surface-soft);color:var(--text);font:inherit}
.field-error{margin:0;font-size:10px}.save-button{min-height:42px;font-size:15px}
.category-grid{grid-template-rows:repeat(3,minmax(0,1fr))}
.date-field{position:relative}.date-field small{min-width:0;overflow:hidden;color:var(--muted);font-size:10px;white-space:nowrap;text-overflow:ellipsis}.date-field input{position:absolute;inset:0;width:100%;height:100%;max-width:none;opacity:0;cursor:pointer}
</style>
