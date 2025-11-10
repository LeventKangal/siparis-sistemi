<template>
  <div class="container">
    <h1>Hakkımızda</h1>
    <p>Temiz ve adil gıda paylaşımı için buradayız...</p>
    <p>Bu platform, siparişlerin kolayca alınmasını sağlar...</p>
    <p>Birlikte daha sağlıklı ve dayanışma dolu bir gelecek inşa ediyoruz.</p>

    <p>Merhaba! Ben [Levent Kangal], bu web sitesinin kodlayıcısıyım.</p>
    <p>Amacım; ilham verici ve bilgilendirici içerikler sunmak.</p>
    <p>Daha fazla bilgi için <a href="mailto:levent.kangal@gmail.com">bana ulaşın</a>.</p>

   

  </div>
</template>

<script>

import { useRouter} from 'vue-router';



export default {
  name: "PageAbout",
  setup() {
    const router = useRouter();
   
    function goToInfo() {
      router.push('/info');
}

    return {
      goToInfo
};
}
};
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  background-color: #f6f6f6;
  color: #333;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: auto;
  background-color: #fff;
  padding: 40px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  border-radius: 8px;
}

h1 {
  color: #0077cc;
}

p {
  line-height: 1.6;
}

button {
  margin-top: 30px;
  padding: 12px 24px;
  font-size: 16px;
  background-color: #0077cc;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #005fa3;
}
</style>




