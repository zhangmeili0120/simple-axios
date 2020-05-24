
const utils = {
  extend: function(a, b, context) {
    for(let key in b) {
      if (b.hasOwnProperty(key)) {
        // 混入方法
        if (typeof b[key] === 'function') {
          a[key] = b[key].bind(context);
        } else {
          // 混入属性
          a[key] = b[key]
        }
      }
    }
  }
}

class InterceptorsManager {
  constructor() {
    this.handlers = [];
  }

  use(fullfiled, rejected) {
    this.handlers.push({fullfiled, rejected})
  }
}

class Axios {
  constructor() {
    this.test = '123'
    this.interceptors = {
      request: new InterceptorsManager,
      response: new InterceptorsManager
    }
  }

  request(config) {
    // 执行该方法时候执行拦截器，操作一个队列的方式去执行
    let chain = [this.xhrFn.bind(this), undefined] // 先不执行，队列组装好才执行
    // 请求拦截器
    this.interceptors.request.handlers.forEach(int => {
      chain.unshift(int.fullfiled, int.rejected);
    })

    // 响应拦截器
    this.interceptors.response.handlers.forEach(int => {
      chain.push(int.fullfiled, int.rejected);
    })
    console.log(chain);
    // 执行队列
    
    let promise = Promise.resolve(config);
    while(chain.length > 0) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    return promise;
    
  }


  xhrFn(config) {
    return new Promise(resolve => {
      const {url = '', method = 'get', data = {}} = config;
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.onload = function() {
        resolve(xhr.response)
      }
      xhr.setRequestHeader('Content-Type', "application/json")
      xhr.send(JSON.stringify(data));
      
      // 发现问题1: Cannot read property 'test' of undefined
      console.log('执行 request', this.test)
    })
  }
}

const methodsArr = ['get', 'delete', 'options', 'head', 'post', 'put','patch'];
methodsArr.forEach(method => {
  Axios.prototype[method] = function() {
    console.log('执行了'+method+'方法', this.test);
    if (['get','delete','head','options'].includes(method)) { // 2个参数(url[, config])
      const config = {
        url: arguments[0],
        method: method,
        ...arguments[1] || {}
      }
      console.log(config,'config');
      
      return this.request(config)
    } else { // 3个参数(url[, data[, config]])
      return this.request({
        url: arguments[0],
        method: method,
        data: arguments[1],
        ...arguments[2]
      })
    }
  }
})

function createInstance() {
  let axios = new Axios();
  // console.log(Axios.prototype); // 原型上有get, post等方法
  // console.dir(axios.request); // 实例上的方法
  // 目的：把原型上的方法，都混入到方法request中去。
  // js中一切皆对象，request方法也是对象，作为对象添加几个方法是ok的
  // const req = axios.request;
  
  const req = axios.request.bind(axios);// 解决问题1: 把this(实例化对象)绑定到request方法。
  // 混入get, post等方法
  utils.extend(req, Axios.prototype, axios);
  // 混入类的属性,也是实例对象的属性
  utils.extend(req, axios);
  return req;// 返回混合后的request方法
}
// axios其实就是一个放在类里的方法，
// 等同于axios = function(){};axios['get'] = funcition(){}...
// 好处就是：既可以用axios方法，也可以用axios.get, axios.post ...方法
let axios = createInstance();
// axios()
console.dir(axios)
// axios.get()// 发现问题2: axios.get is not a function




