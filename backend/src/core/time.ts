export function timeToMinutes(value:string):number{const time=value.includes('T')?value.split('T')[1]?.slice(0,5):value.slice(0,5);const[h,m]=(time||'00:00').split(':').map(Number);return h*60+m}
export function minutesToTime(minutes:number):string{const safe=((minutes%1440)+1440)%1440;return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`}
export function shiftTime(value:string,delta:number):string{return minutesToTime(timeToMinutes(value)+delta)}
export function availableMinutes(departure:string,arriveBy?:string):number{if(!arriveBy)return Number.POSITIVE_INFINITY;let end=timeToMinutes(arriveBy);const start=timeToMinutes(departure);if(end<start)end+=1440;return end-start}
