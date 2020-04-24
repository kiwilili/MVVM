class Observer{
  constructor(data) {
    this.observer(data)
  }
  observer(data) {
    // 要对data数据将原有的属性改成 get 和 set 的形式
    if (!data || typeof data !== 'object') {
      return 
    }
    // 要将数据一一劫持 先获取到 data 的 key 与 value
    Object.keys(data).forEach(key => {
      // 劫持
      this.defineReactive(data, key, data[key])
      this.observer(data[key]) // 深度递归劫持
    })

  }
  // 定义响应式
  defineReactive(obj, key, value) {
    let that = this
    let dep = new Dep(); // 每个变化的数据 都对应一个数组 数组存放所有更新操作
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set(newValue) {
        if (newValue != value) {
          // 这里 this 不是实例
          that.observer(newValue) // 如果是对象继续劫持
          value = newValue
          dep.notify()
        }
      }
    })
  }
}


class Dep {
  constructor() {
    // 订阅的数组
    this.subs = []
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}