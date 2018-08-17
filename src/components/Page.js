import { h } from 'hyperapp'
import picostyle from 'picostyle'
import { styler, spring, value, listen, pointer, chain } from 'popmotion'
import { snap } from 'popmotion/lib/transformers'
import { smooth } from 'popmotion/lib/calc'

const style = picostyle(h)

function makeInteractive (element) {
  element.style.transform = 'translateX(100%)'

  const AXIS_LOCK_THRESHOLD = 15
  let isAxisLocked = false
  const handleStyler = styler(element)
  const handleX = value(0, handleStyler.set('x'))

  const pointerX = (preventDefault = false) => pointer({x: 0, preventDefault: preventDefault}).pipe(val => val.x).filter(x => x > 0)

  // Initial slide-in
  spring({
    from: {x: '100%'},
    to: {x: 0},
    damping: 20,
    mass: 0.5
  }).start(handleStyler.set)
  let handleSub
  // Swipe-mechanism
  listen(element, 'mousedown touchstart')
    .start((e) => {
      if (handleX.get() > 0) {
        handleSub.unsubscribe()
      }
      let currentPointer
      currentPointer = chain(pointerX(), smooth(30)).start((x) => {
        if (Math.abs(x) <= AXIS_LOCK_THRESHOLD) {
          return
        }

        window.clickLock = true
        isAxisLocked = true
        currentPointer.stop()

        currentPointer = chain(pointerX(true), smooth(30)).start(handleX)
      })

      let upListener = listen(element, 'mouseup touchend')
        .start((e) => {
          if (!isAxisLocked) {
            currentPointer.stop()
            upListener.stop()
            return
          }

          upListener.stop()
          currentPointer.stop()

          let currentPos = handleX.get()
          let velocity = handleX.getVelocity()
          let isGoingBack = Boolean(!snap([
            0,
            (document.body.clientWidth / 1.5)
          ])(currentPos + velocity))
          let pageWidth = document.body.clientWidth

          handleSub = handleX.subscribe(val => {
            console.log(val)
            if (val >= pageWidth) {
              console.log('Way to often: ', val)
              handleSub.unsubscribe()
              window.clickLock = false
              stopSpring()
              
              window.flamous.killPage()
            } else if (val === 0) {
              handleSub.unsubscribe()
              window.clickLock = false
            }
          })
          let {stop: stopSpring} = spring({
            from: currentPos,
            to: !isGoingBack ? pageWidth * 1.2 : 0,
            damping: 20,
            mass: 0.5,
            velocity: velocity
          }).start(handleX)
        })
    })
}

const Page = (props, children) => style('article')({
  height: '100%',
  width: '100%',
  position: 'absolute',
  overflowY: 'auto',
  color: '#212121',
  backgroundColor: 'white',
  boxShadow: '0 0 2px 0 #848484'
})({
  oncreate: !props.hasOwnProperty('nonInteractive') && makeInteractive
}, <div>
  {children}
</div>
)

export default Page
