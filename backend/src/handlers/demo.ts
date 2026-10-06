import { json } from '../http'; import { demoDay } from '../core/demo'; export const handler=async()=>json(200,demoDay());
