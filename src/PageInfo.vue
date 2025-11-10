<template>
  <div class="container">
    
    <ImageGallery />
   
    <!--<div>
      <p v-if="companyName === 'geto'">
        Bize bu <strong>Kullanıcı bilgi notlarını</strong> hazırlayan sevgili
        <strong>Getocan Bekir Pilavcılar</strong>'a teşekkür ederim.
      </p>
      <p style="margin-bottom: 32px;"></p>  
    </div>-->
    </div>
  
</template>

<script setup>
import { ref} from 'vue';
import ImageGallery from '@/components/ImageGallery.vue';


const companyName = ref(localStorage.getItem('companyName') || '');



</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
  background-color: #fff;
  padding: 40px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  border-radius: 8px;
  font-family: Arial, sans-serif;
  color: #333;
}

h1 {
  color: #0077cc;
}

p {
  line-height: 1.6;
}
</style>
