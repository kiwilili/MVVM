class Compile{
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el) // #app document 判断 el 类型
    this.vm = vm
    if (this.el) {
      // 如果有这个元素能获取到 才开始编译
      // 1、先把真是dom放到内存中 fragment
      let fragment = this.node2fragment(this.el)
      
      // 2、编译 => 提取想要的元素节点 v-model 和 文本节点 {{}}
      this.compile(fragment)

      // 3、把编译好的fragment在塞回页面里
      this.el.appendChild(fragment)
    }
  }
  /* 专门写一些辅助方法 */
  isElementNode(node) {
    return node.nodeType === 1
  }
  // 是不是指令
  isDirective(name) {
    return name.includes('v-')
  }



  /* 核心的方法 */
  compileElement(node) {
    let attrs = node.attributes // 取出节点的属性
    Array.from(attrs).forEach((attr) => {
      // 判断属性名字是不是包含v-
      let attrName = attr.name
      if(this.isDirective(attrName)) {
        // 取对应的值放在节点中
        let expr = attr.value
        // let type = attrName.slice(2)
        let [, type] = attrName.split('-')
        // node this.vm.$data
        CompileUtil[type](node, this.vm, expr)
      }
    })
  }
  compileText(node) {
    // 带{{}}
    let expr = node.textContent //取文本中内容
    let reg = /\{\{([^}]+)\}\}/g // {{a}} {{b}} {{c}}
    if(reg.test(expr)) {
      // node this.vm.$data text
      CompileUtil['text'](node, this.vm, expr)
    }
  }
  compile(fragment) {
    // 需要递归
    let childNodes = fragment.childNodes
    Array.from(childNodes).forEach((node) => {
      if (this.isElementNode(node)) {
        // 是元素节点, 还需要继续深入的检查
        // 这里需要编译元素
        this.compileElement(node)
        if (node.childNodes) {
          this.compile(node)
        }
      } else {
        // 文本节点
        // 这里需要编译文本
        this.compileText(node)
      }
    })
  }
  node2fragment(el) { //需要将el中内容全部放在内存中
    // 文档碎片 内存中的dom节点
    let fragment = document.createDocumentFragment()
    let firstChild
    while(firstChild = el.firstChild) {
      fragment.appendChild(firstChild)
    }
    return fragment // 内存中的节点
  }
}

CompileUtil = {
  getVal(vm, expr) { //获取实例上对应数据
    expr = expr.split('.') // [a, v, b, f, y]
    return expr.reduce((prev, next) => {
      return prev[next]
    }, vm.$data)
  },
  getTextVal(vm, expr) { //获取编译文本后的结果
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      return this.getVal(vm, arguments[1])
    })
  },
  text(node, vm, expr) { //文本处理
    let updaterFn = this.updater['textUpdater']
    // // vm.$data[expr]
    let value = this.getTextVal(vm, expr)
    // {{a}} {{b}}
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      new Watcher(vm, arguments[1], (newValue) => {
        updaterFn && updaterFn(node, this.getTextVal(vm, expr))
      })
    })
    updaterFn && updaterFn(node, value)
  },
  setVal(vm, expr, value) {
    expr = expr.split('.')
    // 收敛
    return expr.reduce((prev, next, currentIndex) => {
      if(currentIndex == expr.length -1) {
        return prev[next] = value
      }
      return prev[next]
    }, vm.$data)
  },
  model(node, vm, expr) { // 输入框处理
    let updaterFn = this.updater['modelUpdater']
    // vm.$data[expr]
    // 这里加一个监控 数据变化了 调用 watch 的 callback
    new Watcher(vm, expr, (newValue) => {
      updaterFn && updaterFn(node, this.getVal(vm, expr))
    })
    node.addEventListener('input', (e) => {
      let newValue = e.target.value
      this.setVal(vm, expr, newValue)
    })
    updaterFn && updaterFn(node, this.getVal(vm, expr))
  },
  updater: {
    // 文本更新
    textUpdater(node, value) {
      node.textContent = value
    },
    // 数据更新
    modelUpdater(node, value) {
      node.value = value
    }
  }
}