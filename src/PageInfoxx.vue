<template>
  <div class="container">
    <h1>Kullanıcı Klavuzu</h1>

    <!-- 📘 HTML Görünüm -->
    <section class="html-section">
      <h2>📘 HTML Görünüm</h2>
      <div v-html="guideContent"></div>
    </section>

    <!-- 📥 Dosya İndirme Seçenekleri -->
    <section class="download-section">
      <h2>📥 Dosya İndirme</h2>
      <ul>
        <li><a href="/docs/kullanim-klavuzu.pdf" target="_blank">📑 PDF olarak görüntüle</a></li>
        <li><a href="/docs/kullanim-klavuzu.pdf" download>📥 PDF indir</a></li>
        <li><a href="/docs/kullanim-klavuzu.docx" download>📄 Word (.docx) indir</a></li>
      </ul>
    </section>

    <!-- 📑 PDF Görüntüleme -->
    <section class="pdf-section">
      <h2>📑 PDF Görünüm</h2>
      <iframe
        src="/docs/kullanim-klavuzu.pdf"
        width="100%"
        height="600px"
        style="border: none;"
></iframe>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import guideHtml from '@/assets/guide.html?raw'; // HTML içeriği düz metin olarak import edilir

const guideContent = ref('');

onMounted(() => {
  guideContent.value = guideHtml;
});
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
  color: #333;
}

h1, h2 {
  color: #0077cc;
  margin-bottom: 16px;
}

.download-section ul {
  list-style: none;
  padding: 0;
}

.download-section li {
  margin-bottom: 8px;
}

a {
  color: #0077cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.html-section {
  margin-bottom: 32px;
}

.pdf-section {
  margin-top: 32px;
}
</style>