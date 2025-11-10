<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Giriş Yap</h2>
      <p class="info-text">
  Lütfen e-posta adresinizi girin ve ait olduğunuz topluluğu seçerek giriş yapın.
</p>
      <p class="info-text1">
  Bu ekran üzerinden haftalık toplantı sistemine erişim sağlayabilirsiniz.
</p>
      <p class="info-text2">
  Sorun yaşıyorsanız;
  </p>
      <p class="info-text3">Levent Kangal (532)313 95 17</p>
    <!--  <p class="info-text4">Bekir Pilavcılar (533)473 01 39</p> -->

      <input type="email" v-model="email" placeholder="E-posta adresiniz" />

      <select v-model="selectedCompany">
        <option disabled value="">Topluluk seçin</option>
        <option v-for="company in companyList" :key="company" :value="company">
          {{ company}}
        </option>
      </select>
      <label class="remember-me">
         <input type="checkbox" v-model="rememberMe" />Hatırla beni
      </label>

      <button @click="handleLogin">Devam Et</button>

      <p v-if="errorMessage" class="error-message">{{ errorMessage}}</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref} from 'vue';
import { loginUser} from '@/services/authService';
import { useRouter} from 'vue-router';
import { watch, onMounted} from 'vue';


const rememberMe = ref(false);
const email = ref('');
const companyName = ref(''); // 👈 artık global olarak sadece companyName
const errorMessage = ref('');
const router = useRouter();
const companyList = ref([
  'ggt',
  'bitot',
  'geto',
  'seferihisar'

]);

const selectedCompany = ref('');
const companyMap: Record<string, string> = {
  ggt: 'ggt',
  bitot: 'bitot',
  geto: 'geto',
  seferihisar: 'sgt'
};

watch(selectedCompany, (selected) => {
  companyName.value = companyMap[selected] || '';
});


onMounted(() => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  const savedCompany = localStorage.getItem('rememberedCompany');
  const savedRememberMe = localStorage.getItem('rememberMe');

  if (savedRememberMe === 'true') rememberMe.value = true;
  if (savedEmail) email.value = savedEmail;
  if (savedCompany) {
    companyName.value = savedCompany;

    // 🔁 Ters eşleştirme: 'sgt' → 'seferihisar'
    const reverseMap = Object.entries(companyMap).find(
      ([key, value]) => value === savedCompany
);
    if (reverseMap) selectedCompany.value = reverseMap[0];
}
});



async function handleLogin() {
  if (!email.value ||!companyName.value) {
    errorMessage.value = 'Lütfen geçerli e-posta ve topluluk adı giriniz.';
    return;
}

  const result = await loginUser(email.value, companyName.value); // ✅ sadeleştirilmiş parametre

  if (result.error) {
    errorMessage.value = result.error;
    return;
}

if (rememberMe.value) {
  localStorage.setItem('rememberedEmail', email.value);
  localStorage.setItem('rememberedCompany', companyName.value);
} else {
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberedCompany');
}


  // 👇 Tüm kayıtları companyName ismiyle tutuyoruz
  localStorage.setItem('userEmail', result.email);
  localStorage.setItem('userName', result.name);
  localStorage.setItem('meetId', result.meetId);
  localStorage.setItem('weekId', result.weekId);
  localStorage.setItem('userType', result.user_type);
  localStorage.setItem('companyName', result.companyName || companyName.value);

  localStorage.setItem('rememberMe', rememberMe.value? 'true': 'false');

  router.push({ name: 'dashboard'});
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');



.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(to right, #a1c4fd, #c2e9fb);
  font-family: 'Inter', sans-serif;
}

.login-card {
  background-color: white;
  width: 100%;
  max-width: 400px;
  padding: 30px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideUp 0.4s ease-in;
}

.login-card h2 {
  text-align: center;
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 10px;
}

.login-card input {
  padding: 14px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.login-card select {
  padding: 14px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
  height: 48px; /* Yüksekliği artırdık */
  appearance: none;
}

.login-card button {
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background-color: #0077cc;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-card button:hover {
  background-color: #005fa3;
}

.error-message {
  color: #cc0000;
  text-align: center;
  font-size: 0.9rem;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
}
  to {
    opacity: 1;
    transform: translateY(0);
}
}

/* Responsive tweaks */
@media screen and (max-width: 480px) {
.login-card {
    padding: 24px 16px;
}

.login-card h2 {
    font-size: 1.4rem;
}

.login-card input,
.login-card button {
    font-size: 0.95rem;
}
}

.info-text {
  font-size: 0.95rem;
  color: #555;
  text-align: center;
  margin-bottom: 10px;
}
.info-text1 {
  font-size: 0.95rem;
  color: #555;
  text-align: center;
  margin-bottom: 10px;
}
.info-text2 {
  font-size: 0.95rem;
  color: #555;
  text-align: center;
  margin-bottom: 5px;
}
.info-text3 {
  font-size: 0.80rem;
  color: #555;
  text-align: center;
  margin-bottom: 0;
  line-height: 0;
}
.info-text4 {
  font-size: 0.80rem;
  color: #555;
  text-align: center;
  margin-bottom: 10px;
}
.remember-me {
  font-size: 0.9rem;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

</style>
