import mojs from 'mo-js'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styles from './index.css'

// Custom Hook for animation
const useClapAnimation = ({ clapEl, countEl, totalEl }) => {
  const [animationTimeline, setAnimationTimeline] = useState(() => new mojs.Timeline())

  // animation
  useLayoutEffect(() => {
    // prevent useEffect to continue with empty values
    // early return to avoid null pointer exception
    if (!(clapEl && countEl && totalEl)) return

    const tlDuration = 300
    // first clap animation
    const scaleButton = new mojs.Html({
      el: clapEl,
      duration: tlDuration,
      scale: { 1.3: 1 },
      easing: mojs.easing.ease.out,
    })

    // corrects the first scale render
    if (typeof clapEl === 'string') {
      const clap = document.getElementById('clap')
      clap.style.transform = 'scale(1,1)'
    } else {
      clapEl.style.transform = 'scale(1,1)'
    }
    // count total
    const countTotalAnimation = new mojs.Html({
      el: totalEl,
      opacity: { 0: 1 },
      delay: (3 * tlDuration) / 2,
      duration: tlDuration,
      y: { 0: -3 },
      easing: mojs.easing.ease.out,
    })

    // clap count animation
    const countAnimation = new mojs.Html({
      el: countEl,
      opacity: { 0: 1 },
      y: { 0: -30 },
      duration: tlDuration,
    }).then({
      // mojs return a thenable obj, so we can chain like this
      // to perform animation after the initial animation
      opacity: { 1: 0 },
      y: -80,
      delay: tlDuration / 2,
    })

    // triangle burst
    const triangleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 95 },
      count: 5,
      angle: 30,
      children: {
        shape: 'polygon',
        radius: { 6: 0 },
        stroke: 'rgba(211,54, 0,0.5)',
        strokeWidth: 2,
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    })

    const circleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 75 },
      angle: 25,
      // duration: tlDuration,
      children: {
        shape: 'circle',
        fill: 'rgba(149,165,166,0.5)',
        delay: 30,
        speed: 0.2,
        radius: { 3: 0 },
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    })

    // ----------

    // add animations to pool
    const newAnimationTimeline = animationTimeline.add([
      scaleButton,
      countTotalAnimation,
      countAnimation,
      triangleBurst,
      circleBurst,
    ])

    setAnimationTimeline(newAnimationTimeline)
    // set elements as dependencies to re call the hook once they are load with data
  }, [clapEl, countEl, totalEl])

  return animationTimeline
}

const MediumClapContext = createContext()
const { Provider } = MediumClapContext
const MediumClap = ({ children, onClap, style: userStyles = {} }) => {
  const MAXIMUM_USER_CLAP = 50
  const initialState = {
    count: 0,
    countTotal: 270,
    isClicked: false,
  }
  const [clapState, setClapState] = useState(initialState)
  const { count } = clapState
  // refs to apply animation
  const [{ clapRef, clapCountRef, clapTotalRef }, setRefState] = useState({})
  const setRef = useCallback((node) => {
    setRefState((prev) => ({ ...prev, [node.dataset.keyref]: node }))
  }, [])

  const animationTimeline = useClapAnimation({ clapEl: clapRef, countEl: clapCountRef, totalEl: clapTotalRef })

  // used to prevent initial call
  const componentJustMounted = useRef(true)
  // lifting state up
  useEffect(() => {
    // prevents initial call
    if (!componentJustMounted.current) {
      onClap && onClap(clapState)
    }
    // useRef does not trigger re-renders
    componentJustMounted.current = false
  }, [count])

  const handleClapClick = () => {
    animationTimeline.replay()
    setClapState((prev) => ({
      count: Math.min(prev.count + 1, MAXIMUM_USER_CLAP),
      countTotal: count < MAXIMUM_USER_CLAP ? prev.countTotal + 1 : prev.countTotal,
      isClicked: true,
    }))
  }

  const memoizedValue = useMemo(() => ({ ...clapState, setRef }), [setRef, clapState])
  return (
    <Provider value={memoizedValue}>
      <button ref={setRef} data-keyref='clapRef' className={styles.clap} onClick={handleClapClick} style={userStyles}>
        {children}
      </button>
    </Provider>
  )
}

// subcomponents
const ClapIcon = ({ style: userStyles = {} }) => {
  const { isClicked } = useContext(MediumClapContext)
  return (
    <span>
      <svg
        style={userStyles}
        xmlns='http://www.w3.org/2000/svg'
        viewBox='-549 338 100.1 125'
        className={`${styles.icon} ${isClicked && styles.checked}`}
      >
        <path d='M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z' />
        <path d='M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9' />
      </svg>
    </span>
  )
}

const ClapCount = ({ style: userStyles = {} }) => {
  const { count, setRef } = useContext(MediumClapContext)
  return (
    <span ref={setRef} data-keyref='clapCountRef' className={styles.count} style={userStyles}>
      +{count}
    </span>
  )
}

const CountTotal = ({ style: userStyles = {} }) => {
  const { countTotal, setRef } = useContext(MediumClapContext)
  return (
    <span ref={setRef} data-keyref='clapTotalRef' className={styles.total} style={userStyles}>
      {countTotal}
    </span>
  )
}

MediumClap.Icon = ClapIcon
MediumClap.Count = ClapCount
MediumClap.Total = CountTotal

const Usage = () => {
  const [count, setCount] = useState(0)
  const handleClap = (clapState) => {
    setCount(clapState.count)
  }
  return (
    <div style={{}}>
      <MediumClap onClap={handleClap}>
        <MediumClap.Icon />
        <MediumClap.Count />
        <MediumClap.Total />
      </MediumClap>
      <div>You have clapped {count}</div>
    </div>
  )
}

export default Usage
