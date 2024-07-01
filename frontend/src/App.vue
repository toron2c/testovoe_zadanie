<template>
  <div class="app" v-if="!isError">
    <HeaderComponent :fetchData="fetchData" />
    <a-spin :spinning="isLoad">
      <a-table
        :dataSource="arr"
        :columns="columns"
        rowKey="id"
        :pagination="false"
        :expandRowByClick="true"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :style="{ backgroundColor: record.pipeline.color, color: '#000' }">{{
              record.pipeline.name
            }}</a-tag>
          </template>
          <template v-else-if="column.key === 'responsible_user'">
            <UserOutlined class="icon__blue" /> {{ record.responsible_user }}
          </template>
          <template v-else-if="column.key === 'created'">
            {{ record.created }}
          </template>
          <template v-else>
            {{ record[column.dataIndex] }}
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <div v-if="record.contacts && record.contacts.length">
            <p><strong>Контакты:</strong></p>
            <ul class="contacts-list">
              <li
                class="contacts-list__item"
                v-for="contact in record.contacts"
                :key="contact.email"
              >
                <UserOutlined class="icon__gray" />
                <div>
                  <strong>{{ contact.name }}</strong>
                </div>
                <div>
                  <a :href="`mailto:${contact.email}`"><MailOutlined /></a>
                </div>
                <div>
                  <a :href="`tel:${contact.phone}`"><PhoneOutlined /></a>
                </div>
              </li>
            </ul>
          </div>
          <div v-else>
            <p>Без контакта</p>
          </div>
        </template>
        <template #expandColumnTitle></template>
      </a-table>
    </a-spin>
  </div>
  <template v-else>
    <a-result
      status="error"
      title="Ошибка"
      sub-title="Не удалось получить данные. Пожалуйста, попробуйте позже."
    >
      <template #extra>
        <a-button @click="reloadPage" key="buy">Повторить</a-button>
      </template>
    </a-result>
  </template>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons-vue'
import type { Contact } from './models/ContactType'
import type { Deal } from './models/DealInterface'

const isLoad = ref(false)
const isError = ref(false)
const arr = ref<Deal[]>([])

const columns = [
  {
    title: 'Название',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Бюджет',
    dataIndex: 'price',
    key: 'price'
  },
  {
    title: 'Статус',
    key: 'status'
  },
  {
    title: 'Ответственный',
    dataIndex: 'responsible_user',
    key: 'responsible_user'
  },
  {
    title: 'Дата создания',
    dataIndex: 'created',
    key: 'created'
  }
]
// get leads
const fetchData = async (query: string = '') => {
  try {
    isError.value = false
    isLoad.value = true
    const res = await axios.get(`http://localhost:3000/api/leads${query}`)
    if (res.data && res.data.leads) {
      arr.value = res.data.leads.map((el: any) => {
        return {
          ...el,
          created: new Date(el.created).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          contacts: el.contacts ? el.contacts.map((contact: any) => transformData(contact)) : []
        }
      })
    } else {
      arr.value = []
    }
  } catch (error) {
    isError.value = true
  } finally {
    isLoad.value = false
  }
}
// update page if error
const reloadPage = () => {
  window.location.reload()
}

// set data cotact field for render
const transformData = (data: any): Contact => {
  const contact: Contact = {
    name: '',
    phone: '',
    email: ''
  }
  if (data && Array.isArray(data.fields)) {
    data.fields.forEach((item: any) => {
      if (item.link === 'PHONE' && item.value && item.value.length > 0) {
        contact.phone = item.value[0]
      } else if (item.link === 'EMAIL' && item.value && item.value.length > 0) {
        contact.email = item.value[0]
      }
    })
  }
  contact.name = data?.name ? data?.name : ''
  return contact
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.app {
  max-width: 1400px;
  margin: 0 auto;
}
.icon__blue {
  background-color: blue;
  color: #fff;
  border-radius: 50%;
}
.icon__gray {
  background-color: #ccc;
  color: #fff;
  border-radius: 50%;
}
.contacts-list {
  list-style-type: none;
}
.contacts-list__item {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
