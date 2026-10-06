import type { APIGatewayProxyResult } from 'aws-lambda';
export function json(statusCode:number,body:unknown):APIGatewayProxyResult{return{statusCode,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body:JSON.stringify(body)}}
export function body<T>(raw:string|null):T{if(!raw)throw new Error('Request body is required');return JSON.parse(raw) as T}
