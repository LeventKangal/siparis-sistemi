<template>
  <div class="user-manager">
    <h2>Kullanıcı Listesi</h2>
    <div class="arama-kutulari">
         <input v-model="searchName" placeholder="Ad ile ara" />
         <input v-model="searchPhone" placeholder="Telefon ile ara" />
         <input v-model="searchType" placeholder="Tür (T, A, U) ile ara" />
         <button @click="clearFilters">🧹 Temizle</button>
     </div>

    <table class="user-tablosu">
      <thead>
        <tr>
          <th>Email</th>
          <th class="ad-column">Ad</th>
          <th class="tlf-column">Telefon</th>
          <th class="mail-column">Mail T-U</th>
          <th class="tur-column">Tür</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers":key="user.email">
          <td>{{ user.email}}</td>

          <td v-if="editingEmail === user.email">
            <input v-model="editName" />
          </td>
          <td v-else class="ad-column">{{ user.name}}</td>

          <td v-if="editingEmail === user.email">
            <input v-model="editPhone" />
          </td>
          <td v-else class="tlf-column">{{ user.phone}}</td>

          <td v-if="editingEmail === user.email">
            <input v-model="editSupplier" />
          </td>
          <td v-else class="sup-column">{{ user.supplier_mail}}</td>
         
          <td v-if="editingEmail === user.email">
            <input v-model="editType" />
          </td>
          <td v-else class="tur-column">{{ user.user_type}}</td>

          <td>
            <button v-if="editingEmail === user.email" @click="updateUser(user.email)">💾</button>
            <button v-if="editingEmail === user.email" @click="cancelEdit">❌</button>
            <button v-else @click="startEdit(user)">📝</button>
            <button @click="deleteUser(user.email)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

  <div class="add-user-form">
    <h3>Yeni Kullanıcı</h3>
    <input v-model="newEmail" placeholder="Email" />
    <input v-model="newName" placeholder="Ad" />
    <input v-model="newPhone" placeholder="Telefon" />
    <input v-model="newSupplier" placeholder="Mail T-U" />
    <input v-model="newType" placeholder="Tür" />
    <button @click="addUser">➕ Ekle</button>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted} from 'vue';
import { userService} from '@/services/userService';
import type { User} from '@/services/userService';

const userList = ref<User[]>([]);

const newEmail = ref('');
const newName = ref('');
const newPhone = ref('');
const newSupplier = ref('');
const newType = ref('');

const editingEmail = ref<string | null>(null);
const editName = ref('');
const editPhone = ref('');
const editSupplier = ref('');
const editType = ref('');

const searchName = ref('');
const searchPhone = ref('');
const searchType = ref('');

const filteredUsers = computed(() => {
  const nameTerm = searchName.value.trim().toLowerCase();
  const phoneTerm = searchPhone.value.trim().toLowerCase();
  const typeTerm = searchType.value.trim().toLowerCase();

  return userList.value.filter(user => {
    const nameMatch =!nameTerm || (user.name?? '').toLowerCase().includes(nameTerm);
    const phoneMatch =!phoneTerm || (user.phone?? '').toLowerCase().includes(phoneTerm);
    const typeMatch =!typeTerm || (user.user_type?? '').toLowerCase() === typeTerm;

    return nameMatch && phoneMatch && typeMatch;
});
});

function clearFilters() {
  searchName.value = '';
  searchPhone.value = '';
  searchType.value = '';
  }

function startEdit(user: User) {
  editingEmail.value = user.email;
  editName.value = user.name?? '';
  editPhone.value = user.phone?? '';
  editSupplier.value = user.supplier_mail?? '';
  editType.value = user.user_type?? '';
}

function cancelEdit() {
  editingEmail.value = null;
}

async function addUser() {
  const yeni = await userService.insertOne({
    email: newEmail.value,
    name: newName.value,
    phone: newPhone.value,
    supplier_mail: newSupplier.value,
    user_type: newType.value
});
  if (yeni) {
    userList.value.push(yeni);
    newEmail.value = '';
    newName.value = '';
    newPhone.value = '';
    newSupplier.value = '';
    newType.value = '';
}
}

async function updateUser(email: string) {
  const updated = await userService.updateById(email, {
    name: editName.value,
    phone: editPhone.value,
    supplier_mail: editSupplier.value,
    user_type: editType.value
});
  if (updated) {
    const i = userList.value.findIndex(u => u.email === email);
    userList.value[i] = updated;
    cancelEdit();
}
}

async function deleteUser(email: string) {
  if (confirm('Bu kullanıcı silinsin mi?')) {
    const ok = await userService.deleteById(email);
    if (ok) userList.value = userList.value.filter(u => u.email!== email);
}
}

//onMounted(async () => {
//  userList.value = await userService.getAll();
//});

onMounted(async () => {
  const users = await userService.getAll();
  userList.value = users.sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<style scoped>

.user-manager {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}

.user-tablosu th,
.user-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}
.tur-column {
  text-align: center;
  width: 45px;
}
.tur-column input {
  max-width: 100%;
  width: 35px;
  min-width: 25px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.arama-kutulari {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.arama-kutulari input {
  flex: 1;
  padding: 6px;
  font-size: 14px;
}
.arama-kutulari button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}
</style>