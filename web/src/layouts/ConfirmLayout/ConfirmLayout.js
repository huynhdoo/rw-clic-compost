import { Transition } from '@headlessui/react'
import { useState, useEffect } from 'react'

const ConfirmLayout = (props) => {
  let [isShowing, setIsShowing] = useState(false)
  useEffect(() => {
  // Update the transition state after component mounting
      setIsShowing(true)
  });

  const imageUrl = "https://ik.imagekit.io/dttv/SHOOTING/DETRI_211007_672_xq8S3r6j5.jpg?ik-sdk-version=javascript-1.4.3&updatedAt=1651843629362"
  return (
    <div className="p-6 min-h-screen bg-gray-300 bg-cover bg-no-repeat bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
       <Transition
          appear={true}
          show={isShowing}
          enter="transition-opacity duration-[1500ms] ease-in-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave=" transition-opacity duration-[1500ms] ease-in-out"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {props.children}
      </Transition>
    </div>
  )
};

export default ConfirmLayout
