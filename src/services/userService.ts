import { createGenericService} from '@/services/genericService.js';



export interface User {
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  supplier_mail?: string;
  user_type?: string;
}


export const userService = createGenericService<User>('users' , 'email');