import { isArray } from "@vue/shared";

// 获取最长递增子序列的索引 （ vue需要的是索引 ）
let start: number;
let end: number;
let middle: number;
export function getSequenceIndex(arr) {
  // 贪心算法 + 二分查找 + 前置节点追溯
  let result = [0]; // 默认放入索引0
  let p = arr.slice(0); // 标记索引，不用关心里面放的啥，长度要跟arr的长度相同
  for (let i = 0; i < arr.length; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      // 只是 vue 不需要 0
      let resultLastLength = result[result.length - 1]
      if (arrI > arr[resultLastLength]) {
        result.push(i); // 只要当前索引大于数组中的最后一个值就添加进去
        p[i] = result[result.length - 2]; 
        // 当前放到末尾的记住她前面的那个人是谁(也可以用resultLastLength,个人感觉push完-2好理解一些，其实是一样的)
        continue;
      } else {

        // 二分查找 在结果集中找到比当前值大的，用当前的索引值将其替换掉
        start = 0;
        end = result.length - 1;
        while (start < end) {
          // start等于end就停止
          middle = ((start + end) / 2) | 0; // | 0 就是取整
          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
        // 找到中间值后，需要做替换操作
        if (arr[result[end]] > arrI) {
          result[end] = i;
          p[i] = result[end-1] // 替换后 记录上一个的索引
        }
      }
    }
  }
  // 位置还原 
  // 此时，序列的个数是正确的，但是值不对。
  // 最后一项一定是对的,通过标记索引的方式将结果还原

  let i = result.length 
  let last = result[i-1] // 最后一项是确定的
  while( i-- > 0) { // 倒叙追溯
     result[i] = last
     last = p[last] // 去p（p里放的都是上一项的索引）里面找最后一项对应的索引 重置 last
  }

  return result;
}



export function getSequence(arr) {
    if(!arr || !isArray(arr)) return arr
    let result = [arr[0]]
    let p = arr.slice(0)
    for(let i=0; i<arr.length; i++) {
       let arrI = arr[i]
       if(arrI > result[result.length-1]) {
          result.push(arrI)
       }else if(arrI < result[result.length-1]) {
           start = 0;
           end = result.length-1;
           while(start < end) {
              middle = (start+end) / 2 | 0
              if(result[middle] < arrI) {
                 start = middle + 1
              }else {
                 end = middle
              }
           }
           result[end] = arrI
       }
    }
    return result
}

console.log('getSequence([5,3,4,2,7,11,16,9,15,19,2])',
getSequence([5,3,4,2,7,11,16,9,15,19,2]))