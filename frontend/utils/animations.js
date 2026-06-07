/**
 * 页面动画工具
 * 提供统一的动画效果
 */

/**
 * 页面进入动画配置
 */
const PAGE_ENTER_ANIMATION = {
  duration: 400,
  timingFunction: 'ease-out',
  transformOrigin: '50% 50%'
}

/**
 * 列表项交错动画
 * @param {Object} page - 页面实例
 * @param {string} selector - 元素选择器
 * @param {number} delay - 每项延迟（毫秒）
 * @param {string} type - 动画类型: 'fadeUp' | 'fadeIn' | 'scale' | 'slideRight'
 */
function animateList(page, selector, delay = 50, type = 'fadeUp') {
  const animation = wx.createAnimation(PAGE_ENTER_ANIMATION)

  // 获取元素并依次动画
  wx.createSelectorQuery()
    .in(page)
    .selectAll(selector)
    .boundingClientRect()
    .exec((res) => {
      if (res[0] && res[0].length > 0) {
        res[0].forEach((item, index) => {
          const timeout = setTimeout(() => {
            animateItem(animation, type)
            // 这里不能直接应用到单个元素，需要通过 data 驱动
          }, index * delay)
        })
      }
    })
}

/**
 * 单个元素动画
 */
function animateItem(animation, type) {
  switch (type) {
    case 'fadeUp':
      animation.opacity(1).translateY(0).step()
      break
    case 'fadeIn':
      animation.opacity(1).step()
      break
    case 'scale':
      animation.opacity(1).scale(1).step()
      break
    case 'slideRight':
      animation.opacity(1).translateX(0).step()
      break
    default:
      animation.opacity(1).translateY(0).step()
  }
  return animation.export()
}

/**
 * 页面进入动画数据初始化
 * 用于页面 data 初始化
 */
function getInitialAnimationData() {
  return {
    _pageAnim: null,
    _listAnims: []
  }
}

/**
 * 创建卡片点击动画
 * @returns {Object} 动画实例
 */
function createCardTapAnimation() {
  return wx.createAnimation({
    duration: 150,
    timingFunction: 'ease-in-out'
  })
}

/**
 * 卡片按下动画
 */
function cardPressAnim() {
  const anim = createCardTapAnimation()
  anim.scale(0.97).opacity(0.9).step()
  return anim.export()
}

/**
 * 卡片释放动画
 */
function cardReleaseAnim() {
  const anim = createCardTapAnimation()
  anim.scale(1).opacity(1).step()
  return anim.export()
}

/**
 * 按钮点击波纹效果数据
 */
function getRippleData() {
  return {
    _rippleX: 0,
    _rippleY: 0,
    _rippleShow: false
  }
}

/**
 * 触发波纹效果
 * @param {Object} page - 页面实例
 * @param {Object} e - 事件对象
 */
function triggerRipple(page, e) {
  const touch = e.touches[0]
  page.setData({
    _rippleX: touch.clientX - 50,
    _rippleY: touch.clientY - 50,
    _rippleShow: true
  })

  setTimeout(() => {
    page.setData({ _rippleShow: false })
  }, 600)
}

/**
 * 页面切换动画配置
 * 用于 navigateTo / navigateBack 等
 */
const ROUTE_ANIMATION = {
  // 进入页面
  enter: {
    duration: 300,
    timingFunction: 'ease-out'
  },
  // 退出页面
  exit: {
    duration: 250,
    timingFunction: 'ease-in'
  }
}

module.exports = {
  PAGE_ENTER_ANIMATION,
  animateList,
  getInitialAnimationData,
  createCardTapAnimation,
  cardPressAnim,
  cardReleaseAnim,
  getRippleData,
  triggerRipple,
  ROUTE_ANIMATION
}
