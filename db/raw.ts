import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Dữ liệu chưa sẵn sàng. Vui lòng thử lại.');return env.DB;}
